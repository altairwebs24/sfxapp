import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { useAuth } from "@/lib/auth-context";
export const Route = createFileRoute("/_app/account")({ component: () => {
  const { profile, signOut } = useAuth();
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-xl font-bold text-glow">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">@{profile?.username}</p>
        <p className="text-xs text-muted-foreground">{profile?.email}</p>
        <p className="mt-3 text-xs">Plan: <span className="text-primary font-semibold uppercase">{profile?.plan}</span></p>
        <p className="text-xs">Status: <span className="text-primary font-semibold uppercase">{profile?.status}</span></p>
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-muted-foreground">MT4 / MT5 broker details, avatar upload and editing coming in Phase 4.</p>
      </GlassCard>
      <GlowButton variant="danger" onClick={signOut} className="w-full">Sign out</GlowButton>
    </div>
  );
}});
