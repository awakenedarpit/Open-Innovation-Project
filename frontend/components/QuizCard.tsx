"use client";
import clsx from "clsx";
import { useState } from "react";
import type { Question } from "@/lib/types";

export function QuizCard({
  question,
  onSubmit,
  busy,
}: {
  question: Question;
  onSubmit: (answerId: string) => void;
  busy?: boolean;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium uppercase tracking-wide">
          {question.difficulty}
        </span>
        <span>·</span>
        <span>{question.target_concept_id}</span>
      </div>
      <h2 className="mt-3 text-lg sm:text-xl font-semibold leading-snug">{question.prompt}</h2>

      <fieldset className="mt-5 space-y-2" disabled={busy}>
        {question.options.map((o) => (
          <label
            key={o.id}
            className={clsx(
              "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition",
              picked === o.id
                ? "border-brand-500 bg-brand-500/5 ring-1 ring-brand-500/30"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              busy && "opacity-60 cursor-not-allowed",
            )}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              value={o.id}
              checked={picked === o.id}
              onChange={() => setPicked(o.id)}
              className="mt-1 h-4 w-4 accent-brand-600"
            />
            <span className="text-sm sm:text-base">{o.text}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        disabled={!picked || busy}
        onClick={() => picked && onSubmit(picked)}
        className={clsx(
          "mt-5 inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition",
          picked && !busy
            ? "bg-brand-600 text-white hover:bg-brand-500 shadow-sm"
            : "bg-slate-200 text-slate-400 cursor-not-allowed",
        )}
      >
        {busy ? "Submitting…" : "Submit answer"}
      </button>
    </div>
  );
}
