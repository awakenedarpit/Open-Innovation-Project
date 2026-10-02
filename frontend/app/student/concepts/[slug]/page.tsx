"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, BookOpen, CheckCircle2, AlertTriangle, Play, GitCommit, Layers, ArrowRight } from "lucide-react";
import { fetchGraph, fetchLesson, fetchQuestions } from "@/lib/api";
import type { Concept, PrerequisiteEdge, Lesson, Question } from "@/lib/types";

export default function ConceptDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [concept, setConcept] = useState<Concept | null>(null);
  const [edges, setEdges] = useState<PrerequisiteEdge[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    
    Promise.all([fetchGraph(), fetchLesson(slug), fetchQuestions()])
      .then(([graphData, lessonData, questions]) => {
        const found = graphData.concepts.find((c) => c.id === slug);
        setConcept(found || null);
        setEdges(graphData.edges);
        setLesson(lessonData);
        setQuestion(questions.find((q) => q.target_concept_id === slug) || null);
      })
      .catch((err) => console.error("Error loading concept details:", err))
      .finally(() => setLoading(false));
  }, [slug]);

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

  if (!concept) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold text-navy-900">Concept Not Found</h2>
          <p className="text-sm text-navy-600">The requested concept identifier '{slug}' does not exist in the prerequisite DAG.</p>
          <Link href="/student/concepts" className="inline-flex items-center text-xs font-semibold text-brand-700 underline">
            Return to Concept Explorer
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const prereqs = edges.filter((e) => e.to_concept_id === concept.id);
  const dependents = edges.filter((e) => e.from_concept_id === concept.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        <Sidebar mode="student" />

        <main className="flex-1 space-y-8 min-w-0">
          
          <Link
            href="/student/concepts"
            className="inline-flex items-center text-xs font-semibold text-navy-600 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Concept Explorer
          </Link>

          {/* Header Card */}
          <div className="bg-white border border-navy-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                {concept.grade_band || "CS Concept"}
              </span>
              <span className="text-xs font-mono text-navy-500">ID: {concept.id}</span>
            </div>

            <h1 className="text-3xl font-bold text-navy-950">{concept.title}</h1>
            <p className="text-navy-600 text-sm leading-relaxed max-w-3xl">
              {concept.description}
            </p>

            <div className="pt-4 border-t border-navy-100 flex flex-wrap gap-4">
              <Link
                href={`/student/lesson/${concept.id}`}
                className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Study Micro-Lesson
              </Link>
              <Link
                href={question ? `/student/quiz/${question.id}` : `/student/dashboard`}
                className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-navy-800 bg-navy-100 hover:bg-navy-200 rounded-xl transition-colors"
              >
                <Play className="w-4 h-4 mr-2 text-navy-700" />
                Test Concept Understanding
              </Link>
            </div>
          </div>

          {/* DAG Dependencies & Lesson Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Dependencies */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-navy-200 rounded-2xl p-6 shadow-subtle space-y-4">
                <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-brand-600" />
                  Prerequisite Graph Connections
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-navy-500 block mb-1">Direct Prerequisites</span>
                    {prereqs.length > 0 ? (
                      <div className="space-y-1.5">
                        {prereqs.map((e) => (
                          <Link
                            key={e.from_concept_id}
                            href={`/student/concepts/${e.from_concept_id}`}
                            className="block p-2 rounded-lg bg-navy-50 hover:bg-navy-100 border border-navy-200 text-navy-800 font-medium transition-colors"
                          >
                            {e.from_concept_id}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-navy-400 italic">None (Root prerequisite)</span>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-navy-500 block mb-1">Downstream Dependent Concepts</span>
                    {dependents.length > 0 ? (
                      <div className="space-y-1.5">
                        {dependents.map((e) => (
                          <Link
                            key={e.to_concept_id}
                            href={`/student/concepts/${e.to_concept_id}`}
                            className="block p-2 rounded-lg bg-navy-50 hover:bg-navy-100 border border-navy-200 text-navy-800 font-medium transition-colors"
                          >
                            {e.to_concept_id}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-navy-400 italic">None (Terminal concept)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Lesson Quick Preview */}
            <div className="lg:col-span-8 space-y-6">
              {lesson ? (
                <div className="bg-white border border-navy-200 rounded-2xl p-6 sm:p-8 shadow-subtle space-y-6">
                  <div className="flex items-center justify-between border-b border-navy-100 pb-4">
                    <h3 className="text-lg font-bold text-navy-900">Micro-Lesson Overview</h3>
                    <span className="text-xs font-mono bg-brand-50 text-brand-700 px-2.5 py-1 rounded">
                      Source: {lesson.source}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs text-navy-700 leading-relaxed">
                    <div>
                      <h4 className="font-bold text-navy-900 text-sm mb-1">Explanation</h4>
                      <p>{lesson.explanation}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-navy-900 text-sm mb-1">Worked Example</h4>
                      <div className="p-4 bg-navy-900 text-navy-100 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {lesson.worked_example}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-navy-100 flex justify-end">
                    <Link
                      href={`/student/lesson/${concept.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      <span>Full Interactive Lesson</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-navy-200 rounded-2xl p-8 text-center text-xs text-navy-500">
                  No static lesson found for this concept.
                </div>
              )}
            </div>

          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
}
