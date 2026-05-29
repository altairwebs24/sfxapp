import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function GlassCard({
  className, children, glow, ...rest
}: HTMLAttributes<HTMLDivElement> & { glow?: "blue" | "red" | "none"; children: ReactNode }) {
  return (
    <div
      {...rest}
      className={cn(
        "glass p-5 fade-up",
        glow === "blue" && "glow-soft",
        glow === "red" && "glow-red",
        className,
      )}
    >
      {children}
    </div>
  );
}
