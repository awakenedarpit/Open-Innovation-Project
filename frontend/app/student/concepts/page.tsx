"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Search, Filter, BookOpen, ArrowRight, CheckCircle2, AlertTriangle, Layers, Network } from "lucide-react";
import { fetchGraph } from "@/lib/api";
import type { Concept, PrerequisiteEdge } from "@/lib/types";

export default function ConceptExplorerPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [edges, setEdges] = useState<PrerequisiteEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  useEffect(() => {
    fetchGraph()
      .then((data) => {
        setConcepts(data.concepts);
        setEdges(data.edges);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredConcepts = concepts.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = gradeFilter === "all" || c.grade_band === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        <Sidebar mode="student" />

        <main className="flex-1 space-y-8 min-w-0">
          
          {/* Header */}
          <div className="space-y-2 border-b border-navy-100 pb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              Curriculum Map
            </span>
            <h1 className="text-3xl font-bold text-navy-950">Concept Explorer</h1>
            <p className="text-sm text-navy-600 max-w-2xl">
              Browse all 30 computer science concepts in the prerequisite graph. Search by keyword or filter by grade band to inspect dependencies.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-navy-200 shadow-subtle">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
              <input
                type="text"
                placeholder="Search concepts by title or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-navy-50 border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-navy-900 placeholder-navy-400"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-navy-400 shrink-0" />
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-navy-50 border border-navy-200 rounded-xl text-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Grade Bands</option>
                <option value="introductory">Introductory</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Concept Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-navy-500 font-medium">Loading concept inventory...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConcepts.map((concept) => {
                const prereqs = edges.filter((e) => e.to_concept_id === concept.id);
                return (
                  <div
                    key={concept.id}
                    className="bg-white border border-navy-200 rounded-2xl p-6 shadow-subtle hover:shadow-card hover:border-brand-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 bg-navy-100 px-2 py-0.5 rounded font-mono">
                          {concept.grade_band || "CS"}
                        </span>
                        <span className="text-[10px] text-brand-700 font-semibold bg-brand-50 px-2 py-0.5 rounded">
                          v{concept.active_version}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-navy-900 leading-snug">
                        {concept.title}
                      </h3>

                      <p className="text-xs text-navy-600 line-clamp-3 leading-relaxed">
                        {concept.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-navy-100 space-y-3">
                      <div className="flex items-center justify-between text-xs text-navy-500">
                        <span>Prerequisites:</span>
                        <span className="font-semibold text-navy-800">
                          {prereqs.length > 0 ? `${prereqs.length} required` : "Root Concept"}
                        </span>
                      </div>

                      <Link
                        href={`/student/concepts/${concept.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        <span>Inspect Concept</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
}
