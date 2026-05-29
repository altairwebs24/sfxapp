import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { listSignals } from "@/lib/signals.functions";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/signals")({
  head: () => ({ meta: [{ title: "Live Signals — SFX" }] }),
  component: SignalsPage,
});

function SignalsPage() {
  const fetchSignals = useServerFn(listSignals);
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["signals"], queryFn: () => fetchSignals(), refetchInterval: 30_000,
  });

  useEffect(() => {
    const ch = supabase.channel("signals-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "signals" }, () => {
        qc.invalidateQueries({ queryKey: ["signals"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const signals = data?.signals ?? [];
  const active = signals.filter((s) => s.status === "active");
  const closed = signals.filter((s) => s.status !== "active");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-glow">Live Signals</h1>
          <p className="text-xs text-muted-foreground">EMA 9/21 H1 crossover · auto-refreshed</p>
        </div>
        <button onClick={() => refetch()} className="w-10 h-10 rounded-full glass flex items-center justify-center" aria-label="Refresh">
          {isFetching ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : signals.length === 0 ? (
        <GlassCard><p className="text-sm text-muted-foreground text-center py-4">No signals yet — the scanner runs every few minutes.</p></GlassCard>
      ) : (
        <>
          <Section title="Active" items={active} />
          {closed.length > 0 && <Section title="Recent history" items={closed} dimmed />}
        </>
      )}
    </div>
  );
}

type Sig = { id: string; pair: string; side: string; entry: number; take_profit: number; stop_loss: number; status: string; tp_percent: number; reason: string | null; created_at: string };

function Section({ title, items, dimmed }: { title: string; items: Sig[]; dimmed?: boolean }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</h2>
      <div className="space-y-3">{items.map((s) => <SignalRow key={s.id} s={s} dimmed={dimmed} />)}</div>
    </section>
  );
}

function SignalRow({ s, dimmed }: { s: Sig; dimmed?: boolean }) {
  const buy = s.side === "BUY";
  const decimals = s.pair.includes("JPY") ? 3 : s.pair === "XAUUSD" ? 2 : s.pair === "BTCUSD" || s.pair === "DJI" ? 1 : 5;
  return (
    <GlassCard className={dimmed ? "opacity-60" : "glow-soft"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${buy ? "bg-primary/20" : "bg-destructive/20"}`}>
            {buy ? <ArrowUpRight className="text-primary" size={20} /> : <ArrowDownRight className="text-destructive" size={20} />}
          </div>
          <div>
            <p className="font-bold">{s.pair}</p>
            <p className={`text-xs font-semibold ${buy ? "text-primary" : "text-destructive"}`}>{s.side}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Entry</p>
          <p className="font-mono text-sm">{s.entry.toFixed(decimals)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="glass rounded-xl py-2">
          <p className="text-[10px] text-muted-foreground">TP</p>
          <p className="font-mono text-xs text-primary">{s.take_profit.toFixed(decimals)}</p>
        </div>
        <div className="glass rounded-xl py-2">
          <p className="text-[10px] text-muted-foreground">SL</p>
          <p className="font-mono text-xs text-destructive">{s.stop_loss.toFixed(decimals)}</p>
        </div>
        <div className="glass rounded-xl py-2">
          <p className="text-[10px] text-muted-foreground">TP %</p>
          <p className="font-mono text-xs flex items-center justify-center gap-1">
            <TrendingUp size={10} />{s.tp_percent}%
          </p>
        </div>
      </div>
      {s.reason && <p className="text-[11px] text-muted-foreground mt-3">{s.reason}</p>}
    </GlassCard>
  );
}

// Re-export so unused-import lint stays quiet if someone wants the trigger button later
export const _utils = { GlowButton };
