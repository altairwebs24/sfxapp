import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
export const Route = createFileRoute("/_app/inbox")({ component: () => (
  <GlassCard><h2 className="text-xl font-bold text-glow">Inbox</h2><p className="text-sm text-muted-foreground mt-2">No new notifications.</p></GlassCard>
)});
