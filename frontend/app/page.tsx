"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Stepper } from "@/components/Stepper";
import { ErrorBanner } from "@/components/ErrorBanner";
import { api, ApiError } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import { primeDemoEvidence } from "@/lib/demo";

export default function Home() {
  const router = useRouter();
  const [learnerId, setLearnerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLearnerId(getLearnerId());
    api.health().then(() => setReady(true)).catch((e: ApiError) => setError(e.message));
  }, []);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await primeDemoEvidence();
      router.push("/quiz");
    } catch (e: any) {
      setError(e?.message ?? "Could not start the demo.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <Stepper current="Quiz" />

      <section className="grid gap-6 sm:grid-cols-5 sm:items-start">
        <div className="sm:col-span-3 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            When a learner gets it wrong,{" "}
            <span className="text-brand-600">find the real gap.</span>
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Concept X-Ray traces backward through prerequisite relationships to
            find the concept a learner never actually mastered — and repairs it
            before re-testing the original question.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><span className="text-brand-600 font-bold">→</span> Every diagnosis shows its evidence.</li>
            <li className="flex gap-2"><span className="text-brand-600 font-bold">→</span> Rule-based scoring — no black box.</li>
            <li className="flex gap-2"><span className="text-brand-600 font-bold">→</span> Nothing is asserted with low confidence.</li>
          </ul>
          {error && <ErrorBanner message={error} />}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={start}
              disabled={!ready || busy}
              className="inline-flex items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-60"
            >
              {busy ? "Priming…" : !ready ? "Connecting…" : "Start demo"}
            </button>
            {learnerId && (
              <span className="text-xs text-slate-400">
                learner: <code className="rounded bg-slate-100 px-1.5 py-0.5">{learnerId}</code>
              </span>
            )}
          </div>
        </div>

        <aside className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">What happens</div>
          <ol className="space-y-2 text-slate-700">
            <li><b>1.</b> You answer three algebra questions.</li>
            <li><b>2.</b> On a miss, we walk the prerequisite graph backward.</li>
            <li><b>3.</b> We show ranked root-cause candidates — with evidence.</li>
            <li><b>4.</b> A micro-lesson teaches the diagnosed gap.</li>
            <li><b>5.</b> A repair check verifies it stuck.</li>
          </ol>
          <p className="pt-2 text-xs text-slate-500 border-t border-slate-100">
            The demo primes two prior attempts on a prerequisite concept, so the
            trace has real evidence to work with — not a cold start.
          </p>
        </aside>
      </section>
    </div>
  );
}
