import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// 7 pairs mapped to TwelveData symbols.
export const PAIRS = [
  { pair: "USDJPY", symbol: "USD/JPY", pip: 0.01, tpPips: 30, slPips: 15 },
  { pair: "EURUSD", symbol: "EUR/USD", pip: 0.0001, tpPips: 30, slPips: 15 },
  { pair: "GBPUSD", symbol: "GBP/USD", pip: 0.0001, tpPips: 30, slPips: 15 },
  { pair: "NZDUSD", symbol: "NZD/USD", pip: 0.0001, tpPips: 30, slPips: 15 },
  { pair: "XAUUSD", symbol: "XAU/USD", pip: 1, tpPips: 5, slPips: 2.5 },
  { pair: "BTCUSD", symbol: "BTC/USD", pip: 100, tpPips: 10, slPips: 5 },
  { pair: "DJI", symbol: "DJI", pip: 1, tpPips: 50, slPips: 25 },
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

async function fetchSeries(symbol: string, apiKey: string) {
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1h&outputsize=60&apikey=${apiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === "error") throw new Error(`TwelveData ${symbol}: ${json.message}`);
  const values = (json.values as Array<{ close: string; datetime: string }>) || [];
  return values.reverse().map((v) => parseFloat(v.close));
}

export const refreshSignals = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) throw new Error("TWELVEDATA_API_KEY not configured");

  const results: { pair: string; action: string; error?: string }[] = [];
  for (const p of PAIRS) {
    try {
      const closes = await fetchSeries(p.symbol, apiKey);
      if (closes.length < 25) { results.push({ pair: p.pair, action: "skip:no_data" }); continue; }
      const e9 = ema(closes, 9);
      const e21 = ema(closes, 21);
      const last = closes.at(-1)!;
      const prev9 = e9.at(-2)!; const prev21 = e21.at(-2)!;
      const cur9 = e9.at(-1)!; const cur21 = e21.at(-1)!;

      let side: "BUY" | "SELL" | null = null;
      let reason = "";
      if (prev9 <= prev21 && cur9 > cur21) { side = "BUY"; reason = "EMA9 crossed above EMA21 (H1)"; }
      else if (prev9 >= prev21 && cur9 < cur21) { side = "SELL"; reason = "EMA9 crossed below EMA21 (H1)"; }

      if (!side) { results.push({ pair: p.pair, action: "no_crossover" }); continue; }

      // Skip if an active signal already exists for this pair.
      const { data: active } = await supabaseAdmin
        .from("signals").select("id").eq("pair", p.pair).eq("status", "active").limit(1);
      if (active && active.length) { results.push({ pair: p.pair, action: "active_exists" }); continue; }

      const tpDist = p.pip * p.tpPips;
      const slDist = p.pip * p.slPips;
      const entry = last;
      const tp = side === "BUY" ? entry + tpDist : entry - tpDist;
      const sl = side === "BUY" ? entry - slDist : entry + slDist;

      const { error } = await supabaseAdmin.from("signals").insert({
        pair: p.pair, side, entry, take_profit: tp, stop_loss: sl, reason, status: "active", tp_percent: 0,
      });
      if (error) { results.push({ pair: p.pair, action: "error", error: error.message }); continue; }

      await supabaseAdmin.from("notifications").insert({
        title: `New ${side.toUpperCase()} signal — ${p.pair}`,
        body: `Entry ${entry.toFixed(p.pip < 1 ? 5 : 2)} • TP ${tp.toFixed(p.pip < 1 ? 5 : 2)} • SL ${sl.toFixed(p.pip < 1 ? 5 : 2)}`,
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
    const { error } = await supabaseAdmin.from("signals")
      .update({ status: "closed", closed_at: new Date().toISOString(), tp_percent: data.tpPercent })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
