"use client";
import clsx from "clsx";
import type { Question, RepairCheckResult } from "@/lib/types";

function Correctness({ ok }: { ok: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ok ? "bg-secure-500/10 text-secure-600" : "bg-miss-500/10 text-miss-600",
      )}
    >
      <span>{ok ? "✓" : "✗"}</span> {ok ? "correct" : "incorrect"}
    </span>
  );
}

function QuestionBlock({ label, q }: { label: string; q: Question }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <p className="mt-1 text-sm leading-snug">{q.prompt}</p>
      <div className="mt-2 text-[11px] text-slate-500">
        concept: <code className="rounded bg-slate-100 px-1 py-0.5">{q.target_concept_id}</code>
      </div>
    </div>
  );
}

export function RepairComparison({
  probe, parallel, result,
}: {
  probe: Question; parallel: Question; result: RepairCheckResult;
}) {
  const headline = result.repair_succeeded
    ? "Repair verified."
    : result.probe_correct && !result.parallel_correct
      ? "Concept understood — application still shaky."
      : !result.probe_correct && result.parallel_correct
        ? "Diagnosis may be off."
        : "The gap is deeper than the diagnosed concept.";

  const tone = result.repair_succeeded
    ? "border-secure-500/40 bg-secure-500/5 text-secure-700"
    : "border-root-500/40 bg-root-500/5 text-root-700";

  return (
    <div className="space-y-4">
      <div className={clsx("rounded-2xl border p-5", tone)}>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{headline}</h2>
        <p className="mt-2 text-sm text-slate-700">{result.message}</p>
      </div>

      {/* Before / after grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Before
          </div>
          <div className="mt-2 text-sm font-medium">The original miss</div>
          <p className="mt-1 text-xs text-slate-500">
            Question <code className="rounded bg-slate-100 px-1 py-0.5">{result.original_question_id}</code>
          </p>
          <div className="mt-3"><Correctness ok={false} /></div>
        </div>

        <QuestionBlockWithState
          label="After · root-cause probe"
          q={probe}
          ok={result.probe_correct}
        />
        <QuestionBlockWithState
          label="After · parallel retry"
          q={parallel}
          ok={result.parallel_correct}
        />
      </div>

      {/* Raw questions, in case the learner wants to see them again */}
      <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">
          Show the questions used
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <QuestionBlock label="Probe" q={probe} />
          <QuestionBlock label="Parallel" q={parallel} />
        </div>
      </details>
    </div>
  );
}

function QuestionBlockWithState({
  label, q, ok,
}: { label: string; q: Question; ok: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-4",
        ok ? "border-secure-500/30 bg-secure-500/5" : "border-miss-500/30 bg-miss-500/5",
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-medium leading-snug">{q.prompt}</div>
      <div className="mt-2 text-[11px] text-slate-500">
        concept: <code className="rounded bg-white px-1 py-0.5">{q.target_concept_id}</code>
      </div>
      <div className="mt-3"><Correctness ok={ok} /></div>
    </div>
  );
}
