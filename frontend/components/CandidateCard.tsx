"use client";
import clsx from "clsx";
import type { TraceCandidate } from "@/lib/types";

const FLAG_LABELS: Record<string, string> = {
  inconsistent_recent: "Mixed recent performance",
  recent_failure: "Recent failures",
  suspected_lucky_guess: "Only one correct attempt — possible lucky guess",
  likely_secure: "Likely secure",
  recent_activity: "Recent activity",
  no_evidence: "No attempts on this concept",
  preferred_deepest_due_to_no_evidence: "Chosen as deepest with no evidence",
  insufficient_evidence_for_confident_diagnosis: "Insufficient evidence",
};

export function CandidateCard({
  candidate, isRecommended, onTeach,
}: {
  candidate: TraceCandidate;
  isRecommended: boolean;
  onTeach?: (conceptId: string) => void;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border bg-white p-4 sm:p-5",
        isRecommended
          ? "border-root-500 ring-2 ring-root-500/30 shadow-md"
          : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium tabular-nums">
              #{candidate.rank}
            </span>
            {candidate.is_direct_prerequisite ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
                direct prerequisite
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {candidate.hop_distance} hops upstream
              </span>
            )}
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 font-medium uppercase tracking-wide",
                candidate.confidence === "high" && "bg-miss-500/10 text-miss-600",
                candidate.confidence === "medium" && "bg-root-500/10 text-root-600",
                candidate.confidence === "low" && "bg-slate-100 text-slate-500",
              )}
            >
              {candidate.confidence} confidence
            </span>
          </div>
          <h3 className="mt-2 truncate text-base font-semibold">{candidate.concept_title}</h3>
          <p className="text-xs text-slate-500">{candidate.concept_id}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums text-slate-700">
            {candidate.score.toFixed(0)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">score</div>
        </div>
      </div>

      {/* Rationale — the "why" */}
      <p className="mt-3 text-sm text-slate-600 leading-snug">{candidate.rationale}</p>

      {/* Flags */}
      {candidate.flags.filter((f) => FLAG_LABELS[f]).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidate.flags
            .filter((f) => FLAG_LABELS[f])
            .map((f) => (
              <span
                key={f}
                className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
              >
                {FLAG_LABELS[f]}
              </span>
            ))}
        </div>
      )}

      {/* Evidence */}
      {candidate.evidence.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs font-medium text-brand-600 hover:text-brand-500 select-none">
            {candidate.evidence.length} prior attempt{candidate.evidence.length === 1 ? "" : "s"} →
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {candidate.evidence.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1">
                <span className="truncate">{e.question_id}</span>
                <span className="shrink-0 flex items-center gap-2">
                  <span className={clsx(
                    "font-semibold",
                    e.outcome === "correct" ? "text-secure-600" : "text-miss-600",
                  )}>
                    {e.outcome}
                  </span>
                  <span className="text-slate-400 tabular-nums">{e.age_hours.toFixed(0)}h ago</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {isRecommended && onTeach && (
        <button
          type="button"
          onClick={() => onTeach(candidate.concept_id)}
          className="mt-4 w-full rounded-xl bg-root-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-root-500 shadow-sm"
        >
          Teach me this concept →
        </button>
      )}
    </div>
  );
}
