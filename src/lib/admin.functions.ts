import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => r.role === "admin")) throw new Error("Forbidden");
}

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, surname, username, status, plan, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { users: data ?? [] };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    status: z.enum(["pending", "approved", "blocked"]).optional(),
    plan: z.enum(["none", "lite", "pro", "premium"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.status) patch.status = data.status;
    if (data.plan) patch.plan = data.plan;
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
    if (error) throw new Error(error.message);
    if (data.status === "approved" || data.plan) {
      await supabaseAdmin.from("notifications").insert({
        user_id: data.userId,
        title: data.status === "approved" ? "Account approved 🎉" : "Plan updated",
        body: data.plan ? `Your plan is now ${data.plan.toUpperCase()}.` : "Welcome to SIMPHIWEFXACADEMY — start trading.",
      });
    }
    return { ok: true };
  });

export const getAppSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("app_settings").select("*").eq("id", 1).maybeSingle();
  return { settings: data };
});

export const updateAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    app_name: z.string().min(1).max(80).optional(),
    app_short_name: z.string().min(1).max(20).optional(),
    ea_name: z.string().min(1).max(80).optional(),
    ea_logo_url: z.string().url().nullable().optional(),
    auth_wallpaper_url: z.string().url().nullable().optional(),
    theme_accent: z.string().min(3).max(40).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("app_settings")
      .update({ ...data, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const broadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ title: z.string().min(1).max(120), body: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("notifications")
      .insert({ title: data.title, body: data.body ?? null, is_broadcast: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin
      .from("payment_requests").select("*").order("created_at", { ascending: false }).limit(100);
    return { payments: data ?? [] };
  });
