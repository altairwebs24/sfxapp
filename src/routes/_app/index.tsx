import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/GlassCard";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEconomicEvents, type EconEvent } from "@/lib/economic.functions";
import { listSignals } from "@/lib/signals.functions";
import { canAccess } from "@/lib/whatsapp";
import {
  LineChart, Bot, ScanLine, GraduationCap, LogOut, Inbox, Calendar,
  Sun, Sunset, Moon, ShieldCheck, Lock, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Home — SFX" }] }),
  component: Home,
});

function sastHour() {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", hour: "numeric", hour12: false });
  return parseInt(fmt.format(new Date()), 10);
}
function greetingFor(h: number) {
  if (h < 12) return { text: "GOOD MORNING", icon: Sun };
  if (h < 19) return { text: "GOOD AFTERNOON", icon: Sunset };
  return { text: "GOOD EVENING", icon: Moon };
}

function Home() {
  const { profile, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 60_000); return () => clearInterval(t); }, []);
  const g = greetingFor(sastHour());
  const GIcon = g.icon;
  const dateStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const fetchEvents = useServerFn(getEconomicEvents);
  const { data: econData, isLoading: econLoading } = useQuery({
    queryKey: ["econ"], queryFn: () => fetchEvents(),
    staleTime: 1000 * 60 * 60, refetchOnWindowFocus: false,
  });
  const events = (econData?.events ?? []).filter((e) => new Date(e.iso_utc).getTime() > Date.now()).slice(0, 5);

  const fetchSigs = useServerFn(listSignals);
  const { data: sigData } = useQuery({
    queryKey: ["signals"], queryFn: () => fetchSigs(), refetchInterval: 30_000,
    enabled: canAccess("signals", profile?.plan),
  });
  const activeSignals = (sigData?.signals ?? []).filter((s) => s.status === "active").slice(0, 3);

  // Unread notifications badge
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!profile?.id) return;
    const refresh = async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
        .or(`user_id.eq.${profile.id},is_broadcast.eq.true`).is("read_at", null);
      setUnread(count ?? 0);
    };
    refresh();
    const ch = supabase.channel("notifs-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  // Realtime signal updates
  useEffect(() => {
    const ch = supabase.channel("home-signals")
      .on("postgres_changes", { event: "*", schema: "public", table: "signals" }, () => {
        qc.invalidateQueries({ queryKey: ["signals"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const openOrLock = (feature: "signals" | "scanner" | "education" | "ea", to: string) => {
    if (canAccess(feature, profile?.plan, !!profile?.education_enrolled)) nav({ to: to as never });
    else nav({ to: feature === "ea" ? "/ea" : "/plans" });
  };

  return (
    <div className="space-y-5">
      {/* Profile hero */}
      <div className="relative rounded-[28px] overflow-hidden glass-strong bounce-in" style={{ minHeight: 220 }}>
        {profile?.avatar_url ? (
          <div className="absolute inset-y-0 right-0 w-3/5 bg-cover bg-center"
            style={{
              backgroundImage: `url(${profile.avatar_url})`,
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 40%)",
            }} />
        ) : (
          <div className="absolute inset-y-0 right-0 w-3/5 bg-gradient-to-br from-white/15 to-transparent" />
        )}
        <div className="absolute top-0 right-0 p-3 flex gap-2 z-10">
          {isAdmin && (
            <Link to="/admin" className="w-9 h-9 rounded-full glass-strong flex items-center justify-center" aria-label="Admin">
              <ShieldCheck size={15} />
            </Link>
          )}
          <Link to="/inbox" className="relative w-9 h-9 rounded-full glass-strong flex items-center justify-center" aria-label="Inbox">
            <Inbox size={15} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center px-1">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <button onClick={signOut} className="w-9 h-9 rounded-full glass-strong flex items-center justify-center" aria-label="Sign out">
            <LogOut size={15} />
          </button>
        </div>
        <div className="relative z-10 p-6 pt-7 flex flex-col justify-between h-full" style={{ minHeight: 220 }}>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <GIcon size={14} className="text-white" />
              <p className="text-[10px] uppercase tracking-widest">{dateStr}</p>
            </div>
            <h1 className="text-[22px] font-black mt-2 leading-tight text-white">{g.text}</h1>
            <p className="text-lg font-bold text-foreground mt-1">@{profile?.username ?? "trader"}</p>
          </div>
          <div className="mt-6">
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-white text-black font-bold">
              {profile?.plan === "none" ? "Free" : (profile?.plan ?? "free")} Plan
            </span>
          </div>
        </div>
      </div>

      {/* Feature buttons */}
      <div className="grid grid-cols-4 gap-2">
        <FeatureBtn onClick={() => openOrLock("signals", "/signals")} locked={!canAccess("signals", profile?.plan)} icon={LineChart} label="Signals" />
        <FeatureBtn onClick={() => openOrLock("scanner", "/scanner")} locked={!canAccess("scanner", profile?.plan)} icon={ScanLine} label="Scanner" />
        <FeatureBtn onClick={() => openOrLock("ea", "/ea")} locked icon={Bot} label="EA" />
        <FeatureBtn onClick={() => openOrLock("education", "/education")} locked={!canAccess("education", profile?.plan, !!profile?.education_enrolled)} icon={GraduationCap} label="Learn" />
      </div>

      {/* Live signals */}
      {canAccess("signals", profile?.plan) && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider">Live Signals</h2>
            <Link to="/signals" className="text-[10px] text-muted-foreground underline">View all</Link>
          </div>
          {activeSignals.length === 0 ? (
            <GlassCard><p className="text-xs text-muted-foreground text-center py-2">No active signals right now.</p></GlassCard>
          ) : (
            <div className="space-y-2">{activeSignals.map((s) => <LiveSignalCard key={s.id} s={s} />)}</div>
          )}
        </section>
      )}

      {/* Economic calendar */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Calendar className="text-white" size={18} />
          </div>
          <div>
            <h3 className="font-bold">Major Economic Events</h3>
            <p className="text-[10px] text-muted-foreground">Live countdown · SAST</p>
          </div>
        </div>
        {econLoading && <p className="text-xs text-muted-foreground py-4 text-center">Loading events…</p>}
        {!econLoading && events.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No upcoming events.</p>}
        <ul className="space-y-2">
          {events.map((e) => <EventRow key={e.iso_utc + e.name} ev={e} />)}
        </ul>
      </GlassCard>
    </div>
  );
}

function FeatureBtn({ onClick, locked, icon: Icon, label }: { onClick: () => void; locked: boolean; icon: typeof LineChart; label: string }) {
  return (
    <button onClick={onClick}
      className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:scale-[1.04] active:scale-95 transition-transform relative">
      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center relative">
        <Icon className="text-white" size={20} />
        {locked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/30 flex items-center justify-center">
            <Lock className="text-white" size={9} />
          </div>
        )}
      </div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

type Sig = { id: string; pair: string; side: string; entry: number; take_profit: number; stop_loss: number; status: string };

function LiveSignalCard({ s }: { s: Sig }) {
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    const sym = s.pair.replace(/^([A-Z]{3})([A-Z]{3})$/, "$1/$2");
    const fetchPrice = async () => {
      try {
        const r = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(sym)}&apikey=71193c29f14e4d2e8226939d6a26f263`);
        const j = await r.json();
        if (j.price) setPrice(parseFloat(j.price));
      } catch { /* ignore */ }
    };
    fetchPrice();
    const t = setInterval(fetchPrice, 30000);
    return () => clearInterval(t);
  }, [s.pair]);

  const buy = s.side === "BUY";
  const decimals = s.pair.includes("JPY") ? 3 : s.pair === "XAUUSD" ? 2 : s.pair === "BTCUSD" ? 2 : 5;
  const range = Math.abs(s.take_profit - s.stop_loss);
  let progressPct = 0;
  if (price !== null) {
    const dist = buy ? (price - s.stop_loss) / range : (s.stop_loss - price) / range;
    progressPct = Math.max(0, Math.min(100, dist * 100));
  }
  const ptsToTP = price !== null ? Math.abs(s.take_profit - price) : null;
  const ptsToSL = price !== null ? Math.abs(price - s.stop_loss) : null;

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${buy ? "bg-white/15" : "bg-destructive/20"}`}>
            {buy ? <ArrowUpRight className="text-white" size={14} /> : <ArrowDownRight className="text-destructive" size={14} />}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{s.pair}</p>
            <p className={`text-[10px] font-semibold ${buy ? "text-white" : "text-destructive"}`}>{s.side}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-muted-foreground uppercase">Now</p>
          <p className="font-mono text-xs">{price !== null ? price.toFixed(decimals) : "…"}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <span>SL {s.stop_loss.toFixed(decimals)}</span>
        <span>Entry {s.entry.toFixed(decimals)}</span>
        <span>TP {s.take_profit.toFixed(decimals)}</span>
      </div>
      <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      {price !== null && (
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span>{ptsToSL?.toFixed(decimals)} to SL</span>
          <span>{ptsToTP?.toFixed(decimals)} to TP</span>
        </div>
      )}
    </div>
  );
}

function EventRow({ ev }: { ev: EconEvent }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = new Date(ev.iso_utc).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const sast = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg", weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(ev.iso_utc));
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <li className="glass rounded-2xl p-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{ev.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{ev.affects}</p>
        <p className="text-[10px] text-white mt-0.5">{sast} SAST</p>
      </div>
      <div className="text-right font-mono text-xs text-white shrink-0 tabular-nums">
        {d > 0 ? `${d}d ${pad(h)}h` : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </div>
    </li>
  );
}
