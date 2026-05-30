import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `You are a precise forex economic calendar assistant. Return ONLY the next upcoming HIGH-IMPACT economic events that move forex, gold, indices and crypto markets.
Allowed event names (use these exact short names):
NFP (Non-Farm Payrolls), CPI, Core CPI, PPI, FOMC Rate Decision, FOMC Minutes, GDP, ISM Manufacturing PMI, ISM Services PMI, Retail Sales, Unemployment Rate, Core PCE, JOLTS, ADP Employment, ECB Rate Decision, BoE Rate Decision, BoJ Rate Decision, Powell Speech.
Use the official published US/Global schedules from your knowledge — accurate dates and release times in UTC.
Never include low-impact events.`;

export type EconEvent = { name: string; iso_utc: string; affects: string; importance: "high" | "medium" };

export const getEconomicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { events: [] as EconEvent[] };
  const today = new Date().toISOString();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Today (UTC) is ${today}. Return the next 8 high-impact upcoming events sorted by time ascending. Skip any event already in the past.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_events",
          description: "Return upcoming high-impact economic events.",
          parameters: {
            type: "object",
            properties: {
              events: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    iso_utc: { type: "string", description: "ISO-8601 UTC, e.g. 2026-06-06T12:30:00Z" },
                    affects: { type: "string", description: "Comma-separated pairs/indices" },
                    importance: { type: "string", enum: ["high", "medium"] },
                  },
                  required: ["name", "iso_utc", "affects", "importance"],
                },
              },
            },
            required: ["events"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_events" } },
    }),
  });
  if (!res.ok) return { events: [] as EconEvent[] };
  const json = await res.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return { events: [] as EconEvent[] };
  try {
    const args = JSON.parse(call.function.arguments);
    const events: EconEvent[] = (args.events ?? []).filter((e: EconEvent) => new Date(e.iso_utc).getTime() > Date.now());
    return { events };
  } catch { return { events: [] as EconEvent[] }; }
});
