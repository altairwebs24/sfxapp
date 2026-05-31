import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Home, User, Loader2 } from "lucide-react";
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
    if (path && path !== "/" && path !== "/account" && !path.startsWith("/login") && !path.startsWith("/register")) {
      localStorage.setItem(LAST_ROUTE_KEY, path);
    }
  }, [path]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (profile?.status === "pending") return <PendingScreen />;
  if (profile?.status === "blocked") return <BlockedScreen />;

  const goHome = () => {
    const last = typeof window !== "undefined" ? localStorage.getItem(LAST_ROUTE_KEY) : null;
    if (path === "/account" && last) { nav({ to: last as never }); }
    else { nav({ to: "/" }); }
  };

  const isAccount = path === "/account";
  const isHome = !isAccount;

  return (
    <div className="min-h-screen pb-32">
      <main className="px-5 py-5"><Outlet /></main>

      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-3 py-3 flex items-center gap-3 glow">
        <NavBtn active={isHome} onClick={goHome} icon={Home} />
        <NavBtn active={isAccount} onClick={() => nav({ to: "/account" })} icon={User} />
      </nav>
    </div>
  );
}

function NavBtn({ active, onClick, icon: Icon }: { active: boolean; onClick: () => void; icon: typeof Home }) {
  return (
    <button onClick={onClick} className={cn(
      "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
      active ? "bg-primary text-black glow scale-110" : "bg-white/5 text-muted-foreground hover:text-primary",
    )}>
      <Icon size={22} strokeWidth={2.2} />
    </button>
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
