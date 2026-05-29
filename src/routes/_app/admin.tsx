import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { listAllUsers, updateUser, broadcast, listPayments, getAppSettings, updateAppSettings } from "@/lib/admin.functions";
import { refreshSignals } from "@/lib/signals.functions";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, RefreshCw, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — SFX" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;
  if (!isAdmin) throw redirect({ to: "/" });
  return <AdminDashboard />;
}

function AdminDashboard() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAllUsers);
  const fetchPayments = useServerFn(listPayments);
  const fetchSettings = useServerFn(getAppSettings);
  const doUpdate = useServerFn(updateUser);
  const doBroadcast = useServerFn(broadcast);
  const doRefresh = useServerFn(refreshSignals);
  const doSettings = useServerFn(updateAppSettings);

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const payments = useQuery({ queryKey: ["admin-payments"], queryFn: () => fetchPayments() });
  const settings = useQuery({ queryKey: ["app_settings"], queryFn: () => fetchSettings() });

  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const setPlan = async (id: string, plan: "none" | "lite" | "pro" | "premium") => {
    try { await doUpdate({ data: { userId: id, plan, status: "approved" } }); qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(`Plan → ${plan}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const setStatus = async (id: string, status: "approved" | "pending" | "blocked") => {
    try { await doUpdate({ data: { userId: id, status } }); qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(`Status → ${status}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const doBroad = async () => {
    if (!title) return toast.error("Title required");
    try { await doBroadcast({ data: { title, body } }); setTitle(""); setBody(""); toast.success("Broadcast sent"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const refreshNow = async () => {
    setRefreshing(true);
    try { const r = await doRefresh(); toast.success(`Refreshed: ${r.results.filter((x) => x.action.startsWith("created")).length} new`); qc.invalidateQueries({ queryKey: ["signals"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setRefreshing(false); }
  };

  const s = settings.data?.settings;
  const [eaName, setEaName] = useState("");
  const saveSettings = async () => {
    try { await doSettings({ data: { ea_name: eaName || s?.ea_name } }); qc.invalidateQueries({ queryKey: ["app_settings"] }); toast.success("Settings saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2"><ShieldCheck className="text-primary" /><h1 className="text-2xl font-bold text-glow">Admin</h1></div>

      <GlassCard glow="blue">
        <h2 className="font-semibold">Signal generator</h2>
        <p className="text-xs text-muted-foreground mt-1">Recompute EMA9/21 crossovers for all 7 pairs.</p>
        <GlowButton onClick={refreshNow} disabled={refreshing} className="mt-3 w-full">
          {refreshing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} Refresh signals
        </GlowButton>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold flex items-center gap-2"><Megaphone size={16} /> Broadcast</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
          className="w-full mt-3 glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/10 outline-none focus:border-primary/40" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body (optional)" rows={2}
          className="w-full mt-2 glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/10 outline-none focus:border-primary/40" />
        <GlowButton onClick={doBroad} className="mt-3 w-full">Send to all</GlowButton>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold">App settings</h2>
        <input defaultValue={s?.ea_name ?? ""} onChange={(e) => setEaName(e.target.value)} placeholder="EA name"
          className="w-full mt-3 glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/10 outline-none focus:border-primary/40" />
        <GlowButton onClick={saveSettings} className="mt-3 w-full">Save</GlowButton>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold">Payment requests</h2>
        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
          {(payments.data?.payments ?? []).map((p) => (
            <div key={p.id} className="glass rounded-xl px-3 py-2 text-xs flex justify-between">
              <div>
                <p className="font-semibold uppercase">{p.plan} · R{p.amount_zar}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setPlan(p.user_id, p.plan as "lite" | "pro" | "premium")} className="text-primary underline">Activate</button>
            </div>
          ))}
          {(payments.data?.payments?.length ?? 0) === 0 && <p className="text-xs text-muted-foreground">No requests yet.</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-semibold">Members ({users.data?.users.length ?? 0})</h2>
        <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
          {(users.data?.users ?? []).map((u) => (
            <div key={u.id} className="glass rounded-xl px-3 py-2 text-xs">
              <p className="font-semibold">@{u.username ?? "—"} <span className="text-muted-foreground font-normal">· {u.email}</span></p>
              <p className="text-[10px] text-muted-foreground">{u.status} · {u.plan}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <PillBtn onClick={() => setStatus(u.id, "approved")}>Approve</PillBtn>
                <PillBtn onClick={() => setStatus(u.id, "blocked")}>Block</PillBtn>
                <PillBtn onClick={() => setPlan(u.id, "lite")}>Lite</PillBtn>
                <PillBtn onClick={() => setPlan(u.id, "pro")}>Pro</PillBtn>
                <PillBtn onClick={() => setPlan(u.id, "premium")}>Premium</PillBtn>
                <PillBtn onClick={() => setPlan(u.id, "none")}>Reset</PillBtn>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function PillBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-[10px]">{children}</button>;
}
