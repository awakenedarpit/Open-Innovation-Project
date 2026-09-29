"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { ConceptGraph } from "@/components/ConceptGraph";
import { 
  Users, 
  BarChart3, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Network, 
  ChevronRight, 
  Info,
  Lock,
  Sparkles
} from "lucide-react";
import { fetchHeatmap, fetchGraph } from "@/lib/api";
import type { HeatmapResponse, Concept, PrerequisiteEdge } from "@/lib/types";

export default function TeacherDashboard() {
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [edges, setEdges] = useState<PrerequisiteEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchHeatmap(), fetchGraph()])
      .then(([heatmapData, graphData]) => {
        setHeatmap(heatmapData);
        setConcepts(graphData.concepts);
        setEdges(graphData.edges);
      })
      .catch((err) => console.error("Teacher heatmap error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        <Sidebar mode="teacher" />

        <main className="flex-1 space-y-8 min-w-0">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>k-Anonymity Privacy Protected (n ≥ 3)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Educator Class Analytics
              </h1>
              <p className="text-navy-300 text-sm max-w-xl">
                Aggregated learning diagnostics across 24 students. Identify prerequisite bottlenecks and targeted interventions without compromising individual student privacy.
              </p>
            </div>

            <div className="bg-navy-900/90 border border-navy-800 p-4 rounded-2xl text-xs space-y-1 text-center shrink-0">
              <span className="text-navy-400 font-semibold block uppercase text-[10px]">Active Cohort</span>
              <span className="text-lg font-bold text-white block">CS 101 — Fall 2026</span>
              <span className="text-brand-400 font-mono text-[10px]">24 Enrolled Students</span>
            </div>
          </div>

          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Total Active Students</span>
                <Users className="w-4 h-4 text-navy-600" />
              </div>
              <div className="text-2xl font-bold text-navy-900">24</div>
              <p className="text-[11px] text-navy-500">Cohort 100% active this week</p>
            </div>

            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Class Average Mastery</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">74%</div>
              <p className="text-[11px] text-emerald-700 font-medium">+4% improvement post-repair</p>
            </div>

            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Prerequisite Bottlenecks</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600">3 Concepts</div>
              <p className="text-[11px] text-amber-700 font-medium">Pointer Dereferencing, Dynamic Memory</p>
            </div>

            <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-navy-500 font-medium">
                <span>Privacy Floor</span>
                <Lock className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-2xl font-bold text-navy-900">n ≥ 3</div>
              <p className="text-[11px] text-navy-500">Small cohorts auto-suppressed</p>
            </div>

          </div>

          {/* Heatmap & Misconception Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Concept Heatmap */}
            <div id="heatmap" className="lg:col-span-7 bg-white border border-navy-200 rounded-2xl p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-navy-100 pb-3">
                <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-600" />
                  Class Concept Heatmap
                </h3>
                <span className="text-[10px] font-mono text-navy-500 bg-navy-50 px-2 py-1 rounded">
                  Cohort n = {heatmap?.learner_count || 24}
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-navy-500">Loading aggregate heatmap data...</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {heatmap?.cells.slice(0, 10).map((cell) => {
                    const errorPct = Math.round(cell.wrong_rate * 100);
                    const isHighRisk = errorPct > 35;
                    return (
                      <div
                        key={cell.concept_id}
                        className="p-3 bg-navy-50 rounded-xl border border-navy-200 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-navy-900 truncate">{cell.concept_title}</span>
                            <span className={`font-mono font-semibold ${isHighRisk ? "text-rose-600" : "text-emerald-700"}`}>
                              {cell.suppressed ? "Suppressed (n < 3)" : `${100 - errorPct}% Mastery`}
                            </span>
                          </div>
                          
                          <div className="w-full bg-navy-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isHighRisk ? "bg-rose-500" : "bg-emerald-500"}`}
                              style={{ width: `${100 - errorPct}%` }}
                            ></div>
                          </div>
                        </div>

                        <span className="text-[10px] text-navy-500 font-mono shrink-0">
                          {cell.total_attempts} attempts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Most Common Misconceptions */}
            <div id="misconceptions" className="lg:col-span-5 bg-white border border-navy-200 rounded-2xl p-6 shadow-subtle space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-navy-100 pb-3">
                  <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Top Misconception Interventions
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-950">Pointer Dereferencing vs Address</span>
                      <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-mono font-bold text-[10px]">
                        11 Learners
                      </span>
                    </div>
                    <p className="text-rose-900 text-[11px] leading-tight">
                      Learners confuse pointer variable value with referenced memory block contents.
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">Array Out-Of-Bounds Offsets</span>
                      <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-bold text-[10px]">
                        7 Learners
                      </span>
                    </div>
                    <p className="text-amber-900 text-[11px] leading-tight">
                      Off-by-one errors when computing indexing bounds in pointer loops.
                    </p>
                  </div>

                </div>
              </div>

              <div className="p-3 bg-navy-50 rounded-xl border border-navy-200 text-[11px] text-navy-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>k-Anonymity active: individual student identities are never exposed in teacher views.</span>
              </div>
            </div>

          </div>

          {/* Prerequisite Class Graph View */}
          <div id="graph" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Class Curriculum Prerequisite DAG</h3>
                <p className="text-xs text-navy-500">
                  Visual breakdown of prerequisite graph dependencies across class learning cohorts.
                </p>
              </div>
            </div>

            <ConceptGraph concepts={concepts} edges={edges} isLoading={loading} />
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}
