"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { QuizCard } from "@/components/QuizCard";
import { RepairComparison } from "@/components/RepairComparison";
import { LoadingState } from "@/components/LoadingState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api, ApiError } from "@/lib/api";
import type { RepairCheckResult, RepairCheckSession } from "@/lib/types";

type Phase = "probe" | "parallel" | "done";

export default function RepairPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = decodeURIComponent(params.sessionId);

  const [session, setSession] = useState<RepairCheckSession | null>(null);
  const [phase, setPhase] = useState<Phase>("probe");
  const [probeAnswer, setProbeAnswer] = useState<string | null>(null);
  const [probeOutcome, setProbeOutcome] = useState<"correct" | "incorrect" | null>(null);
  const [result, setResult] = useState<RepairCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSession(await api.getRepair(sessionId));
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Could not load repair session.");
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  async function submitProbe(answerId: string) {
    if (!session) return;
    const correct = answerId === session.probe_question.correct_option_id;
    setProbeAnswer(answerId);
    setProbeOutcome(correct ? "correct" : "incorrect");
    // Brief pause so the learner sees their choice before the next screen.
    await new Promise((r) => setTimeout(r, 350));
    setPhase("parallel");
  }

  async function submitParallel(answerId: string) {
    if (!session || !probeAnswer || !probeOutcome) return;
    setBusy(true); setError(null);
    const correct = answerId === session.parallel_question.correct_option_id;
    try {
      const res = await api.submitRepair(session.session_id, {
        probe_answer: probeAnswer,
        probe_outcome: probeOutcome,
        parallel_answer: answerId,
        parallel_outcome: correct ? "correct" : "incorrect",
      });
      setResult(res);
      setPhase("done");
    } catch (e: any) {
      setError(e?.message ?? "Could not record repair result.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper current={phase === "done" ? "Retry" : "Repair"} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Repair check</h1>
        <p className="text-sm text-slate-600 mt-1">
          Two questions: one on the diagnosed gap, one on the original concept.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {!session && !error && <LoadingState label="Loading repair session…" />}

      {session && phase === "probe" && (
        <>
          <div className="rounded-xl border border-root-500/30 bg-root-500/5 px-4 py-3 text-sm">
            <b>Step 1 of 2.</b> First, let's confirm the diagnosed gap:{" "}
            <code className="rounded bg-white px-1.5 py-0.5">{session.root_cause_concept_id}</code>.
          </div>
          <QuizCard question={session.probe_question} onSubmit={submitProbe} busy={busy} />
        </>
      )}

      {session && phase === "parallel" && (
        <>
          <div className="rounded-xl border border-brand-200 bg-brand-500/5 px-4 py-3 text-sm">
            <b>Step 2 of 2.</b> Now retry the original concept — a fresh question, same idea.
          </div>
          <QuizCard question={session.parallel_question} onSubmit={submitParallel} busy={busy} />
        </>
      )}

      {session && phase === "done" && result && (
        <>
          <RepairComparison
            probe={session.probe_question}
            parallel={session.parallel_question}
            result={result}
          />
          <div className="flex flex-wrap gap-3">
            {!result.repair_succeeded && (
              <button
                onClick={() => router.push(`/lesson/${encodeURIComponent(session.root_cause_concept_id)}?originalQuestionId=${encodeURIComponent(session.original_question_id)}`)}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
              >
                Review lesson again
              </button>
            )}
            <button
              onClick={() => router.push("/quiz")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to quiz
            </button>
          </div>
        </>
      )}
    </div>
  );
}
