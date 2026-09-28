"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { ConceptPatternDrawer } from "@/components/ConceptPatternDrawer";
import type { ConceptPatternsResponse, HeatmapResponse } from "@/lib/types";

export default function TeacherPage() {
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [patterns, setPatterns] = useState<ConceptPatternsResponse | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.teacherHeatmap()
      .then(setHeatmap)
      .catch((e: ApiError) => setError(e.message));
  }, []);

  async function openConcept(conceptId: string) {
    setSelectedConcept(conceptId);
    setPatterns(null);
    setPatternsLoading(true);
    try {
      const p = await api.teacherConceptPatterns(conceptId);
      setPatterns(p);
    } catch (e: any) {
      setError(e?.message ?? "Could not load patterns.");
    } finally {
      setPatternsLoading(false);
    }
  }

  function closeDrawer() {
    setSelectedConcept(null);
    setPatterns(null);
  }

  const hotCount = heatmap?.cells.filter(
    (c) => !c.suppressed && c.wrong_rate >= 0.5,
  ).length ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Teacher view
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Where the class is stuck
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Aggregate view of the seeded demo class. Click any concept to see
          anonymised wrong-answer patterns. No individual learners are
          identified anywhere on this screen.
        </p>
      </header>

      {error && (
        <ErrorBanner message={error} onRetry={() => location.reload()} />
      )}
      {!heatmap && !error && <LoadingState label="Aggregating class attempts…" />}

      {heatmap && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Learners" value={heatmap.learner_count} />
            <Stat label="Attempts" value={heatmap.attempt_count} />
            <Stat label="Hot concepts" value={hotCount} hint="≥ 50% wrong" />
          </div>

          <HeatmapGrid cells={heatmap.cells} onSelect={openConcept} />

          {heatmap.suppression_note && (
            <p className="text-xs text-slate-500">{heatmap.suppression_note}</p>
          )}
        </>
      )}

      <ConceptPatternDrawer
        open={selectedConcept !== null}
        loading={patternsLoading}
        patterns={patterns}
        onClose={closeDrawer}
      />
    </div>
  );
}

function Stat({
  label, value, hint,
}: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}
