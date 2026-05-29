import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { GlowButton } from "@/components/GlowButton";
import { COUNTRIES } from "@/lib/countries";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — SFX" }, { name: "description", content: "Create your SFX account" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [f, setF] = useState({
    name: "", surname: "", username: "", country_code: "+27", phone: "",
    email: "", password: "",
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (f.password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);

    // Check username uniqueness
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", f.username.trim()).maybeSingle();
    if (existing) { setBusy(false); return toast.error("Username already taken"); }

    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: f.name.trim(),
          surname: f.surname.trim(),
          username: f.username.trim(),
          phone: f.phone.trim(),
          country_code: f.country_code,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — choose your plan");
    nav({ to: "/plans" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      <Link to="/login" className="text-muted-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeft size={16} /> Back
      </Link>
      <div className="w-full max-w-sm mx-auto bounce-in mt-4">
        <Logo size={64} />
        <h1 className="mt-4 text-2xl font-bold text-center text-glow">Create account</h1>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={f.name} onChange={set("name")} required />
            <Field label="Surname" value={f.surname} onChange={set("surname")} required />
          </div>
          <Field label="Username" value={f.username} onChange={set("username")} required />
          <div className="glass px-4 py-3">
            <label className="text-xs text-muted-foreground">Phone</label>
            <div className="flex items-center gap-2 mt-1">
              <select value={f.country_code} onChange={set("country_code")} className="bg-transparent outline-none text-base">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-black">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input type="tel" value={f.phone} onChange={set("phone")} required className="flex-1 bg-transparent outline-none text-base" placeholder="71 234 5678" />
            </div>
          </div>
          <Field label="Email" type="email" value={f.email} onChange={set("email")} required />
          <div className="glass px-4 py-3">
            <label className="text-xs text-muted-foreground">Password</label>
            <div className="flex items-center gap-2 mt-1">
              <input type={show ? "text" : "password"} required minLength={6} value={f.password} onChange={set("password")} className="flex-1 bg-transparent outline-none text-base" placeholder="At least 6 characters" />
              <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <GlowButton type="submit" disabled={busy} className="w-full mt-2">
            {busy ? <Loader2 className="animate-spin" size={18} /> : "Continue"}
          </GlowButton>
        </form>
      </div>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div className="glass px-4 py-3">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input {...rest} className="w-full bg-transparent outline-none text-base mt-1" />
    </div>
  );
}
