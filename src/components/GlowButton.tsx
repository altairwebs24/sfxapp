import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

export const GlowButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ className, variant = "primary", ...rest }, ref) => (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
        "transition-all duration-300 active:scale-95",
        "backdrop-blur-xl border border-[color:var(--color-border)]",
        variant === "primary" && "bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/25 glow-soft hover:glow",
        variant === "ghost" && "bg-white/5 text-foreground hover:bg-white/10",
        variant === "danger" && "bg-destructive/15 text-destructive hover:bg-destructive/25",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
    />
  ),
);
GlowButton.displayName = "GlowButton";
