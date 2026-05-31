import { createServerFn } from "@tanstack/react-start";

export type EconEvent = {
  name: string;
  iso_utc: string;
  affects: string;
  impact: "high" | "medium";
};

// --- Deterministic helpers ---
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number) {
  // month is 0-indexed; weekday: 0=Sun..6=Sat
  const first = new Date(Date.UTC(year, month, 1));
  const firstWd = first.getUTCDay();
  const offset = (weekday - firstWd + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(Date.UTC(year, month, day));
}

function at(date: Date, h: number, m: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, m, 0)).toISOString();
}

// Known scheduled central-bank decisions (UTC times approximate to announcement)
const FOMC_2026 = ["2026-01-28T19:00:00Z","2026-03-18T18:00:00Z","2026-04-29T18:00:00Z","2026-06-17T18:00:00Z","2026-07-29T18:00:00Z","2026-09-16T18:00:00Z","2026-11-04T19:00:00Z","2026-12-16T19:00:00Z"];
const ECB_2026  = ["2026-01-22T13:15:00Z","2026-03-12T13:15:00Z","2026-04-16T12:15:00Z","2026-06-04T12:15:00Z","2026-07-23T12:15:00Z","2026-09-10T12:15:00Z","2026-10-29T13:15:00Z","2026-12-17T13:15:00Z"];
const BOE_2026  = ["2026-02-05T12:00:00Z","2026-03-19T12:00:00Z","2026-05-07T11:00:00Z","2026-06-18T11:00:00Z","2026-08-06T11:00:00Z","2026-09-17T11:00:00Z","2026-11-05T12:00:00Z","2026-12-17T12:00:00Z"];

export const getEconomicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 86400000); // 60 days
  const events: EconEvent[] = [];

  // Iterate next 3 months for recurring events
  for (let i = 0; i < 3; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const y = d.getUTCFullYear(); const m = d.getUTCMonth();

    // NFP — first Friday, 12:30 UTC (US Nonfarm Payrolls release time)
    const nfp = nthWeekdayOfMonth(y, m, 5, 1);
    events.push({ name: "US Nonfarm Payrolls (NFP)", iso_utc: at(nfp, 12, 30), affects: "USD · Gold · Indices", impact: "high" });

    // US CPI — second Wednesday, 12:30 UTC (approx; actual day varies)
    const cpi = nthWeekdayOfMonth(y, m, 3, 2);
    events.push({ name: "US CPI (Inflation)", iso_utc: at(cpi, 12, 30), affects: "USD · Gold · Indices", impact: "high" });

    // US PPI — usually day after CPI
    const ppi = new Date(cpi.getTime() + 86400000);
    events.push({ name: "US PPI", iso_utc: at(ppi, 12, 30), affects: "USD", impact: "medium" });

    // US Unemployment Claims — every Thursday (add the first Thursday of month + 3 more)
    for (let w = 1; w <= 4; w++) {
      const thu = nthWeekdayOfMonth(y, m, 4, w);
      if (thu.getUTCMonth() === m) {
        events.push({ name: "US Unemployment Claims", iso_utc: at(thu, 12, 30), affects: "USD", impact: "medium" });
      }
    }
  }

  FOMC_2026.forEach((iso) => events.push({ name: "FOMC Rate Decision", iso_utc: iso, affects: "USD · Gold · BTC · Indices", impact: "high" }));
  ECB_2026.forEach((iso)  => events.push({ name: "ECB Rate Decision",  iso_utc: iso, affects: "EUR · DXY", impact: "high" }));
  BOE_2026.forEach((iso)  => events.push({ name: "BoE Rate Decision",  iso_utc: iso, affects: "GBP", impact: "high" }));

  const filtered = events
    .filter((e) => {
      const t = new Date(e.iso_utc).getTime();
      return t > now.getTime() && t < horizon.getTime();
    })
    .sort((a, b) => new Date(a.iso_utc).getTime() - new Date(b.iso_utc).getTime());

  return { events: filtered };
});
