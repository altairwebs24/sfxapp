import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createPaymentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    plan: z.enum(["lite", "pro", "premium", "education"]),
    amountZar: z.number().min(1).max(100000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("payment_requests")
      .insert({ user_id: context.userId, plan: data.plan, amount_zar: data.amountZar, status: "awaiting_payment" })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
