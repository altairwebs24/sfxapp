import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { listSignals, PAIRS } from "@/lib/signals.functions";
import {
  ArrowDownRight, ArrowUpRight, TrendingUp, Loader2, RefreshCw,
  DollarSign, PoundSterling, JapaneseYen, Bitcoin, Gem, BarChart3, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/signals")({
  head: () => ({ meta: [{ title: "Live Signals — SFX" }] }),
  component: SignalsPage,
});

const PAIR_ICONS: Record<string, typeof DollarSign> = {
  EURUSD: DollarSign,
  GBPUSD: PoundSterling,
  USDJPY: JapaneseYen,
  AUDUSD: DollarSign,
  NZDUSD: DollarSign,
  USDCAD: DollarSign,
  XAUUSD: Gem,
  BTCUSD: Bitcoin,
};

function SignalsPage() {
  const fetchSignals = useServerFn(listSignals);
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["signals"], queryFn: () => fetchSignals(), refetchInterval: 30_000,
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  const selectedActive = selected ? active.filter((s) => s.pair === selected) : [];

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="glass-strong rounded-full px-4 py-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-widest text-white/60 truncate">Live Signals</p>
          <p className="text-sm font-bold truncate">@SimphiweFX</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHistory(true)}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center active:scale-95"
            aria-label="Past signals"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => refetch()}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center active:scale-95"
            aria-label="Refresh"
          >
            {isFetching ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {/* Live market header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <h1 className="text-2xl font-black">Live Market</h1>
        </div>
        <span className="text-[10px] text-white/50 font-mono">00:30–23:30 SAST</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white" /></div>
      ) : (
        <>
          {/* Pair tile grid */}
          <div className="grid grid-cols-2 gap-3">
            {PAIRS.map((p) => {
              const Icon = PAIR_ICONS[p.pair] ?? DollarSign;
              const hasActive = active.some((s) => s.pair === p.pair);
              return (
                <button
                  key={p.pair}
                  onClick={() => setSelected(p.pair)}
                  className="glass rounded-3xl p-4 flex flex-col items-start gap-3 aspect-square active:scale-95 transition-transform relative overflow-hidden"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasActive ? "bg-white animate-pulse" : "bg-white/40"}`} />
                    <span className="text-[10px] uppercase tracking-widest text-white/70">Live</span>
                  </div>
                  <div className="flex-1 w-full flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                      <Icon className="text-white" size={36} strokeWidth={1.6} />
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-lg leading-tight">{p.pair}</p>
                    <p className="text-[11px] font-mono text-white/60">Tap for live</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Selected pair sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-black border-t border-white/15 rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">{selected}</h2>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            {selectedActive.length === 0 ? (
              <GlassCard><p className="text-sm text-white/60 text-center py-4">No active signal on {selected}. Scanner runs every few minutes.</p></GlassCard>
            ) : (
              <div className="space-y-3">{selectedActive.map((s) => <SignalRow key={s.id} s={s} />)}</div>
            )}
          </div>
        </div>
      )}

      {/* Past signals sheet */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md bg-black border-t border-white/15 rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black">Past Signals</h2>
                <p className="text-[11px] text-white/50">Recent results</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            {closed.length === 0 ? (
              <GlassCard><p className="text-sm text-white/60 text-center py-4">No closed signals yet.</p></GlassCard>
            ) : (
              <div className="space-y-3">{closed.map((s) => <SignalRow key={s.id} s={s} dimmed />)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Sig = { id: string; pair: string; side: string; entry: number; take_profit: number; stop_loss: number; status: string; tp_percent: number; reason: string | null; created_at: string };

function SignalRow({ s, dimmed }: { s: Sig; dimmed?: boolean }) {
  const buy = s.side === "BUY";
  const decimals = s.pair.includes("JPY") ? 3 : s.pair === "XAUUSD" ? 2 : s.pair === "BTCUSD" || s.pair === "DJI" ? 1 : 5;
  return (
    <GlassCard className={dimmed ? "opacity-60" : ""}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
            {buy ? <ArrowUpRight className="text-white" size={20} /> : <ArrowDownRight className="text-white" size={20} />}
          </div>
          <div>
            <p className="font-bold">{s.pair}</p>
            <p className="text-xs font-semibold text-white/70">{s.side}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50">Entry</p>
          <p className="font-mono text-sm">{s.entry.toFixed(decimals)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="bg-white/5 rounded-xl py-2">
          <p className="text-[10px] text-white/50">TP</p>
          <p className="font-mono text-xs">{s.take_profit.toFixed(decimals)}</p>
        </div>
        <div className="bg-white/5 rounded-xl py-2">
          <p className="text-[10px] text-white/50">SL</p>
          <p className="font-mono text-xs">{s.stop_loss.toFixed(decimals)}</p>
        </div>
        <div className="bg-white/5 rounded-xl py-2">
          <p className="text-[10px] text-white/50">TP %</p>
          <p className="font-mono text-xs flex items-center justify-center gap-1">
            <TrendingUp size={10} />{s.tp_percent}%
          </p>
        </div>
      </div>
      {s.reason && <p className="text-[11px] text-white/50 mt-3">{s.reason}</p>}
    </GlassCard>
  );
}
