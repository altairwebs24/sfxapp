import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAIR_IDS } from "@/lib/market-pairs";
import { closeSignalAsAdmin, generateSignalForPair, refreshAllSignals } from "@/lib/signals.server";

export const refreshSignals = createServerFn({ method: "POST" }).handler(async () => {
  return refreshAllSignals();
});

export const generatePairSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ pair: z.enum(PAIR_IDS) }).parse(d))
  .handler(async ({ data }) => generateSignalForPair(data.pair));

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
    return closeSignalAsAdmin(data.id, data.tpPercent);
  });
