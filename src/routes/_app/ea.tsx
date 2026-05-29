import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
export const Route = createFileRoute("/_app/ea")({ component: () => (
  <div className="space-y-4">
    <GlassCard>
      <h2 className="text-xl font-bold text-glow">EA Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <GlowButton>Start</GlowButton>
        <GlowButton variant="danger">Stop</GlowButton>
        <GlowButton variant="ghost">Quotes</GlowButton>
        <GlowButton variant="ghost">Theme</GlowButton>
      </div>
    </GlassCard>
    <GlassCard className="text-center pulse-glow"><p className="text-sm tracking-[0.3em] text-primary">AUTOMATED TRADING</p></GlassCard>
  </div>
)});
