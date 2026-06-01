import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function getScannerKey() {
  return process.env.TWELVEDATA_SCANNER_KEY || process.env.TWELVEDATA_API_KEY || "11bef1edd9e64026b1aab224a31695a4";
}

const SYS = `You are a precise trading-chart inspector. Given ONE chart screenshot, identify:
1) The exact instrument symbol displayed (normalised to uppercase, no slash or hyphen). Examples: EURUSD, GBPUSD, USDJPY, AUDUSD, NZDUSD, USDCAD, USDCHF, EURJPY, GBPJPY, XAUUSD, BTCUSD.
2) The chart timeframe shown (M1, M5, M15, M30, H1, H4, D1, W1).
3) The directional bias from the last 5 visible candles + EMA structure: BUY (bullish) or SELL (bearish).
Be decisive — never hedge. ONLY reply via the provided tool.`;

type Cfg = { td: string; point: number; tp: number; sl: number; digits: number };
const PAIR_CONFIG: Record<string, Cfg> = {
  EURUSD: { td: "EUR/USD", point: 0.00001, tp: 70, sl: 30, digits: 5 },
  GBPUSD: { td: "GBP/USD", point: 0.00001, tp: 70, sl: 30, digits: 5 },
  USDJPY: { td: "USD/JPY", point: 0.001,   tp: 70, sl: 30, digits: 3 },
  AUDUSD: { td: "AUD/USD", point: 0.00001, tp: 70, sl: 30, digits: 5 },
  NZDUSD: { td: "NZD/USD", point: 0.00001, tp: 70, sl: 30, digits: 5 },
  USDCAD: { td: "USD/CAD", point: 0.00001, tp: 70, sl: 30, digits: 5 },
  USDCHF: { td: "USD/CHF", point: 0.00001, tp: 70, sl: 30, digits: 5 },
  EURJPY: { td: "EUR/JPY", point: 0.001,   tp: 70, sl: 30, digits: 3 },
  GBPJPY: { td: "GBP/JPY", point: 0.001,   tp: 70, sl: 30, digits: 3 },
  XAUUSD: { td: "XAU/USD", point: 0.01,    tp: 4300, sl: 2000, digits: 2 },
  BTCUSD: { td: "BTC/USD", point: 0.01,    tp: 200000, sl: 100000, digits: 2 },
};

export const analyseChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    imageBase64: z.string().min(100).max(8_000_000),
    mimeType: z.string().min(3).max(50),
    note: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const aiKey = process.env.LOVABLE_API_KEY;
    if (!aiKey) return { ok: false as const, error: "AI not configured" };

    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: [
            { type: "text", text: data.note ? `Trader note: ${data.note}` : "Inspect this chart." },
            { type: "image_url", image_url: { url: dataUrl } },
          ] },
        ],
        tools: [{ type: "function", function: {
          name: "report",
          description: "Return identified pair, timeframe and bias.",
          parameters: {
            type: "object",
            properties: {
              pair: { type: "string", description: "Uppercase symbol, no slash" },
              timeframe: { type: "string" },
              bias: { type: "string", enum: ["BUY", "SELL"] },
              notes: { type: "string", description: "1 short sentence why" },
            },
            required: ["pair", "timeframe", "bias", "notes"],
          },
        }}],
        tool_choice: { type: "function", function: { name: "report" } },
      }),
    });

    if (aiRes.status === 429) return { ok: false as const, error: "AI rate limit — try again shortly." };
    if (aiRes.status === 402) return { ok: false as const, error: "AI credits exhausted." };
    if (!aiRes.ok) {
      console.error("scanner gateway", aiRes.status, await aiRes.text().catch(() => ""));
      return { ok: false as const, error: "Scanner unavailable." };
    }

    const aiJson = await aiRes.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return { ok: false as const, error: "Could not read the chart. Try a clearer screenshot." };
    let parsed: { pair: string; timeframe: string; bias: "BUY" | "SELL"; notes: string };
    try { parsed = JSON.parse(call.function.arguments); }
    catch { return { ok: false as const, error: "Bad analysis response." }; }

    const key = parsed.pair.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cfg = PAIR_CONFIG[key];
    if (!cfg) {
      return { ok: false as const, error: `Detected "${parsed.pair}" but it's not supported yet. Supported: ${Object.keys(PAIR_CONFIG).join(", ")}.` };
    }

    // Live price (scanner-only TwelveData key)
    const priceRes = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(cfg.td)}&apikey=${getScannerKey()}`);
    const priceJson = await priceRes.json();
    if (priceJson.status === "error" || !priceJson.price) {
      return { ok: false as const, error: `Live price unavailable: ${priceJson.message ?? "unknown error"}` };
    }
    const entry = parseFloat(priceJson.price);
    const tpDist = cfg.point * cfg.tp;
    const slDist = cfg.point * cfg.sl;
    const tp = parsed.bias === "BUY" ? entry + tpDist : entry - tpDist;
    const sl = parsed.bias === "BUY" ? entry - slDist : entry + slDist;

    return {
      ok: true as const,
      pair: key,
      timeframe: parsed.timeframe,
      bias: parsed.bias,
      notes: parsed.notes,
      entry: +entry.toFixed(cfg.digits),
      tp: +tp.toFixed(cfg.digits),
      sl: +sl.toFixed(cfg.digits),
      digits: cfg.digits,
      generated_at: new Date().toISOString(),
    };
  });
