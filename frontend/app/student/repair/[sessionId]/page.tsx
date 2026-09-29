"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  HelpCircle,
  Activity
} from "lucide-react";
import { fetchRepairSession, submitRepairResult } from "@/lib/api";
import type { RepairCheckSession, RepairCheckResult } from "@/lib/types";

export default function RepairSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params?.sessionId as string) || "";

  const [session, setSession] = useState<RepairCheckSession | null>(null);
  const [probeAnswer, setProbeAnswer] = useState<string | null>(null);
  const [parallelAnswer, setParallelAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RepairCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetchRepairSession(sessionId)
      .then((data) => setSession(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!session || !probeAnswer || !parallelAnswer) return;

    setSubmitting(true);
    try {
      const probeIsCorrect = probeAnswer === session.probe_question.correct_option_id;
      const parallelIsCorrect = parallelAnswer === session.parallel_question.correct_option_id;

      const res = await submitRepairResult(sessionId, {
        probe_answer: probeAnswer,
        probe_outcome: probeIsCorrect ? "correct" : "incorrect",
        parallel_answer: parallelAnswer,
        parallel_outcome: parallelIsCorrect ? "correct" : "incorrect",
      });

      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to submit repair outcome");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto py-16 text-center space-y-4 px-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-navy-900">Repair Session Expired</h2>
          <p className="text-xs text-navy-600">The requested repair session could not be found.</p>
          <Link href="/student/dashboard" className="text-xs font-semibold text-brand-700 underline">
            Return to Dashboard
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Header */}
        <div className="bg-white border border-navy-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-3">
          <div className="flex items-center justify-between border-b border-navy-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Learning Repair & Validation Loop
            </span>
            <span className="text-xs font-mono text-navy-500">Session: {session.session_id.substring(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-950">
            Validate Concept Understanding
          </h1>
          <p className="text-xs text-navy-600 max-w-2xl">
            Answer both questions below to test your diagnosed root cause concept (<strong className="font-semibold">{session.root_cause_concept_id}</strong>) and your target application skill.
          </p>
        </div>

        {/* Result Outcome View (When Submitted) */}
        {result ? (
          <div className="bg-white border border-navy-200 rounded-3xl p-8 shadow-elevated space-y-8 animate-in fade-in duration-300">
            
            <div className="text-center max-w-lg mx-auto space-y-3">
              {result.repair_succeeded ? (
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              )}

              <h2 className="text-2xl font-bold text-navy-950">
                {result.repair_succeeded ? "Repair Verified Successfully!" : "Partial Repair Detected"}
              </h2>
              <p className="text-xs text-navy-600 leading-relaxed">
                {result.message}
              </p>
            </div>

            {/* Before vs After Mastery Comparison */}
            <div className="p-6 bg-navy-50 rounded-2xl border border-navy-200 grid grid-cols-2 gap-6 text-center">
              <div className="space-y-1 border-r border-navy-200">
                <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">Before Repair</span>
                <div className="text-3xl font-bold text-navy-400 line-through">42%</div>
                <span className="text-[10px] text-navy-500">Needs Attention</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">After Validation</span>
                <div className="text-3xl font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <span>{result.repair_succeeded ? "68%" : "52%"}</span>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-700">Mastery Updated</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <span>Return to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Question 1: Root Cause Probe */}
            <div className="bg-white border border-navy-200 rounded-2xl p-6 sm:p-8 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded">
                  Question 1: Root Cause Probe ({session.root_cause_concept_id})
                </span>
                <span className="text-xs font-mono text-navy-400">ID: {session.probe_question.id}</span>
              </div>

              <h3 className="text-base font-bold text-navy-900">
                {session.probe_question.prompt}
              </h3>

              <div className="space-y-2 pt-2">
                {session.probe_question.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProbeAnswer(opt.id)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-start space-x-3 text-xs font-medium transition-all ${
                      probeAnswer === opt.id
                        ? "border-brand-600 bg-brand-50 text-navy-950 font-semibold"
                        : "border-navy-200 text-navy-700 hover:bg-navy-50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0">
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Parallel Application Check */}
            <div className="bg-white border border-navy-200 rounded-2xl p-6 sm:p-8 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                <span className="text-xs font-bold text-navy-800 bg-navy-100 px-2.5 py-1 rounded">
                  Question 2: Parallel Application Check
                </span>
                <span className="text-xs font-mono text-navy-400">ID: {session.parallel_question.id}</span>
              </div>

              <h3 className="text-base font-bold text-navy-900">
                {session.parallel_question.prompt}
              </h3>

              <div className="space-y-2 pt-2">
                {session.parallel_question.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setParallelAnswer(opt.id)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-start space-x-3 text-xs font-medium transition-all ${
                      parallelAnswer === opt.id
                        ? "border-navy-900 bg-navy-50 text-navy-950 font-semibold"
                        : "border-navy-200 text-navy-700 hover:bg-navy-50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0">
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!probeAnswer || !parallelAnswer || submitting}
                className={`inline-flex items-center justify-center px-6 py-3 text-xs font-bold text-white rounded-xl transition-all ${
                  !probeAnswer || !parallelAnswer || submitting
                    ? "bg-navy-300 cursor-not-allowed"
                    : "bg-navy-900 hover:bg-navy-800 shadow-md"
                }`}
              >
                {submitting ? "Evaluating Repair..." : "Submit Repair Check"}
              </button>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
