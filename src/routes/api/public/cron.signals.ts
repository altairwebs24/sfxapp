import { createFileRoute } from "@tanstack/react-router";
import { refreshSignals } from "@/lib/signals.functions";

// External cron-friendly endpoint to recompute signals.
// Call: POST https://<project>.lovable.app/api/public/cron/signals
//       with header  x-cron-secret: <CRON_SECRET>
export const Route = createFileRoute("/api/public/cron/signals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-cron-secret");
        const expected = process.env.CRON_SECRET;
        if (expected && secret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const result = await refreshSignals();
          return Response.json(result);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return new Response(JSON.stringify({ error: msg }), { status: 500 });
        }
      },
      GET: async () => new Response("Use POST", { status: 405 }),
    },
  },
});
