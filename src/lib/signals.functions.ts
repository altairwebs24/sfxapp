import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TD_SIGNALS_KEY = process.env.TWELVEDATA_SIGNALS_KEY || process.env.TWELVEDATA_API_KEY || "71193c29f14e4d2e8226939d6a26f263";

type PairCfg = { pair: string; symbol: string; point: number; tpPoints: number; slPoints: number; digits: number };

export const PAIRS: PairCfg[] = [
  { pair: "EURUSD", symbol: "EUR/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "GBPUSD", symbol: "GBP/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "USDJPY", symbol: "USD/JPY", point: 0.001,   tpPoints: 70, slPoints: 30, digits: 3 },
  { pair: "AUDUSD", symbol: "AUD/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "NZDUSD", symbol: "NZD/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "USDCAD", symbol: "USD/CAD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "XAUUSD", symbol: "XAU/USD", point: 0.01,    tpPoints: 4300, slPoints: 2000, digits: 2 },
  { pair: "BTCUSD", symbol: "BTC/USD", point: 0.01,    tpPoints: 200000, slPoints: 100000, digits: 2 },
];

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
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgG = gains / period, avgL = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgG = (avgG * (period - 1) + Math.max(d, 0)) / period;
    avgL = (avgL * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

async function fetchSeriesFull(symbol: string) {
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1h&outputsize=120&apikey=${TD_SIGNALS_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === "error") throw new Error(`TwelveData ${symbol}: ${json.message}`);
  const values = (json.values as Array<{ open: string; high: string; low: string; close: string }>) || [];
  return values.reverse().map((v) => ({
    open: parseFloat(v.open), high: parseFloat(v.high), low: parseFloat(v.low), close: parseFloat(v.close),
  }));
}

async function fetchLivePrice(symbol: string): Promise<number> {
  const res = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${TD_SIGNALS_KEY}`);
  const j = await res.json();
  if (j.status === "error" || !j.price) throw new Error(j.message ?? "no price");
  return parseFloat(j.price);
}

export const refreshSignals = createServerFn({ method: "POST" }).handler(async () => {
  const results: { pair: string; action: string; error?: string }[] = [];
  for (const p of PAIRS) {
    try {
      const bars = await fetchSeriesFull(p.symbol);
      if (bars.length < 30) { results.push({ pair: p.pair, action: "skip:no_data" }); continue; }
      const closes = bars.map((b) => b.close);
      const e9 = ema(closes, 9);
      const e21 = ema(closes, 21);
      const e50 = ema(closes, 50);
      const prev9 = e9.at(-2)!; const prev21 = e21.at(-2)!;
      const cur9 = e9.at(-1)!; const cur21 = e21.at(-1)!;
      const lastBar = bars.at(-1)!;
      const r = rsi(closes, 14);
      const range20High = Math.max(...bars.slice(-20).map((b) => b.high));
      const range20Low = Math.min(...bars.slice(-20).map((b) => b.low));
      const bodyStrength = Math.abs(lastBar.close - lastBar.open) / Math.max(lastBar.high - lastBar.low, 1e-9);

      // Internal 5-pillar confluence (proprietary): trend cross, higher-tf trend,
      // momentum (RSI), structure break (20-bar range), candle body strength.
      let side: "BUY" | "SELL" | null = null;
      const reasons: string[] = [];
      const trendUp = cur9 > cur21 && (e50.at(-1) ?? 0) <= cur21;
      const trendDn = cur9 < cur21 && (e50.at(-1) ?? Infinity) >= cur21;
      if (prev9 <= prev21 && cur9 > cur21 && trendUp && r > 50 && r < 75 && lastBar.close > range20High * 0.999 && bodyStrength > 0.55) {
        side = "BUY";
        reasons.push("EMA9>EMA21 cross", "RSI bullish", "20-bar high break", "strong body");
      } else if (prev9 >= prev21 && cur9 < cur21 && trendDn && r < 50 && r > 25 && lastBar.close < range20Low * 1.001 && bodyStrength > 0.55) {
        side = "SELL";
        reasons.push("EMA9<EMA21 cross", "RSI bearish", "20-bar low break", "strong body");
      }
      if (!side) { results.push({ pair: p.pair, action: "no_confluence" }); continue; }
      const reason = reasons.join(" • ");

      const { data: active } = await supabaseAdmin
        .from("signals").select("id").eq("pair", p.pair).eq("status", "active").limit(1);
      if (active && active.length) { results.push({ pair: p.pair, action: "active_exists" }); continue; }

      // Use the LIVE price as entry, not a historical close — accuracy fix
      const entry = await fetchLivePrice(p.symbol);
      const tpDist = p.point * p.tpPoints;
      const slDist = p.point * p.slPoints;
      const tp = side === "BUY" ? entry + tpDist : entry - tpDist;
      const sl = side === "BUY" ? entry - slDist : entry + slDist;

      const { error } = await supabaseAdmin.from("signals").insert({
        pair: p.pair, side,
        entry: +entry.toFixed(p.digits),
        take_profit: +tp.toFixed(p.digits),
        stop_loss: +sl.toFixed(p.digits),
        reason, status: "active", tp_percent: 0,
      });
      if (error) { results.push({ pair: p.pair, action: "error", error: error.message }); continue; }

      await supabaseAdmin.from("notifications").insert({
        title: `New ${side} signal — ${p.pair}`,
        body: `Entry ${entry.toFixed(p.digits)} • TP ${tp.toFixed(p.digits)} • SL ${sl.toFixed(p.digits)}`,
        is_broadcast: true,
      });
      results.push({ pair: p.pair, action: `created:${side}` });
    } catch (e) {
      results.push({ pair: p.pair, action: "error", error: e instanceof Error ? e.message : "unknown" });
    }
  }
  return { results, generated_at: new Date().toISOString() };
});

export const listSignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("signals").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return { signals: data ?? [] };
  });

export const closeSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), tpPercent: z.number().min(-100).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const newStatus = data.tpPercent >= 0 ? "tp_hit" : "sl_hit";
    const { error } = await supabaseAdmin.from("signals")
      .update({ status: newStatus, closed_at: new Date().toISOString(), tp_percent: data.tpPercent })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
