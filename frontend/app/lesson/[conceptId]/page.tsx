"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { LoadingState } from "@/components/LoadingState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api, ApiError } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import type { Lesson, Question } from "@/lib/types";

export default function LessonPage() {
  const params = useParams<{ conceptId: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const conceptId = decodeURIComponent(params.conceptId);
  const originalQuestionId = search.get("originalQuestionId");

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [l, qs] = await Promise.all([api.lesson(conceptId), api.questions()]);
      setLesson(l);
      if (originalQuestionId) {
        setQuestion(qs.find((q) => q.id === originalQuestionId) ?? null);
      }
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Could not load lesson.");
    }
  }, [conceptId, originalQuestionId]);

  useEffect(() => { load(); }, [load]);

  async function checkUnderstanding() {
    if (!originalQuestionId) return;
    setBusy(true); setError(null);
    try {
      const session = await api.startRepair({
        learner_id: getLearnerId(),
        original_question_id: originalQuestionId,
        root_cause_concept_id: conceptId,
      });
      router.push(`/repair/${encodeURIComponent(session.session_id)}`);
    } catch (e: any) {
      setError(e?.message ?? "Could not start repair check.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper current="Lesson" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Micro-lesson</h1>
        <p className="text-sm text-slate-600 mt-1">
          One concept, one worked example. Nothing else.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {!lesson && !error && <LoadingState label="Preparing lesson…" />}

      {lesson && (
        <>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {lesson.concept_id}
                </span>
                {/*
                  The source is visible in dev but hidden in production — the
                  learner experience is identical whether the lesson came from
                  the LLM or the reviewed fallback.
                */}
                {process.env.NODE_ENV !== "production" && (
                  <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                    source: {lesson.source}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
                {lesson.title}
              </h2>
            </header>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Explanation
              </h3>
              <p className="mt-2 leading-relaxed text-slate-700">{lesson.explanation}</p>
            </section>

            <section className="rounded-xl border border-brand-100 bg-brand-500/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                Worked example
              </h3>
              <p className="mt-2 leading-relaxed text-slate-800 whitespace-pre-wrap">
                {lesson.worked_example}
              </p>
            </section>
          </article>

          <div className="flex flex-wrap gap-3">
            {originalQuestionId ? (
              <button
                onClick={checkUnderstanding}
                disabled={busy}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-60"
              >
                {busy ? "Starting…" : "Check my understanding →"}
              </button>
            ) : (
              <p className="text-sm text-slate-500">
                Reached this lesson without a source question — go back to the trace
                to run a repair check.
              </p>
            )}
            <button
              onClick={() => router.back()}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to trace
            </button>
          </div>

          {question && (
            <p className="text-xs text-slate-500">
              After this lesson, we'll retry{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">{question.id}</code>{" "}
              — plus one parallel question on the same concept.
            </p>
          )}
        </>
      )}
    </div>
  );
}
