"use client";
import clsx from "clsx";
import type { HeatmapCell } from "@/lib/types";

type Bucket = "cool" | "mild" | "warm" | "hot" | "critical";

function bucketOf(rate: number): Bucket {
  if (rate >= 0.6) return "critical";
  if (rate >= 0.45) return "hot";
  if (rate >= 0.3) return "warm";
  if (rate >= 0.15) return "mild";
  return "cool";
}

const CELL_STYLE: Record<Bucket, string> = {
  cool:     "border-emerald-200 bg-emerald-50 hover:border-emerald-300",
  mild:     "border-lime-200 bg-lime-50 hover:border-lime-300",
  warm:     "border-amber-200 bg-amber-50 hover:border-amber-300",
  hot:      "border-orange-300 bg-orange-100 hover:border-orange-400",
  critical: "border-red-300 bg-red-100 hover:border-red-400",
};

const BAR_COLOR: Record<Bucket, string> = {
  cool:     "bg-emerald-500",
  mild:     "bg-lime-500",
  warm:     "bg-amber-500",
  hot:      "bg-orange-500",
  critical: "bg-red-500",
};

const LEGEND: { label: string; swatch: string }[] = [
  { label: "0–15%",  swatch: "bg-emerald-400" },
  { label: "15–30%", swatch: "bg-lime-400" },
  { label: "30–45%", swatch: "bg-amber-400" },
  { label: "45–60%", swatch: "bg-orange-400" },
  { label: "60%+",   swatch: "bg-red-400" },
];

export function HeatmapGrid({
  cells, onSelect,
}: { cells: HeatmapCell[]; onSelect: (id: string) => void }) {
  const numCells = cells
    .filter((c) => c.concept_id.startsWith("num."))
    .sort((a, b) => b.wrong_rate - a.wrong_rate);
  const algCells = cells
    .filter((c) => c.concept_id.startsWith("alg."))
    .sort((a, b) => b.wrong_rate - a.wrong_rate);

  return (
    <div className="space-y-8">
      <Legend />
      <Section title="Numeric foundations" cells={numCells} onSelect={onSelect} />
      <Section title="Algebra" cells={algCells} onSelect={onSelect} />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
      <span className="font-semibold uppercase tracking-wide">Wrong rate</span>
      {LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className={clsx("h-3 w-3 rounded", l.swatch)} />
          {l.label}
        </span>
      ))}
    </div>
  );
}

function Section({
  title, cells, onSelect,
}: { title: string; cells: HeatmapCell[]; onSelect: (id: string) => void }) {
  if (cells.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {cells.map((c) => (
          <Cell key={c.concept_id} cell={c} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function Cell({
  cell, onSelect,
}: { cell: HeatmapCell; onSelect: (id: string) => void }) {
  const empty = cell.total_attempts === 0 && !cell.suppressed;
  if (cell.suppressed || empty) {
    return (
      <button
        type="button"
        onClick={() => onSelect(cell.concept_id)}
        className={clsx(
          "rounded-2xl border-2 border-dashed p-4 text-left transition",
          "border-slate-200 bg-slate-50 hover:border-slate-300",
        )}
      >
        <div className="truncate text-sm font-semibold text-slate-600">
          {cell.concept_title}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {cell.suppressed
            ? "🔒 below privacy threshold"
            : "no attempts yet"}
        </div>
      </button>
    );
  }

  const bucket = bucketOf(cell.wrong_rate);
  const pct = Math.round(cell.wrong_rate * 100);
  return (
    <button
      type="button"
      onClick={() => onSelect(cell.concept_id)}
      className={clsx(
        "rounded-2xl border-2 p-4 text-left shadow-sm transition",
        CELL_STYLE[bucket],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">
            {cell.concept_title}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-600">
            {cell.distinct_learners_wrong} of{" "}
            {cell.distinct_learners_attempted} learners wrong
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums leading-none">
            {pct}
            <span className="text-sm">%</span>
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
            wrong
          </div>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/70">
        <div
          className={clsx("h-full rounded-full", BAR_COLOR[bucket])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
