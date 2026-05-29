import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { analyseChart } from "@/lib/scanner.functions";
import { useAuth } from "@/lib/auth-context";
import { useRef, useState } from "react";
import { Upload, Loader2, ScanLine, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/scanner")({
  head: () => ({ meta: [{ title: "AI Scanner — SFX" }] }),
  component: ScannerPage,
});

function ScannerPage() {
  const { profile } = useAuth();
  const allowed = profile?.plan === "pro" || profile?.plan === "premium";
  const analyse = useServerFn(analyseChart);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ base64: string; mime: string } | null>(null);

  const onPick = (f: File) => {
    if (f.size > 6_000_000) { toast.error("Image too large (max 6MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreview(url);
      setFileData({ base64: url.split(",")[1], mime: f.type });
    };
    reader.readAsDataURL(f);
  };

  const onAnalyse = async () => {
    if (!fileData) { toast.error("Upload a chart first"); return; }
    setLoading(true); setResult(null);
    try {
      const res = await analyse({ data: { imageBase64: fileData.base64, mimeType: fileData.mime, note: note || undefined } });
      if (!res.ok) { toast.error(res.error); return; }
      setResult(res.analysis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally { setLoading(false); }
  };

  if (!allowed) {
    return (
      <GlassCard className="text-center bounce-in">
        <div className="w-14 h-14 rounded-full bg-primary/20 mx-auto flex items-center justify-center glow-soft"><Lock className="text-primary" /></div>
        <h2 className="text-xl font-bold text-glow mt-3">AI Scanner is Pro/Premium</h2>
        <p className="text-sm text-muted-foreground mt-2">Upgrade to unlock instant chart analysis.</p>
        <Link to="/plans"><GlowButton className="mt-5 w-full">View plans</GlowButton></Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-glow">AI Chart Scanner</h1>
        <p className="text-xs text-muted-foreground">Upload a chart screenshot — Entry, TP, SL in seconds.</p>
      </div>

      <GlassCard>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="chart" className="rounded-xl w-full" />
            <button onClick={() => fileRef.current?.click()} className="text-xs text-primary underline">Change image</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full py-12 rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center gap-2 text-muted-foreground hover:bg-primary/5">
            <Upload size={28} className="text-primary" />
            <span className="text-sm">Tap to upload your chart</span>
            <span className="text-[10px]">PNG / JPG · max 6MB</span>
          </button>
        )}

        <textarea
          value={note} onChange={(e) => setNote(e.target.value)} maxLength={400}
          placeholder="Optional context (pair, timeframe, etc.)"
          className="w-full mt-3 glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/10 outline-none focus:border-primary/40"
          rows={2}
        />
        <GlowButton onClick={onAnalyse} disabled={loading || !fileData} className="w-full mt-3">
          {loading ? (<><Loader2 className="animate-spin" size={16} /> Analysing…</>) : (<><ScanLine size={16} /> Analyse chart</>)}
        </GlowButton>
      </GlassCard>

      {result && (
        <GlassCard glow="blue" className="bounce-in">
          <h3 className="font-bold text-glow mb-2">Analysis</h3>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90 font-mono">{result}</pre>
        </GlassCard>
      )}
    </div>
  );
}
