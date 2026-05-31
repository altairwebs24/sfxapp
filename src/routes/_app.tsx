import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Home, User, LineChart, Bot, ScanLine, GraduationCap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export const Route = createFileRoute("/_app")({ component: AppLayout });

const LAST_ROUTE_KEY = "sfx_last_route";

function AppLayout() {
  const { user, profile, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (path && path !== "/" && !path.startsWith("/login") && !path.startsWith("/register")) {
      localStorage.setItem(LAST_ROUTE_KEY, path);
    }
  }, [path]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (profile?.status === "pending") return <PendingScreen />;
  if (profile?.status === "blocked") return <BlockedScreen />;
  if (profile?.status === "declined") return <DeclinedScreen />;

  const isHome = path === "/";

  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/signals", icon: LineChart, label: "Signals" },
    { to: "/scanner", icon: ScanLine, label: "Scanner" },
    { to: "/ea", icon: Bot, label: "EA" },
    { to: "/education", icon: GraduationCap, label: "Learn" },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className={cn("min-h-screen", isHome ? "pb-8" : "pb-28")}>
      <main className="px-5 py-5"><Outlet /></main>

      {!isHome && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black border border-white/15 rounded-full px-2 py-2 flex items-center gap-1 shadow-2xl">
          {items.map((it) => {
            const active = path === it.to;
            const Icon = it.icon;
            return (
              <button key={it.to}
                onClick={() => nav({ to: it.to as never })}
                className={cn(
                  "flex flex-col items-center justify-center rounded-full transition-all px-3 py-2 min-w-[56px]",
                  active ? "bg-white text-black" : "text-white/70 hover:text-white",
                )}>
                <Icon size={18} strokeWidth={2.2} />
                <span className="text-[9px] font-semibold mt-0.5">{it.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function PendingScreen() {
  const { signOut, profile } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass p-8 max-w-sm text-center bounce-in">
        <Logo size={72} />
        <h2 className="mt-5 text-xl font-bold">Awaiting approval</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hi {profile?.name ?? "trader"}, your account is pending admin approval.
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
function DeclinedScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass p-8 max-w-sm text-center">
        <h2 className="text-xl font-bold text-destructive">Account declined</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your application wasn't approved. Contact support for details.</p>
        <button onClick={signOut} className="mt-6 rounded-full px-5 py-2 bg-white/5 border border-white/10 text-sm">Sign out</button>
      </div>
    </div>
  );
}
