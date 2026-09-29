"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, Activity, Sparkles, AlertTriangle } from "lucide-react";
import { fetchQuestions, recordAttempt } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import type { Question, QuestionOption } from "@/lib/types";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const qid = (params?.id as string) || "q_ptr_01";

  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const learnerId = getLearnerId();

  useEffect(() => {
    fetchQuestions()
      .then((questions) => {
        const found = questions.find((q) => q.id === qid) || questions[0];
        setQuestion(found || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [qid]);

  const handleSubmit = async () => {
    if (!question || !selectedOptionId) return;

    setSubmitting(true);
    try {
      const isCorrect = selectedOptionId === question.correct_option_id;

      // Save attempt to FastAPI backend
      await recordAttempt({
        learner_id: learnerId,
        question_id: question.id,
        answer: selectedOptionId,
        outcome: isCorrect ? "correct" : "incorrect",
      });

      if (!isCorrect) {
        // Redirect to X-Ray Diagnosis animation screen!
        router.push(`/student/trace/${question.id}`);
      } else {
        // Correct answer view
        alert("Correct! You mastered this diagnostic question.");
        router.push("/student/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to record attempt");
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

  if (!question) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-navy-900">Question Unavailable</h2>
          <p className="text-xs text-navy-600">The requested question could not be retrieved from the diagnostic bank.</p>
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
        
        {/* Progress header */}
        <div className="flex items-center justify-between border-b border-navy-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200">
              Q1
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-navy-400 block">
                Diagnostic Assessment
              </span>
              <span className="text-sm font-semibold text-navy-900">
                Target Concept: <span className="text-brand-600">{question.target_concept_id}</span>
              </span>
            </div>
          </div>

          <span className="text-xs font-mono text-navy-500 bg-navy-50 px-3 py-1 rounded-full border border-navy-200">
            ID: {question.id}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-navy-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950 leading-snug">
              {question.prompt}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                    isSelected
                      ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                      : "border-navy-200 bg-white hover:border-navy-300 hover:bg-navy-50/50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-navy-300 text-navy-600 bg-white"
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="text-sm font-medium text-navy-900 leading-snug">
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-6 border-t border-navy-100 flex items-center justify-between">
            <Link
              href="/student/dashboard"
              className="text-xs font-medium text-navy-500 hover:text-navy-900 transition-colors"
            >
              Cancel & Exit
            </Link>

            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId || submitting}
              className={`inline-flex items-center justify-center px-6 py-3 text-xs font-semibold rounded-xl text-white transition-all ${
                !selectedOptionId || submitting
                  ? "bg-navy-300 cursor-not-allowed"
                  : "bg-navy-900 hover:bg-navy-800 shadow-md hover:shadow"
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Submit Attempt</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
