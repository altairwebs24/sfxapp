import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { GlowButton } from "@/components/GlowButton";
import { useAuth } from "@/lib/auth-context";
import { listLessons, getLesson, submitQuiz, enrollEducation } from "@/lib/education.functions";
import { buildWhatsAppCheckoutUrl, EDUCATION_FEE, canAccess } from "@/lib/whatsapp";
import { GraduationCap, Lock, CheckCircle2, ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/education")({
  head: () => ({ meta: [{ title: "Education — SFX" }] }),
  component: EducationPage,
});

function EducationPage() {
  const { profile } = useAuth();
  const allowed = canAccess("education", profile?.plan, !!profile?.education_enrolled);
  const enroll = useServerFn(enrollEducation);
  const [busy, setBusy] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  if (!allowed) {
    const startEnrollment = async () => {
      setBusy(true);
      try {
        const { id } = await enroll();
        const url = buildWhatsAppCheckoutUrl({
          plan: "education", amountZar: EDUCATION_FEE,
          username: profile?.username, email: profile?.email, requestId: id,
        });
        window.open(url, "_blank", "noopener");
        toast.success("WhatsApp opened — send the message to complete enrollment.");
      } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
      finally { setBusy(false); }
    };
    return (
      <GlassCard className="text-center bounce-in py-10">
        <div className="w-16 h-16 rounded-full bg-white/10 mx-auto flex items-center justify-center relative">
          <GraduationCap className="text-white" size={28} />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black border border-white/20 flex items-center justify-center">
            <Lock className="text-white" size={12} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mt-5">Education Platform</h2>
        <p className="text-sm text-muted-foreground mt-2 px-2">
          Learn forex from the ground up — 10 modules, quizzes, progress tracking.
        </p>
        <p className="text-3xl font-black mt-4">R{EDUCATION_FEE}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">One-time enrollment</p>
        <GlowButton onClick={startEnrollment} disabled={busy} className="w-full mt-5">
          {busy ? <Loader2 className="animate-spin" size={16} /> : <MessageCircle size={16} />} Enroll via WhatsApp
        </GlowButton>
        <p className="text-[10px] text-muted-foreground mt-3">Or unlock by upgrading to <Link to="/plans" className="underline">Premium</Link>.</p>
      </GlassCard>
    );
  }

  if (selectedSlug) return <LessonView slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;
  return <LessonList onSelect={setSelectedSlug} />;
}

function LessonList({ onSelect }: { onSelect: (slug: string) => void }) {
  const fn = useServerFn(listLessons);
  const { data, isLoading } = useQuery({ queryKey: ["lessons"], queryFn: () => fn() });
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  const lessons = data?.lessons ?? [];
  const prog = data?.progress ?? [];
  const completed = (id: string) => prog.find((p) => p.lesson_id === id && p.completed_at);
  const done = prog.filter((p) => p.completed_at).length;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Education</h1>
        <p className="text-xs text-muted-foreground">{done}/{lessons.length} lessons completed</p>
      </div>
      <div className="space-y-2">
        {lessons.map((l) => {
          const c = completed(l.id);
          return (
            <button key={l.id} onClick={() => onSelect(l.slug)}
              className="w-full glass rounded-2xl px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{l.order_index}</div>
                <div>
                  <p className="font-semibold text-sm">{l.title}</p>
                  {c && <p className="text-[10px] text-muted-foreground">Score: {c.quiz_score ?? 0}%</p>}
                </div>
              </div>
              {c ? <CheckCircle2 className="text-white" size={18} /> : <span className="text-[10px] text-muted-foreground">Open →</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LessonView({ slug, onBack }: { slug: string; onBack: () => void }) {
  const fn = useServerFn(getLesson);
  const submit = useServerFn(submitQuiz);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["lesson", slug], queryFn: () => fn({ data: { slug } }) });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading || !data) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const r = await submit({ data: {
        lessonId: data.lesson.id,
        answers: Object.entries(answers).map(([quizId, selected]) => ({ quizId, selected })),
      }});
      setResult(r);
      qc.invalidateQueries({ queryKey: ["lessons"] });
      toast.success(`Scored ${r.score}%`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft size={14} /> All lessons
      </button>
      <GlassCard>
        <div className="prose prose-invert prose-sm max-w-none">
          {data.lesson.body_md.split("\n").map((line, i) => {
            if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mb-3">{line.slice(2)}</h1>;
            if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(3)}</h2>;
            if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm">{line.slice(2)}</li>;
            if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-sm mt-2">{line.slice(2, -2)}</p>;
            if (!line.trim()) return <br key={i} />;
            return <p key={i} className="text-sm leading-relaxed mt-2 text-foreground/90">{line}</p>;
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold">Quiz</h3>
        <p className="text-xs text-muted-foreground mb-3">Pass to track your progress.</p>
        {data.quizzes.map((q, qi) => (
          <div key={q.id} className="mt-4">
            <p className="text-sm font-semibold">{qi + 1}. {q.question}</p>
            <div className="mt-2 space-y-1.5">
              {(q.options as string[]).map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm transition ${
                  answers[q.id] === oi ? "border-white bg-white/10" : "border-white/10 hover:border-white/30"
                }`}>
                  <input type="radio" name={q.id} className="accent-white"
                    checked={answers[q.id] === oi}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        {result && (
          <div className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-center">
            <p className="text-lg font-bold">{result.score}%</p>
            <p className="text-xs text-muted-foreground">{result.correct} / {result.total} correct</p>
          </div>
        )}
        <GlowButton onClick={onSubmit} disabled={submitting || Object.keys(answers).length < data.quizzes.length} className="w-full mt-4">
          {submitting ? <Loader2 className="animate-spin" size={16} /> : "Submit quiz"}
        </GlowButton>
      </GlassCard>
    </div>
  );
}
