"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ConceptGraph } from "@/components/ConceptGraph";
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Target, 
  HelpCircle, 
  BarChart3, 
  ShieldCheck, 
  Sparkles,
  GitCommit,
  BookOpen,
  Layers,
  ChevronRight
} from "lucide-react";
import { fetchGraph } from "@/lib/api";
import type { Concept, PrerequisiteEdge } from "@/lib/types";

export default function LandingPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [edges, setEdges] = useState<PrerequisiteEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraph()
      .then((data) => {
        setConcepts(data.concepts);
        setEdges(data.edges);
      })
      .catch((err) => console.error("Failed to load landing graph:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Next-Gen Educational Technology Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.15]">
                See What's Behind <br />
                <span className="font-serif italic font-normal text-brand-600">Every Wrong Answer.</span>
              </h1>

              <p className="text-base sm:text-lg text-navy-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Traditional platforms simply mark answers wrong and display explanations. 
                <strong className="text-navy-900 font-semibold"> Concept X-Ray</strong> traces student responses backward through a prerequisite concept graph to uncover the exact hidden misconception.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/student/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl shadow-md hover:shadow-lg transition-all group"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-navy-800 bg-white hover:bg-navy-50 rounded-xl border border-navy-200 shadow-subtle transition-colors"
                >
                  Explore How It Works
                </Link>
              </div>

              <div className="pt-6 border-t border-navy-100 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                <div>
                  <span className="block text-2xl font-bold text-navy-900">30+</span>
                  <span className="text-xs text-navy-500 font-medium">CS Concepts</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-navy-900">39</span>
                  <span className="text-xs text-navy-500 font-medium">Prereq Edges</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-brand-600">100%</span>
                  <span className="text-xs text-navy-500 font-medium">Root-Cause Precision</span>
                </div>
              </div>
            </div>

            {/* Right Visual Representation (X-Ray Diagnostic Diagram) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-elevated relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-navy-700">
                      Live X-Ray Diagnostics
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-navy-100 text-navy-700 px-2 py-0.5 rounded">
                    RCA Engine Active
                  </span>
                </div>

                {/* X-Ray Traversal Flow */}
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-rose-900 font-medium">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Student Question Attempt: Incorrect</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-700 font-bold">Pointer Arithmetic</span>
                  </div>

                  <div className="flex justify-center my-1">
                    <div className="w-0.5 h-4 bg-navy-300"></div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-medium">
                      <GitCommit className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Traced Prerequisite DAG</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-700 font-bold">2 Hops Upstream</span>
                  </div>

                  <div className="flex justify-center my-1">
                    <div className="w-0.5 h-4 bg-navy-300"></div>
                  </div>

                  <div className="p-4 bg-navy-900 text-white rounded-xl shadow-md space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-300 font-semibold uppercase tracking-wider text-[10px]">
                        Detected Root Misconception
                      </span>
                      <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono text-[10px]">
                        87% Confidence
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">Pointer Dereferencing vs Address Value</h4>
                    <p className="text-xs text-navy-300 leading-snug">
                      Learner confuses the memory address holding the pointer with the value at the address target.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-navy-500 font-medium">Recommended Action:</span>
                    <Link
                      href="/student/quiz/q_ptr_01"
                      className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                    >
                      <span>Launch Micro-Lesson</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Problem Comparison Section */}
      <section className="py-16 lg:py-24 bg-white border-y border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              The Diagnostic Gap
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-950">
              An incorrect answer is only the symptom.
            </h2>
            <p className="text-navy-600 text-base">
              Traditional quiz applications address wrong answers with instant solution displays. Concept X-Ray diagnoses the foundational prerequisite breakdown that caused the error.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Traditional System */}
            <div className="p-8 rounded-2xl bg-navy-50 border border-navy-200 space-y-6">
              <div className="flex items-center justify-between border-b border-navy-200 pb-4">
                <h3 className="text-lg font-bold text-navy-900">Traditional Learning System</h3>
                <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                  Symptom-Level
                </span>
              </div>
              <ul className="space-y-4 text-sm text-navy-700">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>Marks answers wrong without analyzing missing prerequisites.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>Shows correct answers immediately, encouraging passive memorization.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>Moves straight to the next question without prerequisite repair.</span>
                </li>
              </ul>
            </div>

            {/* Concept X-Ray System */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 text-white shadow-elevated space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-navy-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-400" />
                  Concept X-Ray Diagnostic System
                </h3>
                <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
                  Root-Cause Learning
                </span>
              </div>
              <ul className="space-y-4 text-sm text-navy-200">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <span>Traces incorrect answers backward through directed prerequisite DAGs.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <span>Detects root misconceptions with weighted confidence scoring.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <span>Delivers targeted micro-lessons and validates mastery with diagnostic probes.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 5-Step Diagnostic Loop Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-[#fbfcfd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              Five-Step Cycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-950">
              How Concept X-Ray Operates
            </h2>
            <p className="text-navy-600 text-base">
              A continuous, intelligent loop built to diagnose, repair, and validate student understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { num: "01", title: "Attempt", desc: "Student answers a diagnostic question.", icon: HelpCircle },
              { num: "02", title: "Trace", desc: "RCA engine walks backward along prerequisite edges.", icon: GitCommit },
              { num: "03", title: "Diagnose", desc: "Identifies the exact underlying root misconception.", icon: Target },
              { num: "04", title: "Repair", desc: "Student receives a targeted micro-lesson.", icon: BookOpen },
              { num: "05", title: "Validate", desc: "Diagnostic probe questions verify concept mastery.", icon: CheckCircle2 },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white border border-navy-200 rounded-2xl p-6 space-y-4 hover:border-brand-500 hover:shadow-card transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                      {step.num}
                    </span>
                    <Icon className="w-5 h-5 text-navy-400" />
                  </div>
                  <h3 className="text-base font-bold text-navy-900">{step.title}</h3>
                  <p className="text-xs text-navy-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Concept Graph Section */}
      <section className="py-16 lg:py-24 bg-white border-t border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                Prerequisite Architecture
              </span>
              <h2 className="text-3xl font-bold text-navy-950 mt-2">
                Interactive Computer Science Concept DAG
              </h2>
              <p className="text-navy-600 text-sm max-w-xl mt-1">
                Explore how 30 CS concepts and 39 prerequisite relationships are connected in the Concept X-Ray diagnostic engine.
              </p>
            </div>
            <Link
              href="/student/concepts"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              <span>Explore Full Curriculum Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ConceptGraph concepts={concepts} edges={edges} isLoading={loading} />
        </div>
      </section>

      {/* Student & Teacher CTA Section */}
      <section className="py-16 lg:py-24 bg-navy-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Student card */}
            <div className="bg-navy-900/80 border border-navy-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">For Students</h3>
                <p className="text-sm text-navy-300 leading-relaxed">
                  Never get stuck guessing why an answer was wrong. Concept X-Ray guides you step-by-step through prerequisite micro-lessons tailored to your exact learning gaps.
                </p>
              </div>
              <Link
                href="/student/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-navy-950 bg-brand-400 hover:bg-brand-300 rounded-xl transition-colors w-fit"
              >
                Launch Student Portal
              </Link>
            </div>

            {/* Teacher card */}
            <div className="bg-navy-900/80 border border-navy-800 rounded-3xl p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">For Educators</h3>
                <p className="text-sm text-navy-300 leading-relaxed">
                  Gain class-level analytics, concept heatmaps, and common misconception breakdowns—protected by built-in k-anonymity privacy controls.
                </p>
              </div>
              <Link
                href="/teacher/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-navy-800 hover:bg-navy-700 rounded-xl border border-navy-700 transition-colors w-fit"
              >
                View Teacher Analytics
              </Link>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
