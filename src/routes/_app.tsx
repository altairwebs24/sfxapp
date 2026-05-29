import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Home, LineChart, ScanLine, Bot, User, Loader2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // Soft gate — full check inside component (auth hydrates client-side)
    return {};
  },
  component: AppLayout,
});

function AppLayout() {
  const { user, profile, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }
  if (!user) {
    throw redirect({ to: "/login" });
  }
  if (profile?.status === "pending") return <PendingScreen />;
  if (profile?.status === "blocked") return <BlockedScreen />;

  const tabs = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/signals", icon: LineChart, label: "Signals" },
    { to: "/scanner", icon: ScanLine, label: "Scanner" },
    { to: "/ea", icon: Bot, label: "EA" },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-40 glass-strong px-5 py-3 flex items-center justify-between border-b border-[color:var(--color-border)]">
        <div className="flex items-center gap-2">
          <img src="/icons/sfx-logo.png" alt="" className="w-9 h-9 rounded-full glow-soft" />
          <span className="font-bold text-glow">SFX</span>
        </div>
        <Link to="/inbox" className="relative w-10 h-10 rounded-full glass flex items-center justify-center">
          <Bell size={18} />
        </Link>
      </header>

      <main className="px-5 py-5">
        <Outlet />
      </main>

      <nav className="fixed bottom-4 left-4 right-4 z-50 glass-strong rounded-full px-2 py-2 flex items-center justify-around glow-soft">
        {tabs.map((t) => {
          const active = path === t.to || (t.to !== "/" && path.startsWith(t.to));
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-full transition-all duration-300",
                active ? "bg-primary/20 text-primary text-glow scale-105" : "text-muted-foreground",
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-0.5">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function PendingScreen() {
  const { signOut, profile } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass p-8 max-w-sm text-center bounce-in">
        <Logo size={72} />
        <h2 className="mt-5 text-xl font-bold text-glow">Awaiting approval</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hi {profile?.name ?? "trader"}, your account is pending admin approval. You'll get access as soon as you're approved.
        </p>
        <button onClick={signOut} className="mt-6 rounded-full px-5 py-2 bg-white/5 border border-white/10 text-sm">Sign out</button>
      </div>
    </div>
  );
}
function BlockedScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass p-8 max-w-sm text-center glow-red">
        <h2 className="text-xl font-bold text-destructive">Account blocked</h2>
        <p className="mt-2 text-sm text-muted-foreground">Contact support to reinstate access.</p>
        <button onClick={signOut} className="mt-6 rounded-full px-5 py-2 bg-white/5 border border-white/10 text-sm">Sign out</button>
      </div>
    </div>
  );
}
