"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { Stepper } from "@/components/Stepper";
import { ConceptGraph } from "@/components/ConceptGraph";
import { CandidateCard } from "@/components/CandidateCard";
import { LoadingState, SkeletonCard } from "@/components/LoadingState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api, ApiError } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import type { GraphPayload, Question, TraceResponse } from "@/lib/types";

export default function TracePage() {
  const params = useParams<{ questionId: string }>();
  const router = useRouter();
  const questionId = decodeURIComponent(params.questionId);

  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const learnerId = getLearnerId();
    try {
      const [g, t, qs] = await Promise.all([
        api.graph(),
        api.trace(learnerId, questionId),
        api.questions(),
      ]);
      setGraph(g);
      setTrace(t);
      setQuestion(qs.find((q) => q.id === questionId) ?? null);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : "Could not load trace.");
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => { load(); }, [load]);

  const recommended = trace?.recommended_candidate_id
    ? trace.candidates.find((c) => c.concept_id === trace.recommended_candidate_id) ?? null
    : null;

  function teach(conceptId: string) {
    const q = `?originalQuestionId=${encodeURIComponent(questionId)}`;
    router.push(`/lesson/${encodeURIComponent(conceptId)}${q}`);
  }

  return (
    <div className="space-y-6">
      <Stepper current="Trace" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Root-cause trace</h1>
        <p className="text-sm text-slate-600 mt-1">
          Walking the prerequisite graph backward from{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{trace?.target_concept_id ?? "…"}</code>
        </p>
      </div>

      {loading && (
        <>
          <SkeletonCard />
          <LoadingState label="Building the prerequisite path…" />
        </>
      )}

      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* Blocked / diagnostic banners */}
      {trace && trace.recommended_action === "blocked" && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <div className="text-sm font-semibold">Trace blocked</div>
          <ul className="mt-2 text-sm list-disc list-inside space-y-1">
            {trace.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          <p className="mt-3 text-xs text-amber-800">
            Rather than guess from unreliable graph data, we stop here.
          </p>
        </div>
      )}

      {trace && trace.recommended_action === "diagnostic_check" && (
        <div className="rounded-2xl border border-brand-200 bg-brand-500/5 p-5">
          <div className="text-sm font-semibold text-brand-700">We need one more check</div>
          <p className="mt-1 text-sm text-slate-700">
            There isn't enough evidence yet to point at a single root cause. A short
            diagnostic question will sharpen the picture.
          </p>
          {trace.diagnostic_question && (
            <div className="mt-3 rounded-xl bg-white border border-brand-100 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Diagnostic · {trace.diagnostic_question.target_concept_id}
              </div>
              <p className="mt-1 text-sm">{trace.diagnostic_question.prompt}</p>
            </div>
          )}
          {!trace.diagnostic_question && (
            <p className="mt-2 text-xs text-slate-500">
              No fresh question is available on this branch — the graph is fully explored.
            </p>
          )}
        </div>
      )}

      {/* The graph — the heart of the screen */}
      {trace && graph && trace.recommended_action !== "blocked" && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Prerequisite graph
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-root-500" /> root cause (hypothesis)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-miss-500" /> missed concept
              </span>
            </div>
          </div>
          <ConceptGraph
            concepts={graph.concepts}
            edges={graph.edges}
            targetId={trace.target_concept_id}
            candidates={trace.candidates}
            recommendedCandidateId={trace.recommended_candidate_id}
          />
          <p className="text-xs text-slate-500">
            Highlighted path shows the shortest prerequisite chain from the recommended
            candidate to the missed concept. Arrows point from prerequisite → dependent.
          </p>
        </section>
      )}

      {/* Recommended candidate callout */}
      {recommended && (
        <section className="rounded-2xl border border-root-500/40 bg-root-500/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-root-600 text-white px-2.5 py-0.5 font-semibold uppercase tracking-wide">
              Hypothesis
            </span>
            <span className="text-slate-600">
              Based on {recommended.evidence.length} prior attempt
              {recommended.evidence.length === 1 ? "" : "s"} and graph distance
            </span>
          </div>
          <h2 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight">
            The gap may be in <span className="text-root-600">{recommended.concept_title}</span>
          </h2>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">{recommended.rationale}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => teach(recommended.concept_id)}
              className="rounded-xl bg-root-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-root-500"
            >
              Teach me this concept →
            </button>
            <button
              onClick={() => router.push("/quiz")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to quiz
            </button>
          </div>
        </section>
      )}

      {/* Ranked candidates with evidence */}
      {trace && trace.candidates.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            All candidates, ranked
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {trace.candidates.map((c) => (
              <CandidateCard
                key={c.concept_id}
                candidate={c}
                isRecommended={c.concept_id === trace.recommended_candidate_id}
                onTeach={teach}
              />
            ))}
          </div>
        </section>
      )}

      {/* Warnings */}
      {trace && trace.warnings.length > 0 && trace.recommended_action !== "blocked" && (
        <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">
            {trace.warnings.length} graph warning{trace.warnings.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
            {trace.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </details>
      )}

      {/* Missed question context */}
      {question && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            The question you missed
          </div>
          <p className="mt-1 font-medium">{question.prompt}</p>
          <p className="mt-2 text-slate-500 text-xs">
            Correct answer:{" "}
            <span className="text-secure-600 font-semibold">
              {question.options.find((o) => o.id === question.correct_option_id)?.text}
            </span>
          </p>
        </section>
      )}
    </div>
  );
}
