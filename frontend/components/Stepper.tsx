"use client";
import clsx from "clsx";

const STEPS = ["Quiz", "Trace", "Lesson", "Repair", "Retry"] as const;
export type StepName = (typeof STEPS)[number];

export function Stepper({ current }: { current: StepName }) {
  const idx = STEPS.indexOf(current);
  return (
    <nav aria-label="Progress" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      {STEPS.map((s, i) => {
        const done = i < idx, active = i === idx;
        return (
          <div key={s} className="flex items-center gap-1 sm:gap-2">
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2 py-1 font-medium tabular-nums",
                done   && "bg-secure-500/10 text-secure-600",
                active && "bg-brand-500 text-white shadow-sm",
                !done && !active && "bg-slate-100 text-slate-500",
              )}
            >
              <span className="hidden sm:inline mr-1">{i + 1}.</span>{s}
            </span>
            {i < STEPS.length - 1 && (
              <span className={clsx("h-px w-3 sm:w-6", done ? "bg-secure-500" : "bg-slate-200")} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
