import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPairConfig, PAIRS, type PairCfg } from "@/lib/market-pairs";

type Bar = { open: number; high: number; low: number; close: number; datetime?: string };
type Side = "BUY" | "SELL";
type Setup = { side: Side; strategy: string; reason: string; score: number; bars: Bar[]; interval: string };

function getFinnhubKey() {
  return process.env.FINNHUB_API_KEY || "d8er0opr01qub7kec8p0d8er0opr01qub7kec8pg";
}

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const out: number[] = Array(period - 1).fill(NaN).concat([prev]);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function rsi(values: number[], period = 14) {
  if (values.length < period + 1) return NaN;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgG = (avgG * (period - 1) + Math.max(d, 0)) / period;
    avgL = (avgL * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function atr(bars: Bar[], period = 14) {
  if (bars.length < period + 1) return 0;
  const ranges = bars.slice(1).map((b, i) => {
    const prevClose = bars[i].close;
    return Math.max(b.high - b.low, Math.abs(b.high - prevClose), Math.abs(b.low - prevClose));
  });
  return ranges.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function bodyStrength(bar: Bar) {
  return Math.abs(bar.close - bar.open) / Math.max(bar.high - bar.low, 1e-9);
}

async function fetchSeriesFull(symbol: string, interval = "1h", outputsize = 140) {
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${getTwelveDataKey()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === "error") throw new Error(`TwelveData ${symbol}: ${json.message}`);
  const values = (json.values as Array<{ datetime?: string; open: string; high: string; low: string; close: string }>) || [];
  return values.reverse().map((v) => ({
    datetime: v.datetime,
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
  })).filter((v) => Number.isFinite(v.close));
}

async function fetchLivePrice(symbol: string): Promise<number> {
  const res = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${getTwelveDataKey()}`);
  const j = await res.json();
  if (j.status === "error" || !j.price) throw new Error(j.message ?? "no price");
  return parseFloat(j.price);
}

function makeSignal(p: PairCfg, setup: Setup, entry: number) {
  const volatility = Math.max(atr(setup.bars.slice(-24)), p.point * p.slPoints);
  const slDist = Math.max(volatility, p.point * p.slPoints);
  const tpDist = Math.max(slDist * 2, p.point * p.tpPoints);
  const stop_loss = setup.side === "BUY" ? entry - slDist : entry + slDist;
  const take_profit = setup.side === "BUY" ? entry + tpDist : entry - tpDist;
  return {
    pair: p.pair,
    side: setup.side,
    entry: +entry.toFixed(p.digits),
    take_profit: +take_profit.toFixed(p.digits),
    stop_loss: +stop_loss.toFixed(p.digits),
    digits: p.digits,
    strategy: setup.strategy,
    reason: setup.reason,
    timeframe: setup.interval,
    generated_at: new Date().toISOString(),
  };
}

function supportResistanceSetup(bars: Bar[], interval: string): Setup | null {
  if (bars.length < 45) return null;
  const closes = bars.map((b) => b.close);
  const last = bars.at(-1)!;
  const prev = bars.at(-2)!;
  const base = bars.slice(-45, -5);
  const resistance = Math.max(...base.map((b) => b.high));
  const support = Math.min(...base.map((b) => b.low));
  const buffer = Math.max(atr(bars.slice(-30)) * 0.35, Math.abs(resistance - support) * 0.035);
  const momentum = rsi(closes);
  if (last.low <= support + buffer && last.close > last.open && momentum < 58) {
    return { side: "BUY", strategy: "Support & Resistance", reason: "Price rejected the marked support zone with bullish confirmation.", score: 76, bars, interval };
  }
  if (last.high >= resistance - buffer && last.close < last.open && momentum > 42) {
    return { side: "SELL", strategy: "Support & Resistance", reason: "Price rejected the marked resistance zone with bearish confirmation.", score: 76, bars, interval };
  }
  if (prev.close <= resistance && last.close > resistance && last.low <= resistance + buffer && bodyStrength(last) > 0.45) {
    return { side: "BUY", strategy: "Support & Resistance", reason: "Resistance broke and acted as new support on the retest.", score: 79, bars, interval };
  }
  if (prev.close >= support && last.close < support && last.high >= support - buffer && bodyStrength(last) > 0.45) {
    return { side: "SELL", strategy: "Support & Resistance", reason: "Support broke and acted as new resistance on the retest.", score: 79, bars, interval };
  }
  return null;
}

function breakoutRetestSetup(bars: Bar[], interval: string): Setup | null {
  if (bars.length < 55) return null;
  const last = bars.at(-1)!;
  const prior = bars.slice(-38, -8);
  const priorHigh = Math.max(...prior.map((b) => b.high));
  const priorLow = Math.min(...prior.map((b) => b.low));
  const buffer = atr(bars.slice(-30)) * 0.45;
  if (last.low <= priorHigh + buffer && last.close > priorHigh && bodyStrength(last) > 0.35) {
    return { side: "BUY", strategy: "Breakout & Retest", reason: "Breakout above structure retested a nearby zone before continuation.", score: 84, bars, interval };
  }
  if (last.high >= priorLow - buffer && last.close < priorLow && bodyStrength(last) > 0.35) {
    return { side: "SELL", strategy: "Breakout & Retest", reason: "Breakdown below structure retested a nearby zone before continuation.", score: 84, bars, interval };
  }
  return null;
}

function amdSetup(bars: Bar[], interval: string): Setup | null {
  if (bars.length < 70) return null;
  const accumulation = bars.slice(-64, -24);
  const recent = bars.slice(-24);
  const accHigh = Math.max(...accumulation.map((b) => b.high));
  const accLow = Math.min(...accumulation.map((b) => b.low));
  const range = accHigh - accLow;
  const avgAtr = atr(bars.slice(-70), 14);
  const last = bars.at(-1)!;
  if (range > avgAtr * 7) return null;
  const ranHigh = recent.some((b) => b.high > accHigh + avgAtr * 0.35);
  const ranLow = recent.some((b) => b.low < accLow - avgAtr * 0.35);
  if (ranHigh && last.close < accHigh && last.close < last.open) {
    return { side: "SELL", strategy: "Power of Three (AMD)", reason: "Accumulation was followed by an upper liquidity manipulation and bearish distribution.", score: 88, bars, interval };
  }
  if (ranLow && last.close > accLow && last.close > last.open) {
    return { side: "BUY", strategy: "Power of Three (AMD)", reason: "Accumulation was followed by a lower liquidity manipulation and bullish distribution.", score: 86, bars, interval };
  }
  return null;
}

function findRecentFvg(bars: Bar[]) {
  for (let i = bars.length - 1; i >= Math.max(2, bars.length - 22); i--) {
    const a = bars[i - 2];
    const c = bars[i];
    if (a.high < c.low) return { kind: "bullish" as const, low: a.high, high: c.low, index: i };
    if (a.low > c.high) return { kind: "bearish" as const, low: c.high, high: a.low, index: i };
  }
  return null;
}

function silverBulletSetup(pair: string, bars: Bar[], interval: string): Setup | null {
  if (!pair.includes("USD") && pair !== "XAUUSD") return null;
  const sastHour = Number(new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", hour12: false }).format(new Date()));
  if (sastHour < 17 || sastHour > 19 || bars.length < 40) return null;
  const fvg = findRecentFvg(bars);
  if (!fvg) return null;
  const last = bars.at(-1)!;
  const liquidity = bars.slice(-36, -6);
  const high = Math.max(...liquidity.map((b) => b.high));
  const low = Math.min(...liquidity.map((b) => b.low));
  if (last.low <= fvg.high && last.high >= fvg.low && fvg.kind === "bullish" && last.close > last.open && bars.slice(-8).some((b) => b.low < low)) {
    return { side: "BUY", strategy: "ICT Silver Bullet", reason: "New York-window liquidity sweep returned into a bullish imbalance.", score: 93, bars, interval };
  }
  if (last.low <= fvg.high && last.high >= fvg.low && fvg.kind === "bearish" && last.close < last.open && bars.slice(-8).some((b) => b.high > high)) {
    return { side: "SELL", strategy: "ICT Silver Bullet", reason: "New York-window liquidity sweep returned into a bearish imbalance.", score: 93, bars, interval };
  }
  return null;
}

function liquidityImbalanceSetup(bars: Bar[], interval: string): Setup | null {
  if (bars.length < 55) return null;
  const fvg = findRecentFvg(bars);
  if (!fvg) return null;
  const last = bars.at(-1)!;
  const liquidity = bars.slice(-45, -10);
  const high = Math.max(...liquidity.map((b) => b.high));
  const low = Math.min(...liquidity.map((b) => b.low));
  const retestingFvg = last.low <= fvg.high && last.high >= fvg.low;
  const sweptLow = bars.slice(-12).some((b) => b.low < low && b.close > low);
  const sweptHigh = bars.slice(-12).some((b) => b.high > high && b.close < high);
  const ranLow = bars.slice(-12).some((b) => b.close < low && bodyStrength(b) > 0.5);
  const ranHigh = bars.slice(-12).some((b) => b.close > high && bodyStrength(b) > 0.5);
  if (retestingFvg && fvg.kind === "bullish" && (sweptLow || ranHigh) && last.close > last.open) {
    return { side: "BUY", strategy: "ICT Liquidity + Imbalance", reason: "Liquidity was taken and price retested a bullish imbalance.", score: 91, bars, interval };
  }
  if (retestingFvg && fvg.kind === "bearish" && (sweptHigh || ranLow) && last.close < last.open) {
    return { side: "SELL", strategy: "ICT Liquidity + Imbalance", reason: "Liquidity was taken and price retested a bearish imbalance.", score: 91, bars, interval };
  }
  return null;
}

async function selectBestSetup(p: PairCfg) {
  const [hourly, m15, m5] = await Promise.all([
    fetchSeriesFull(p.symbol, "1h", 140),
    fetchSeriesFull(p.symbol, "15min", 140),
    fetchSeriesFull(p.symbol, "5min", 120),
  ]);
  const setups = [
    supportResistanceSetup(hourly, "1h"),
    breakoutRetestSetup(hourly, "1h"),
    amdSetup(m15, "15m"),
    silverBulletSetup(p.pair, m5, "5m"),
    liquidityImbalanceSetup(m15, "15m"),
  ].filter(Boolean) as Setup[];
  return setups.sort((a, b) => b.score - a.score)[0] ?? null;
}

export async function generateSignalForPair(pair: string) {
  const p = getPairConfig(pair);
  if (!p) throw new Error("Unsupported pair");
  const setup = await selectBestSetup(p);
  if (!setup) return { ok: false as const, pair: p.pair, message: "No signal" };
  const entry = await fetchLivePrice(p.symbol);
  return { ok: true as const, signal: makeSignal(p, setup, entry) };
}

export async function refreshAllSignals() {
  const results: { pair: string; action: string; error?: string }[] = [];
  for (const p of PAIRS) {
    try {
      const generated = await generateSignalForPair(p.pair);
      if (!generated.ok) { results.push({ pair: p.pair, action: "no_signal" }); continue; }
      const signal = generated.signal;
      const { data: active } = await supabaseAdmin
        .from("signals").select("id").eq("pair", p.pair).eq("status", "active").limit(1);
      if (active && active.length) { results.push({ pair: p.pair, action: "active_exists" }); continue; }
      const { error } = await supabaseAdmin.from("signals").insert({
        pair: signal.pair,
        side: signal.side,
        entry: signal.entry,
        take_profit: signal.take_profit,
        stop_loss: signal.stop_loss,
        reason: `${signal.strategy}: ${signal.reason}`,
        status: "active",
        tp_percent: 0,
      });
      if (error) { results.push({ pair: p.pair, action: "error", error: error.message }); continue; }
      await supabaseAdmin.from("notifications").insert({
        title: `New ${signal.side} signal — ${p.pair}`,
        body: `Entry ${signal.entry.toFixed(p.digits)} • TP ${signal.take_profit.toFixed(p.digits)} • SL ${signal.stop_loss.toFixed(p.digits)}`,
        is_broadcast: true,
      });
      results.push({ pair: p.pair, action: `created:${signal.side}` });
    } catch (e) {
      results.push({ pair: p.pair, action: "error", error: e instanceof Error ? e.message : "unknown" });
    }
  }
  return { results, generated_at: new Date().toISOString() };
}

export async function closeSignalAsAdmin(id: string, tpPercent: number) {
  const newStatus = tpPercent >= 0 ? "tp_hit" : "sl_hit";
  const { error } = await supabaseAdmin.from("signals")
    .update({ status: newStatus, closed_at: new Date().toISOString(), tp_percent: tpPercent })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}