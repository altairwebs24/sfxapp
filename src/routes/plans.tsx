import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";

const PLANS = [
  { id: "lite", name: "Lite", price: "R300", features: ["Signals only", "No AI Scanner", "No EA"] },
  { id: "pro", name: "Pro", price: "R600", features: ["Signals", "AI Scanner", "No EA"] },
  { id: "premium", name: "Premium", price: "R1500", features: ["Signals", "AI Scanner", "EA Dashboard"] },
];

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Choose your plan — SFX" }] }),
  component: () => (
    <div className="min-h-screen px-5 py-8 max-w-md mx-auto">
      <Link to="/" className="text-sm text-muted-foreground">← Back</Link>
      <h1 className="text-2xl font-bold text-glow mt-3">Choose your plan</h1>
      <p className="text-sm text-muted-foreground">Payment & admin approval activate access.</p>
      <div className="space-y-4 mt-6">
        {PLANS.map((p) => (
          <GlassCard key={p.id} glow="blue">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="text-2xl font-bold text-primary text-glow">{p.price}</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {p.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <GlowButton className="w-full mt-4">Select {p.name}</GlowButton>
          </GlassCard>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-6 text-center">Yoco payment integration arrives in Phase 4.</p>
    </div>
  ),
});
