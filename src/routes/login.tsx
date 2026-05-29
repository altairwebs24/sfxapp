import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { GlowButton } from "@/components/GlowButton";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — SFX" }, { name: "description", content: "Sign in to SIMPHIWEFXACADEMY" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem("sfx:email") ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (remember) localStorage.setItem("sfx:email", email.trim()); else localStorage.removeItem("sfx:email");
    toast.success("Welcome back");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bounce-in">
        <Logo size={88} />
        <h1 className="mt-6 text-3xl font-bold text-center text-glow">SFX</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Sign in to your account</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="glass px-4 py-3">
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none text-base mt-1" placeholder="you@example.com"
            />
          </div>
          <div className="glass px-4 py-3">
            <label className="text-xs text-muted-foreground">Password</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base" placeholder="••••••••"
              />
              <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[color:var(--color-primary)]" />
            Remember me
          </label>
          <GlowButton type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="animate-spin" size={18} /> : "Sign in"}
          </GlowButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-primary text-glow">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
