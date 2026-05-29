// WhatsApp checkout helpers — owner number for manual payment confirmations.
export const WHATSAPP_NUMBER = "27724655784"; // 0724655784 in E.164 (no +)

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
    `Please confirm the payment details and activate my account once you receive the EFT.`,
  ].filter(Boolean).join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
}

export const PLANS = [
  { id: "lite", name: "Lite", price: 300, features: ["Live Signals", "Inbox alerts", "Calendar"] },
  { id: "pro", name: "Pro", price: 600, features: ["Everything in Lite", "AI Chart Scanner", "Priority signals"] },
  { id: "premium", name: "Premium", price: 1500, features: ["Everything in Pro", "EA Dashboard", "Automated trading"] },
] as const;
export type PlanId = (typeof PLANS)[number]["id"];
