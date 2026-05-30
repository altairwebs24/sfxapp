import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/GlassCard";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getEconomicEvents, type EconEvent } from "@/lib/economic.functions";
import { LineChart, Bot, ScanLine, LogOut, Inbox, Calendar, Sun, Sunset, Moon } from "lucide-react";
import { useEffect, useState } from "react";

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
  const { profile, signOut } = useAuth();
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 60_000); return () => clearInterval(t); }, []);
  const g = greetingFor(sastHour());
  const GIcon = g.icon;
  const dateStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const fetchEvents = useServerFn(getEconomicEvents);
  const { data, isLoading } = useQuery({
    queryKey: ["econ"],
    queryFn: () => fetchEvents(),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
  const events = (data?.events ?? []).filter((e) => new Date(e.iso_utc).getTime() > Date.now()).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Profile hero */}
      <div className="relative rounded-[28px] overflow-hidden glass-strong glow bounce-in" style={{ minHeight: 220 }}>
        {profile?.avatar_url ? (
          <div
            className="absolute inset-y-0 right-0 w-3/5 bg-cover bg-center"
            style={{
              backgroundImage: `url(${profile.avatar_url})`,
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 40%)",
            }}
          />
        ) : (
          <div className="absolute inset-y-0 right-0 w-3/5 bg-gradient-to-br from-primary/30 to-transparent" />
        )}
        <div className="absolute top-0 right-0 p-3 flex gap-2 z-10">
          <Link to="/inbox" className="w-9 h-9 rounded-full glass-strong flex items-center justify-center"><Inbox size={15} /></Link>
          <button onClick={signOut} className="w-9 h-9 rounded-full glass-strong flex items-center justify-center"><LogOut size={15} /></button>
        </div>
        <div className="relative z-10 p-6 pt-7 flex flex-col justify-between h-full" style={{ minHeight: 220 }}>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <GIcon size={14} className="text-primary" />
              <p className="text-[10px] uppercase tracking-widest">{dateStr}</p>
            </div>
            <h1 className="text-[22px] font-black mt-2 leading-tight text-primary text-glow">{g.text}</h1>
            <p className="text-lg font-bold text-foreground mt-1">@{profile?.username ?? "trader"}</p>
          </div>
          <div className="mt-6">
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-primary/25 text-primary font-bold glow-soft">
              {profile?.plan === "none" ? "Free" : (profile?.plan ?? "free")} Plan
            </span>
          </div>
        </div>
      </div>

      {/* 3 action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <ActionBtn to="/signals" icon={LineChart} label="Signals" />
        <ActionBtn to="/ea" icon={Bot} label="EA" />
        <ActionBtn to="/scanner" icon={ScanLine} label="Scanner" />
      </div>

      {/* Economic calendar */}
      <GlassCard glow="blue">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center glow-soft">
            <Calendar className="text-primary" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-glow">Major Economic Events</h3>
            <p className="text-[10px] text-muted-foreground">AI-curated · live countdown · SAST</p>
          </div>
        </div>
        {isLoading && <p className="text-xs text-muted-foreground py-4 text-center">Fetching upcoming events…</p>}
        {!isLoading && events.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No upcoming high-impact events.</p>}
        <ul className="space-y-2">
          {events.map((e) => <EventRow key={e.iso_utc + e.name} ev={e} />)}
        </ul>
      </GlassCard>
    </div>
  );
}

function ActionBtn({ to, icon: Icon, label }: { to: string; icon: typeof LineChart; label: string }) {
  return (
    <Link to={to as never} className="glass rounded-3xl p-4 flex flex-col items-center gap-2 glow-soft hover:scale-[1.04] active:scale-95 transition-transform">
      <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center glow-soft">
        <Icon className="text-primary" size={24} />
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </Link>
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
    timeZone: "Africa/Johannesburg", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(ev.iso_utc));
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <li className="glass rounded-2xl p-3 flex items-center justify-between gap-3 hover:bg-primary/5 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{ev.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{ev.affects}</p>
        <p className="text-[10px] text-primary mt-0.5">{sast} SAST</p>
      </div>
      <div className="text-right font-mono text-xs text-primary text-glow shrink-0 tabular-nums">
        {d > 0 ? `${d}d ${pad(h)}h` : `${pad(h)}:${pad(m)}:${pad(s)}`}
      </div>
    </li>
  );
}
