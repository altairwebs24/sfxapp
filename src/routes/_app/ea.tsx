import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { Bot, Lock } from "lucide-react";

export const Route = createFileRoute("/_app/ea")({
  head: () => ({ meta: [{ title: "EA — Coming Soon" }] }),
  component: EaPage,
});

function EaPage() {
  return (
    <div className="space-y-4">
      <GlassCard className="text-center bounce-in py-10">
        <div className="w-16 h-16 rounded-full bg-white/10 mx-auto flex items-center justify-center relative">
          <Bot className="text-white" size={28} />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black border border-white/20 flex items-center justify-center">
            <Lock className="text-white" size={12} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mt-5">Expert Advisor</h2>
        <p className="text-sm text-muted-foreground mt-2 px-4">
          Automated trading is in final testing. We'll notify you the moment it's ready.
        </p>
        <span className="inline-block mt-5 text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full bg-white text-black font-bold">
          Coming Soon
        </span>
        <div className="mt-6">
          <Link to="/"><GlowButton variant="ghost" className="w-full">Back home</GlowButton></Link>
        </div>
      </GlassCard>
    </div>
  );
}
