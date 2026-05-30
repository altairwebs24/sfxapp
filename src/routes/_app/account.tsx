import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, LogOut, Mail, Phone, Save, User as UserIcon, Edit2, Check } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/account")({
  head: () => ({ meta: [{ title: "Account — SFX" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [tab, setTab] = useState<"mt4" | "mt5">("mt5");
  const [savingMT, setSavingMT] = useState(false);

  const [mt5, setMt5] = useState({
    login: profile?.["mt5_login" as keyof typeof profile] as string ?? "",
    password: profile?.["mt5_password" as keyof typeof profile] as string ?? "",
    broker: profile?.["mt5_broker" as keyof typeof profile] as string ?? "",
    server: profile?.["mt5_server" as keyof typeof profile] as string ?? "",
  });
  const [mt4, setMt4] = useState({
    login: profile?.["mt4_login" as keyof typeof profile] as string ?? "",
    password: profile?.["mt4_password" as keyof typeof profile] as string ?? "",
    broker: profile?.["mt4_broker" as keyof typeof profile] as string ?? "",
    server: profile?.["mt4_server" as keyof typeof profile] as string ?? "",
  });
  const [showPw, setShowPw] = useState(false);

  const onAvatarPick = async (file: File) => {
    if (!user) return;
    if (file.size > 4_000_000) { toast.error("Image too large (max 4MB)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
      if (updErr) throw updErr;
      await refreshProfile();
      toast.success("Profile picture updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const saveUsername = async () => {
    if (!user || !username.trim()) return;
    const { error } = await supabase.from("profiles").update({ username: username.trim() }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    setEditingName(false);
    toast.success("Username updated");
  };

  const saveMT = async () => {
    if (!user) return;
    setSavingMT(true);
    const patch = tab === "mt5"
      ? { mt5_login: mt5.login, mt5_password: mt5.password, mt5_broker: mt5.broker, mt5_server: mt5.server }
      : { mt4_login: mt4.login, mt4_password: mt4.password, mt4_broker: mt4.broker, mt4_server: mt4.server };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    setSavingMT(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success(`${tab.toUpperCase()} account saved`);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Profile header card */}
      <GlassCard glow="blue" className="bounce-in text-center">
        <div className="relative w-28 h-28 mx-auto">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-28 h-28 rounded-full object-cover glow border-2 border-primary/40" />
          ) : (
            <div className="w-28 h-28 rounded-full glass-strong flex items-center justify-center glow">
              <UserIcon size={42} className="text-primary" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onAvatarPick(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center glow active:scale-95">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          {editingName ? (
            <>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                className="glass rounded-full px-4 py-1.5 text-center text-base font-bold bg-transparent border border-primary/40 outline-none w-44" />
              <button onClick={saveUsername} className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center"><Check size={14} /></button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-glow">@{profile?.username ?? "trader"}</h2>
              <button onClick={() => setEditingName(true)} className="w-8 h-8 rounded-full glass flex items-center justify-center"><Edit2 size={12} /></button>
            </>
          )}
        </div>

        <p className="text-sm text-foreground/85 mt-1">{profile?.name} {profile?.surname}</p>
        <div className="text-[11px] text-muted-foreground mt-1 flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1.5"><Mail size={11} /> {profile?.email}</span>
          {profile?.phone && <span className="flex items-center gap-1.5"><Phone size={11} /> {profile?.country_code}{profile?.phone}</span>}
        </div>

        <div className="mt-4">
          <span className="text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full bg-primary/25 text-primary font-bold glow-soft">
            {(profile?.plan === "none" ? "Free" : profile?.plan ?? "free")} Plan
          </span>
        </div>
      </GlassCard>

      {/* Trading account */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-glow">Trading Account</h3>
          <div className="glass rounded-full p-1 flex text-xs">
            {(["mt4", "mt5"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full font-semibold uppercase transition-colors ${tab === t ? "bg-primary text-black glow-soft" : "text-muted-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Field label={`${tab.toUpperCase()} Login`}
            value={tab === "mt5" ? mt5.login : mt4.login}
            onChange={(v) => tab === "mt5" ? setMt5({ ...mt5, login: v }) : setMt4({ ...mt4, login: v })} />
          <Field label="Password" type={showPw ? "text" : "password"}
            value={tab === "mt5" ? mt5.password : mt4.password}
            onChange={(v) => tab === "mt5" ? setMt5({ ...mt5, password: v }) : setMt4({ ...mt4, password: v })}
            rightSlot={<button onClick={() => setShowPw(!showPw)} className="text-primary text-xs">{showPw ? "Hide" : "Show"}</button>} />
          <Field label="Broker"
            value={tab === "mt5" ? mt5.broker : mt4.broker}
            onChange={(v) => tab === "mt5" ? setMt5({ ...mt5, broker: v }) : setMt4({ ...mt4, broker: v })} />
          <Field label="Server"
            value={tab === "mt5" ? mt5.server : mt4.server}
            onChange={(v) => tab === "mt5" ? setMt5({ ...mt5, server: v }) : setMt4({ ...mt4, server: v })} />
        </div>

        <GlowButton onClick={saveMT} disabled={savingMT} className="w-full mt-4">
          {savingMT ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Account
        </GlowButton>
      </GlassCard>

      <GlowButton variant="danger" onClick={signOut} className="w-full"><LogOut size={16} /> Sign out</GlowButton>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", rightSlot }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; rightSlot?: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1 glass rounded-full px-4 py-2.5 flex items-center gap-2 border border-white/10 focus-within:border-primary/40">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm" />
        {rightSlot}
      </div>
    </div>
  );
}
