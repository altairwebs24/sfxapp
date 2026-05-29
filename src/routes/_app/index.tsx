import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/GlassCard";
import { LineChart, ScanLine, Bot, Target, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard — SFX" }] }),
  component: Dashboard,
});

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 12) return { label: "Good morning", emoji: "🌅" };
  if (h < 19) return { label: "Good afternoon", emoji: "☀️" };
  return { label: "Good evening", emoji: "🌙" };
}

function Dashboard() {
  const { profile } = useAuth();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  const g = greetingFor(now);
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const plan = profile?.plan ?? "none";
  const canScanner = plan === "pro" || plan === "premium";
  const canEA = plan === "premium";

  return (
    <div className="space-y-5">
      <div className="bounce-in">
        <p className="text-muted-foreground text-sm">{dateStr}</p>
        <h1 className="text-3xl font-bold text-glow mt-1">
          {g.label} <span>{g.emoji}</span>
        </h1>
        <p className="text-lg text-foreground/90 mt-1">@{profile?.username ?? "trader"}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <DashCard to="/signals" icon={LineChart} title="Signals" subtitle="Real-time BUY / SELL setups" />
        <DashCard to="/scanner" icon={ScanLine} title="AI Scanner" subtitle="Upload a chart, get Entry / TP / SL" locked={!canScanner} />
        <DashCard to="/ea" icon={Bot} title="EA Dashboard" subtitle="Automated trading control" locked={!canEA} />
      </div>

      <GlassCard glow="red" className="mt-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-destructive/20 flex items-center justify-center glow-red">
            <Target className="text-destructive" size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">TP / SL Tracker</p>
            <p className="font-semibold">No active trade</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          When a signal is live, you'll see its pair, TP hit %, and live status here — until TP or SL closes it.
        </p>
      </GlassCard>
    </div>
  );
}

function DashCard({ to, icon: Icon, title, subtitle, locked }: { to: string; icon: typeof LineChart; title: string; subtitle: string; locked?: boolean }) {
  const content = (
    <GlassCard className={locked ? "opacity-70" : "glow-soft hover:glow transition-shadow"}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center glow-soft">
          <Icon className="text-primary" size={22} />
        </div>
        <div className="flex-1">
          <p className="font-semibold flex items-center gap-2">{title} {locked && <Lock size={14} className="text-muted-foreground" />}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </GlassCard>
  );
  if (locked) return <Link to="/plans">{content}</Link>;
  return <Link to={to as never}>{content}</Link>;
}
