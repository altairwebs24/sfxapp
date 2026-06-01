import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { analyseChart } from "@/lib/scanner.functions";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, ScanLine, Lock, ArrowUpRight, ArrowDownRight, History, Trash2 } from "lucide-react";
import { toast } from "sonner";

const HISTORY_KEY = "sfx_scanner_history_v1";
const MAX_HISTORY = 25;

export const Route = createFileRoute("/_app/scanner")({
  head: () => ({ meta: [{ title: "AI Scanner — SFX" }] }),
  component: ScannerPage,
});

type ScanOk = { ok: true; pair: string; timeframe: string; bias: "BUY" | "SELL"; notes: string; entry: number; tp: number; sl: number; digits: number };
type HistoryItem = ScanOk & { id: string; at: string };

function ScannerPage() {
  const { profile } = useAuth();
  const allowed = profile?.plan === "pro" || profile?.plan === "premium";
  const analyse = useServerFn(analyseChart);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanOk | null>(null);
  const [fileData, setFileData] = useState<{ base64: string; mime: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const pushHistory = (r: ScanOk) => {
    const item: HistoryItem = { ...r, id: crypto.randomUUID(), at: new Date().toISOString() };
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  };

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
      setResult(res);
      pushHistory(res);
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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-glow">AI Chart Scanner</h1>
          <p className="text-xs text-muted-foreground">Upload a chart — AI reads pair + timeframe, live price from TwelveData, Entry/TP/SL in seconds.</p>
        </div>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="shrink-0 glass rounded-full px-3 py-2 text-xs flex items-center gap-1 border border-white/10"
          aria-label="Toggle history"
        >
          <History size={14} /> History {history.length > 0 && <span className="text-primary">({history.length})</span>}
        </button>
      </div>

      {showHistory && (
        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Past scans</p>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-[11px] text-destructive flex items-center gap-1">
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No past scans yet. Analyse a chart to start your history.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="glass rounded-xl p-3 flex items-center gap-3 border border-white/5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${h.bias === "BUY" ? "bg-primary/20" : "bg-destructive/20"}`}>
                    {h.bias === "BUY" ? <ArrowUpRight size={16} className="text-primary" /> : <ArrowDownRight size={16} className="text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm">{h.pair}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(h.at).toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{h.timeframe} · {h.bias}</p>
                    <div className="grid grid-cols-3 gap-2 mt-1 font-mono text-[11px]">
                      <span>E <span className="text-primary">{h.entry.toFixed(h.digits)}</span></span>
                      <span>TP <span className="text-primary">{h.tp.toFixed(h.digits)}</span></span>
                      <span>SL <span className="text-destructive">{h.sl.toFixed(h.digits)}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

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
          placeholder="Optional context"
          className="w-full mt-3 glass rounded-xl px-3 py-2 text-sm bg-transparent border border-white/10 outline-none focus:border-primary/40"
          rows={2}
        />
        <GlowButton onClick={onAnalyse} disabled={loading || !fileData} className="w-full mt-3">
          {loading ? (<><Loader2 className="animate-spin" size={16} /> Analysing…</>) : (<><ScanLine size={16} /> Analyse chart</>)}
        </GlowButton>
      </GlassCard>

      {result && (
        <GlassCard glow="blue" className="bounce-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${result.bias === "BUY" ? "bg-primary/20" : "bg-destructive/20"}`}>
                {result.bias === "BUY" ? <ArrowUpRight className="text-primary" /> : <ArrowDownRight className="text-destructive" />}
              </div>
              <div>
                <p className="font-bold text-lg">{result.pair}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{result.timeframe} · {result.bias}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Live Entry</p>
              <p className="font-mono text-base text-primary text-glow">{result.entry.toFixed(result.digits)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-center">
            <div className="glass rounded-xl py-2">
              <p className="text-[10px] text-muted-foreground">Take Profit</p>
              <p className="font-mono text-sm text-primary">{result.tp.toFixed(result.digits)}</p>
            </div>
            <div className="glass rounded-xl py-2">
              <p className="text-[10px] text-muted-foreground">Stop Loss</p>
              <p className="font-mono text-sm text-destructive">{result.sl.toFixed(result.digits)}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">{result.notes}</p>
        </GlassCard>
      )}
    </div>
  );
}
