import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { PLANS, buildWhatsAppCheckoutUrl, WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { createPaymentRequest } from "@/lib/payment.functions";
import { useAuth } from "@/lib/auth-context";
import { Check, Lock, ArrowLeft, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Choose your plan — SFX" }] }),
  component: PlansPage,
});

function PlansPage() {
  const { profile, user } = useAuth();
  const nav = useNavigate();
  const createPayment = useServerFn(createPaymentRequest);
  const [loading, setLoading] = useState<string | null>(null);

  const onChoose = async (planId: "lite" | "pro" | "premium", amount: number) => {
    if (!user) { nav({ to: "/login" }); return; }
    setLoading(planId);
    try {
      const { id } = await createPayment({ data: { plan: planId, amountZar: amount } });
      const url = buildWhatsAppCheckoutUrl({
        plan: planId, amountZar: amount,
        username: profile?.username, email: profile?.email, requestId: id,
      });
      window.open(url, "_blank", "noopener");
      toast.success("WhatsApp opened — send the message to confirm payment.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create payment request");
    } finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen px-5 py-8 pb-32">
      <Link to={user ? "/" : "/login"} className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 className="text-3xl font-bold">Choose your plan</h1>
      <p className="text-sm text-muted-foreground mt-1">Pay via WhatsApp — instant confirmation by admin.</p>

      <div className="mt-6 space-y-4">
        {PLANS.map((p) => {
          const current = profile?.plan === p.id;
          const isLocked = !!p.locked;
          return (
            <GlassCard key={p.id} className={`bounce-in ${isLocked ? "opacity-70" : ""}`}>
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  {p.badge && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white text-black font-bold mt-1 inline-block">{p.badge}</span>}
                </div>
                <span className="text-2xl font-bold">R{p.price}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2">
                    <Check size={14} className="text-white" /> {f}
                  </li>
                ))}
              </ul>
              <GlowButton
                onClick={() => !isLocked && p.id !== "education" && onChoose(p.id as "lite" | "pro" | "premium", p.price)}
                disabled={current || isLocked || loading === p.id}
                className="w-full mt-4"
              >
                {isLocked ? (<><Lock size={16} /> Coming soon</>)
                  : current ? (<><Lock size={16} /> Current plan</>)
                  : loading === p.id ? "Opening WhatsApp…"
                  : (<><MessageCircle size={16} /> Pay R{p.price} via WhatsApp</>)}
              </GlowButton>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="mt-6">
        <p className="text-xs text-muted-foreground">
          How it works: tap a plan → WhatsApp opens with your details prefilled → send → admin confirms and activates within minutes.
          Direct: <span className="text-white">+{WHATSAPP_NUMBER}</span>
        </p>
      </GlassCard>
    </div>
  );
}
