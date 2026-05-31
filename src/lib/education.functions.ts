import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: lessons } = await context.supabase
      .from("education_lessons").select("id, slug, title, order_index").order("order_index");
    const { data: progress } = await context.supabase
      .from("education_progress").select("lesson_id, completed_at, quiz_score")
      .eq("user_id", context.userId);
    return { lessons: lessons ?? [], progress: progress ?? [] };
  });

export const getLesson = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: lesson } = await context.supabase
      .from("education_lessons").select("*").eq("slug", data.slug).maybeSingle();
    if (!lesson) throw new Error("Lesson not found");
    const { data: quizzes } = await context.supabase
      .from("education_quizzes").select("id, question, options, order_index")
      .eq("lesson_id", lesson.id).order("order_index");
    return { lesson, quizzes: quizzes ?? [] };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    lessonId: z.string().uuid(),
    answers: z.array(z.object({ quizId: z.string().uuid(), selected: z.number().int().min(0).max(10) })).max(20),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: quizzes } = await supabaseAdmin
      .from("education_quizzes").select("id, correct_index").eq("lesson_id", data.lessonId);
    if (!quizzes || quizzes.length === 0) throw new Error("No quizzes");
    let correct = 0;
    for (const a of data.answers) {
      const q = quizzes.find((x) => x.id === a.quizId);
      if (q && q.correct_index === a.selected) correct++;
    }
    const score = Math.round((correct / quizzes.length) * 100);
    await supabaseAdmin.from("education_progress").upsert({
      user_id: context.userId,
      lesson_id: data.lessonId,
      completed_at: new Date().toISOString(),
      quiz_score: score,
    }, { onConflict: "user_id,lesson_id" });
    return { score, correct, total: quizzes.length };
  });

export const enrollEducation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: row, error } = await context.supabase.from("payment_requests")
      .insert({ user_id: context.userId, plan: "education", amount_zar: 200, status: "awaiting_payment" })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
