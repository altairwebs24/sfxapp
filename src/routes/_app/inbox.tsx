import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/inbox")({
  head: () => ({ meta: [{ title: "Inbox — SFX" }] }),
  component: InboxPage,
});

function InboxPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications")
        .select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("notifs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

  const notifs = data ?? [];
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-glow">Inbox</h1>
      {notifs.length === 0 ? (
        <GlassCard className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto glow-soft"><Bell className="text-primary" size={20} /></div>
          <p className="text-sm text-muted-foreground mt-3">No notifications yet.</p>
        </GlassCard>
      ) : notifs.map((n) => (
        <GlassCard key={n.id} className="bounce-in">
          <p className="font-semibold text-sm">{n.title}</p>
          {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
          <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(n.created_at).toLocaleString()}</p>
        </GlassCard>
      ))}
    </div>
  );
}
