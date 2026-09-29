"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lightbulb, 
  Code2, 
  HelpCircle,
  Play
} from "lucide-react";
import { fetchLesson, fetchGraph } from "@/lib/api";
import type { Lesson, Concept } from "@/lib/types";

export default function MicroLessonPage() {
  const params = useParams();
  const conceptId = (params?.id as string) || "pointer_arithmetic";

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLesson(conceptId), fetchGraph()])
      .then(([lessonData, graphData]) => {
        setLesson(lessonData);
        const found = graphData.concepts.find((c) => c.id === conceptId);
        setConcept(found || null);
      })
      .catch((err) => console.error("Lesson error:", err))
      .finally(() => setLoading(false));
  }, [conceptId]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Lesson Header */}
        <div className="bg-white border border-navy-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Targeted Micro-Lesson
            </span>
            <span className="text-xs font-mono text-navy-500">
              Source: {lesson?.source || "static_fallback"}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-navy-950">
            {lesson?.title || concept?.title || conceptId}
          </h1>

          <p className="text-sm text-navy-600 leading-relaxed">
            {concept?.description || "Mastering this prerequisite concept is essential for building downstream data structure logic."}
          </p>
        </div>

        {/* Structured Editorial Sections */}
        <div className="space-y-6">
          
          {/* Why This Matters */}
          <div className="bg-brand-50/60 border border-brand-200 rounded-2xl p-6 space-y-2">
            <h3 className="text-base font-bold text-brand-950 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-brand-600" />
              Why This Matters
            </h3>
            <p className="text-xs text-brand-900 leading-relaxed">
              Without mastering <strong className="font-semibold">{concept?.title || conceptId}</strong>, calculating offsets in dynamic arrays or custom data structures will consistently produce memory access errors or subtle bugs.
            </p>
          </div>

          {/* Detailed Explanation */}
          <div className="bg-white border border-navy-200 rounded-2xl p-6 sm:p-8 shadow-subtle space-y-4">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-navy-700" />
              Concept Explanation
            </h3>
            <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-line">
              {lesson?.explanation}
            </p>
          </div>

          {/* Worked Example */}
          <div className="bg-white border border-navy-200 rounded-2xl p-6 sm:p-8 shadow-subtle space-y-4">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-brand-600" />
              Worked Example
            </h3>
            <div className="bg-navy-950 text-navy-100 p-5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap border border-navy-800">
              {lesson?.worked_example}
            </div>
          </div>

          {/* Common Misconception Callout */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 space-y-2">
            <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Common Misconception
            </h3>
            <p className="text-xs text-rose-900 leading-relaxed">
              Students often assume adding `1` to a pointer increases its memory address by 1 byte. In reality, pointer arithmetic scales the offset by `sizeof(T)`—adding 1 to an `int*` advances the address by 4 bytes.
            </p>
          </div>

        </div>

        {/* Validation CTA */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-elevated">
          <div>
            <h3 className="text-base font-bold text-white">Ready to Validate Understanding?</h3>
            <p className="text-xs text-navy-300">
              Answer 2 quick diagnostic questions to confirm mastery and update your learning progress.
            </p>
          </div>

          <Link
            href={`/student/quiz/q_ptr_01`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-navy-950 bg-brand-400 hover:bg-brand-300 rounded-xl transition-all shadow-md shrink-0"
          >
            <Play className="w-4 h-4 fill-navy-950" />
            <span>Test My Understanding</span>
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
