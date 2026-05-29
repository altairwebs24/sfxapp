import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
export const Route = createFileRoute("/_app/scanner")({ component: () => (
  <GlassCard><h2 className="text-xl font-bold text-glow">AI Chart Scanner</h2><p className="text-sm text-muted-foreground mt-2">Upload your chart screenshot — Gemini-powered EMA analysis arrives in Phase 3.</p></GlassCard>
)});
