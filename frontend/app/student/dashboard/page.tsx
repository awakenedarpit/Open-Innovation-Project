"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { ConceptGraph } from "@/components/ConceptGraph";
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  Play, 
  Clock,
  Sparkles
} from "lucide-react";
import { fetchGraph, fetchAttempts } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import type { Concept, PrerequisiteEdge } from "@/lib/types";

export default function StudentDashboard() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [edges, setEdges] = useState<PrerequisiteEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const learnerId = getLearnerId();

  useEffect(() => {
    fetchGraph()
      .then((data) => {
        setConcepts(data.concepts);
        setEdges(data.edges);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const masteryMap: Record<string, "mastered" | "developing" | "misconception" | "not_attempted"> = {
    variables: "mastered",
    data_types: "mastered",
    control_flow: "mastered",
    functions: "mastered",
    pointers: "developing",
    pointer_arithmetic: "misconception",
    dynamic_memory: "not_attempted",
    arrays: "mastered",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        <Sidebar mode="student" />

        <main className="flex-1 space-y-8 min-w-0">
          
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-elevated relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Good morning, Learner
              </h1>
              <p className="text-navy-300 text-sm max-w-lg">
                Let's find what you need to learn next. Concept X-Ray has prepared 2 targeted micro-lessons based on your recent activity.
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <Link
                href="/student/quiz/q_ptr_01"
                className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-navy-950 bg-brand-400 hover:bg-brand-300 rounded-xl transition-all shadow-md group"
              >
                <Play className="w-4 h-4 mr-2 text-navy-950 fill-navy-950" />
                Resume Diagnostic Quiz
              </Link>
            </div>
          </div>

          {/* Metric Overview Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Overall Mastery */}
            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Overall Mastery</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-navy-900">68%</div>
              <div className="w-full bg-navy-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[68%]"></div>
              </div>
            </div>

            {/* Concepts Mastered */}
            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Mastered Concepts</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-navy-900">18 / 30</div>
              <p className="text-[11px] text-navy-500">60% of total DAG curriculum</p>
            </div>

            {/* Concepts Needing Attention */}
            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Needs Attention</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">2 Concepts</div>
              <p className="text-[11px] text-amber-700 font-medium">Pointer Arithmetic, Dynamic Memory</p>
            </div>

            {/* Current Streak */}
            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Learning Streak</span>
                <Flame className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-2xl font-bold text-navy-900">4 Days 🔥</div>
              <p className="text-[11px] text-navy-500">Keep it up! 3 repair lessons done.</p>
            </div>

          </div>

          {/* Continue Learning & Recent Diagnosis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Continue Learning Section */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy-900">Continue Learning</h3>
                <Link href="/student/concepts" className="text-xs font-semibold text-brand-700 hover:underline">
                  View All Concepts
                </Link>
              </div>

              <div className="space-y-3">
                
                <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle flex items-center justify-between gap-4 hover:border-brand-300 transition-all">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-900 truncate">Pointer Arithmetic</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                        72% Mastery
                      </span>
                    </div>
                    <div className="w-full bg-navy-100 rounded-full h-2 overflow-hidden max-w-xs">
                      <div className="bg-amber-500 h-full rounded-full w-[72%]"></div>
                    </div>
                  </div>
                  <Link
                    href="/student/lesson/pointer_arithmetic"
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 px-4 py-2 rounded-xl shrink-0 transition-colors"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle flex items-center justify-between gap-4 hover:border-brand-300 transition-all">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy-900 truncate">Dynamic Memory Allocation</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        45% Mastery
                      </span>
                    </div>
                    <div className="w-full bg-navy-100 rounded-full h-2 overflow-hidden max-w-xs">
                      <div className="bg-brand-500 h-full rounded-full w-[45%]"></div>
                    </div>
                  </div>
                  <Link
                    href="/student/lesson/dynamic_memory"
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 px-4 py-2 rounded-xl shrink-0 transition-colors"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            </div>

            {/* Recent Diagnosis Card */}
            <div className="lg:col-span-5 bg-white border border-navy-200 rounded-2xl p-6 shadow-subtle space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    Recent X-Ray Diagnosis
                  </span>
                  <span className="text-[10px] font-mono text-navy-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Today
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-navy-900">
                    Root Misconception Detected
                  </h4>
                  <p className="text-xs font-semibold text-rose-700 mt-0.5">
                    Pointer Dereferencing vs Memory Address
                  </p>
                </div>

                <div className="bg-navy-50 p-3.5 rounded-xl border border-navy-200 text-xs text-navy-700 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-navy-600">
                    <span>Diagnostic Confidence</span>
                    <span className="text-brand-700 font-mono">87% (High)</span>
                  </div>
                  <p className="text-[11px] text-navy-600 leading-tight">
                    "You understand basic pointer syntax, but the distinction between dereferencing (`*p`) and address offset remains ambiguous."
                  </p>
                </div>
              </div>

              <Link
                href="/student/trace/q_ptr_01"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Understand This Concept</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* Interactive Learning Map */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Your Learning Map</h3>
                <p className="text-xs text-navy-500">
                  Interactive prerequisite DAG showing your personal concept mastery states.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-navy-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Mastered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Developing
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Misconception
                </span>
              </div>
            </div>

            <ConceptGraph
              concepts={concepts}
              edges={edges}
              masteryMap={masteryMap}
              isLoading={loading}
            />
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}
