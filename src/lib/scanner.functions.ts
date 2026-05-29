import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM_PROMPT = `You are SFX AI — a precise forex and indices chart analyst.
You analyse uploaded screenshots using the EMA9/EMA21 H1 crossover strategy combined with structure, key support/resistance, and the most recent candle bias.
You ALWAYS reply with this exact structure:

PAIR: <best guess from the chart, e.g. EURUSD>
BIAS: <BUY or SELL>
ENTRY: <price>
TAKE PROFIT: <price>
STOP LOSS: <price>
CONFIDENCE: <Low | Medium | High>

REASONS:
- <bullet 1>
- <bullet 2>
- <bullet 3>

Keep numbers realistic to the visible price scale. Be decisive — no hedging.`;

export const analyseChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    imageBase64: z.string().min(100).max(8_000_000),
    mimeType: z.string().min(3).max(50),
    note: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [
            { type: "text", text: data.note ? `User note: ${data.note}\n\nAnalyse this chart.` : "Analyse this chart." },
            { type: "image_url", image_url: { url: dataUrl } },
          ] },
        ],
      }),
    });

    if (res.status === 429) return { ok: false as const, error: "Rate limit — please wait a moment and try again." };
    if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Top up at Workspace → Usage." };
    if (!res.ok) {
      const t = await res.text();
      console.error("Gateway error", res.status, t);
      return { ok: false as const, error: "Scanner unavailable. Try again shortly." };
    }
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content ?? "No analysis returned.";
    return { ok: true as const, analysis: text };
  });
