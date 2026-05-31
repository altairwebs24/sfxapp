// WhatsApp checkout helpers — owner number for manual payment confirmations.
export const WHATSAPP_NUMBER = "27724655784";

export function buildWhatsAppCheckoutUrl(opts: {
  plan: string;
  amountZar: number;
  username?: string | null;
  email?: string | null;
  requestId?: string;
}) {
  const lines = [
    `Hi SFX 👋, I'd like to activate my plan.`,
    ``,
    `• Plan: ${opts.plan.toUpperCase()}`,
    `• Amount: R${opts.amountZar}`,
    opts.username ? `• Username: @${opts.username}` : null,
    opts.email ? `• Email: ${opts.email}` : null,
    opts.requestId ? `• Ref: ${opts.requestId}` : null,
    ``,
    `Please confirm payment and activate my account.`,
  ].filter(Boolean).join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
}

export type PlanDef = {
  id: "lite" | "pro" | "premium" | "education";
  name: string;
  price: number;
  features: string[];
  locked?: boolean;
  badge?: string;
};

export const PLANS: PlanDef[] = [
  { id: "lite", name: "Basic", price: 250, features: ["Live trading signals", "Inbox alerts", "Economic calendar"] },
  { id: "pro", name: "Pro", price: 350, features: ["Everything in Basic", "AI Chart Scanner", "Priority signals"] },
  { id: "premium", name: "Premium", price: 1300, features: ["Everything in Pro", "Education platform", "EA automation"], locked: true, badge: "Coming Soon" },
];

export const EDUCATION_FEE = 200;

export type PlanId = PlanDef["id"];

// Capability gating — keep in sync with plans above
export function canAccess(feature: "signals" | "scanner" | "education" | "ea", plan: string | null | undefined, educationEnrolled?: boolean) {
  const p = plan ?? "none";
  if (feature === "ea") return false; // Always locked — Coming Soon
  if (feature === "signals") return ["lite", "pro", "premium"].includes(p);
  if (feature === "scanner") return ["pro", "premium"].includes(p);
  if (feature === "education") return p === "premium" || !!educationEnrolled;
  return false;
}
