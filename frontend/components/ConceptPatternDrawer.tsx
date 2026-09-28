"use client";
import clsx from "clsx";
import { useEffect } from "react";
import type { ConceptPatternsResponse } from "@/lib/types";

export function ConceptPatternDrawer({
  open, loading, patterns, onClose,
}: {
  open: boolean;
  loading: boolean;
  patterns: ConceptPatternsResponse | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end sm:items-center sm:justify-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          "relative flex w-full max-h-full flex-col bg-white shadow-xl",
          "sm:mx-4 sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Wrong-answer patterns
            </div>
            <h2 className="mt-0.5 truncate text-lg font-bold sm:text-xl">
              {patterns?.concept_title ?? "Loading…"}
            </h2>
            {patterns && !patterns.suppression_applied && (
              <p className="mt-0.5 text-xs text-slate-500">
                {Math.round(patterns.wrong_rate * 100)}% wrong ·{" "}
                {patterns.distinct_learners_wrong} of{" "}
                {patterns.distinct_learners_attempted} learners
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
              Fetching patterns…
            </div>
          )}

          {!loading && patterns?.suppression_applied && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Too few learners ({patterns.distinct_learners_wrong}) to report
              anonymised patterns for this concept. Aggregate counts are shown
              above; details are withheld to protect individual privacy.
            </div>
          )}

          {!loading && patterns && !patterns.suppression_applied &&
           patterns.patterns.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No wrong answers recorded for this concept.
            </p>
          )}

          {!loading && patterns && patterns.patterns.length > 0 && (
            <ul className="space-y-3">
              {patterns.patterns.map((p, i) => (
                <li
                  key={`${p.question_id}-${p.chosen_option_id}-${i}`}
                  className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-slate-700">
                        {p.question_prompt}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-red-50 px-2 py-0.5 font-mono text-red-700">
                          {p.chosen_option_id}. {p.chosen_option_text}
                        </span>
                        <span className="text-slate-500">chosen</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {p.distinct_learners} distinct learner
                        {p.distinct_learners === 1 ? "" : "s"} ·{" "}
                        {Math.round(p.share_of_wrong * 100)}% of wrongs
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-bold tabular-nums">
                        {p.count}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        answers
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-slate-200 p-3 sm:p-4">
          <p className="text-[11px] leading-snug text-slate-500">
            🔒 Aggregated across the demo class. No learner identifiers are
            stored, transmitted, or displayed. Concepts with fewer than 3 learners are suppressed.
          </p>
        </footer>
      </div>
    </div>
  );
}
