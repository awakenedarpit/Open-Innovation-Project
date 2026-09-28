"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { QuizCard } from "@/components/QuizCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api, ApiError } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import { DEMO_SCRIPT } from "@/lib/demo";
import type { Question } from "@/lib/types";

// The curated three-question script.
const SCRIPT = [DEMO_SCRIPT.warmup, DEMO_SCRIPT.prereqMiss, DEMO_SCRIPT.target];

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.questions()
      .then((all) => {
        const byId = new Map(all.map((q) => [q.id, q]));
        setQuestions(SCRIPT.map((id) => byId.get(id)).filter(Boolean) as Question[]);
      })
      .catch((e: ApiError) => setError(e.message));
  }, []);

  const current = questions?.[idx];
  const progress = useMemo(() => questions ? `${idx + 1} / ${questions.length}` : "", [idx, questions]);

  async function submit(answerId: string) {
    if (!current) return;
    setBusy(true);
    setError(null);
    const learnerId = getLearnerId();
    const outcome = answerId === current.correct_option_id ? "correct" : "incorrect";
    try {
      await api.postAttempt({
        learner_id: learnerId,
        question_id: current.id,
        answer: answerId,
        outcome,
      });
      if (outcome === "incorrect") {
        // The target question triggers the trace. Intermediate misses also
        // route there — the trace is valid for any missed question.
        router.push(`/trace/${encodeURIComponent(current.id)}`);
        return;
      }
      if (idx + 1 < (questions?.length ?? 0)) {
        setIdx(idx + 1);
        setBusy(false);
      } else {
        // Made it through without a miss — nudge to try the target anyway.
        router.push(`/trace/${encodeURIComponent(current.id)}`);
      }
    } catch (e: any) {
      setError(e?.message ?? "Could not submit answer.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper current="Quiz" />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diagnostic quiz</h1>
          <p className="text-sm text-slate-600">Basic algebra · {progress}</p>
        </div>
        <div className="hidden sm:block text-xs text-slate-400">Answers post to <code>/attempts</code></div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => location.reload()} />}

      {!questions && !error && <LoadingState label="Fetching quiz…" />}

      {current && (
        <QuizCard question={current} onSubmit={submit} busy={busy} />
      )}
    </div>
  );
}
