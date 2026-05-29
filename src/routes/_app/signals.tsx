import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
export const Route = createFileRoute("/_app/signals")({ component: () => (
  <GlassCard><h2 className="text-xl font-bold text-glow">Signals</h2><p className="text-sm text-muted-foreground mt-2">Live TwelveData signals wire-up coming in Phase 3. Pairs: USDJPY, EURUSD, GBPUSD, XAUUSD, BTCUSD, NZDUSD, DJI.</p></GlassCard>
)});
