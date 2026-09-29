"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ConceptGraph } from "@/components/ConceptGraph";
import { 
  Activity, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  GitCommit, 
  BookOpen, 
  HelpCircle,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { fetchTrace, fetchGraph, startRepairSession } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import type { TraceResponse, Concept, PrerequisiteEdge } from "@/lib/types";

export default function TraceDiagnosisPage() {
  const params = useParams();
  const router = useRouter();
  const qid = (params?.id as string) || "q_ptr_01";
  const learnerId = getLearnerId();

  const [trace, setTrace] = useState<TraceResponse | null>(null);
  const [graphConcepts, setGraphConcepts] = useState<Concept[]>([]);
  const [graphEdges, setGraphEdges] = useState<PrerequisiteEdge[]>([]);
  const [analyzing, setAnalyzing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startingRepair, setStartingRepair] = useState(false);

  useEffect(() => {
    // Phase 1: Simulate live X-Ray analysis scanning step
    const timer = setTimeout(() => {
      setAnalyzing(false);
    }, 1200);

    Promise.all([fetchTrace(learnerId, qid), fetchGraph()])
      .then(([traceData, graphData]) => {
        setTrace(traceData);
        setGraphConcepts(graphData.concepts);
        setGraphEdges(graphData.edges);
      })
      .catch((err) => console.error("Trace error:", err))
      .finally(() => setLoading(false));

    return () => clearTimeout(timer);
  }, [learnerId, qid]);

  const handleStartRepair = async () => {
    if (!trace || !trace.recommended_candidate_id) {
      router.push(`/student/lesson/pointer_arithmetic`);
      return;
    }
    setStartingRepair(true);
    try {
      const session = await startRepairSession({
        learner_id: learnerId,
        original_question_id: qid,
        root_cause_concept_id: trace.recommended_candidate_id,
      });
      router.push(`/student/repair/${session.session_id}`);
    } catch (err) {
      console.error(err);
      router.push(`/student/lesson/${trace.recommended_candidate_id}`);
    } finally {
      setStartingRepair(false);
    }
  };

  if (loading || analyzing) {
    return (
      <div className="min-h-screen flex flex-col bg-navy-950 text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center px-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-400 animate-spin"></div>
            <Activity className="w-8 h-8 text-brand-400 absolute inset-0 m-auto animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-400 font-bold">
              X-Ray Prerequisite Analysis
            </span>
            <h2 className="text-2xl font-bold text-white">
              Scanning Prerequisite Graph...
            </h2>
            <p className="text-xs text-navy-400">
              Walking backward along prerequisite edges to identify the root misconception behind this answer.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto py-16 text-center space-y-4 px-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-navy-900">Trace Analysis Unavailable</h2>
          <p className="text-xs text-navy-600">Could not retrieve root-cause trace for question '{qid}'.</p>
          <Link href="/student/dashboard" className="text-xs font-semibold text-brand-700 underline">
            Return to Dashboard
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const rootCandidate = trace.candidates.find((c) => c.concept_id === trace.recommended_candidate_id) || trace.candidates[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-elevated space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>X-Ray Root Cause Analysis Complete</span>
            </div>
            <span className="text-xs font-mono text-navy-400">Question ID: {trace.question_id}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-brand-400 font-bold">
                ROOT MISCONCEPTION DETECTED
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {rootCandidate?.concept_title || trace.target_concept_id}
              </h1>
              <p className="text-xs sm:text-sm text-navy-300 leading-relaxed">
                {rootCandidate?.rationale || "The system traced an upstream prerequisite breakdown."}
              </p>
            </div>

            <div className="lg:col-span-4 bg-navy-900/90 border border-navy-800 p-4 rounded-2xl space-y-2 text-center">
              <span className="text-[11px] uppercase tracking-wider text-navy-400 font-semibold block">
                Diagnostic Confidence
              </span>
              <div className="text-2xl font-mono font-bold text-brand-400 uppercase">
                {rootCandidate?.confidence || "Medium"} ({rootCandidate?.score || 85}%)
              </div>
              <span className="text-[10px] text-navy-400 block">
                Hop Distance: {rootCandidate?.hop_distance || 1} level(s) upstream
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border border-navy-200 rounded-2xl p-6 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-navy-900">Recommended Learning Action</h3>
            <p className="text-xs text-navy-600">
              Complete a 3-minute targeted micro-lesson followed by a diagnostic probe question to update your concept mastery.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={handleStartRepair}
              disabled={startingRepair}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-xs font-bold text-navy-950 bg-brand-400 hover:bg-brand-300 rounded-xl transition-all shadow-md group"
            >
              {startingRepair ? (
                <span>Launching Repair...</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Repair My Understanding</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Path Graph */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-brand-600" />
              Prerequisite Graph Path Highlight
            </h3>
            <span className="text-xs text-navy-500 font-mono">
              Target Node: {trace.target_concept_id}
            </span>
          </div>

          <ConceptGraph
            concepts={graphConcepts}
            edges={graphEdges}
            targetId={trace.target_concept_id}
            candidates={trace.candidates}
            recommendedCandidateId={trace.recommended_candidate_id}
          />
        </div>

      </main>

      <Footer />
    </div>
  );
}
