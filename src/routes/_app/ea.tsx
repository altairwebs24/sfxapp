import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { getAppSettings } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";
import { Bot, Lock, Play, Square, Palette, Quote as QuoteIcon, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/ea")({
  head: () => ({ meta: [{ title: "EA Dashboard — SFX" }] }),
  component: EaPage,
});

const QUOTES = [
  "Discipline beats prediction.",
  "Cut losers fast, let winners run.",
  "The market rewards patience.",
  "A plan you follow > a perfect plan you skip.",
  "Risk first. Profit second.",
  "Trade the chart, not the noise.",
];

function EaPage() {
  const { profile } = useAuth();
  const allowed = profile?.plan === "premium";
  const fetchSettings = useServerFn(getAppSettings);
  const { data } = useQuery({ queryKey: ["app_settings"], queryFn: () => fetchSettings() });
  const settings = data?.settings;
  const [running, setRunning] = useState(false);
  const [quotesOpen, setQuotesOpen] = useState(false);

  if (!allowed) {
    return (
      <GlassCard className="text-center bounce-in">
        <div className="w-14 h-14 rounded-full bg-primary/20 mx-auto flex items-center justify-center glow-soft"><Lock className="text-primary" /></div>
        <h2 className="text-xl font-bold text-glow mt-3">EA Dashboard is Premium</h2>
        <p className="text-sm text-muted-foreground mt-2">Upgrade to Premium for automated trading control.</p>
        <Link to="/plans"><GlowButton className="mt-5 w-full">View plans</GlowButton></Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard glow="blue" className="bounce-in">
        <div className="flex items-center gap-3">
          {settings?.ea_logo_url ? (
            <img src={settings.ea_logo_url} alt="" className="w-12 h-12 rounded-2xl glow-soft" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center glow-soft"><Bot className="text-primary" /></div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Expert Advisor</p>
            <h2 className="text-xl font-bold text-glow">{settings?.ea_name ?? "SFX EA"}</h2>
          </div>
        </div>
        <div className={`mt-4 rounded-2xl px-4 py-3 text-center ${running ? "bg-primary/15 glow-soft" : "bg-white/5"}`}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
          <p className={`text-lg font-bold ${running ? "text-primary text-glow" : "text-foreground/70"}`}>
            {running ? "AUTOMATED TRADING — ACTIVE" : "STOPPED"}
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <GlowButton onClick={() => setRunning(true)} disabled={running}><Play size={16} /> Start</GlowButton>
        <GlowButton variant="danger" onClick={() => setRunning(false)} disabled={!running}><Square size={16} /> Stop</GlowButton>
        <GlowButton variant="ghost" onClick={() => setQuotesOpen(true)}><QuoteIcon size={16} /> Quotes</GlowButton>
        <GlowButton variant="ghost"><Palette size={16} /> Theme</GlowButton>
      </div>

      <GlassCard>
        <p className="text-xs text-muted-foreground">
          EA control is currently a front-end simulation. To wire it to a real MT4/MT5 bridge,
          connect your broker credentials in Account → MT4/MT5.
        </p>
      </GlassCard>

      {quotesOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4" onClick={() => setQuotesOpen(false)}>
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full bounce-in glow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-glow">Trader Mindset</h3>
              <button onClick={() => setQuotesOpen(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><X size={14} /></button>
            </div>
            <ul className="mt-4 space-y-3">
              {QUOTES.map((q) => (
                <li key={q} className="text-sm border-l-2 border-primary/50 pl-3">"{q}"</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
