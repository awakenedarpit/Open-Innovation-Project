"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchQuestions, recordAttempt, fetchGraph } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import type { Question, Concept } from "@/lib/types";

export default function QuizQuestionPage() {
  const params = useParams();
  const questionId = String(params?.questionId ?? "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchQuestions(), fetchGraph()])
      .then(([qs, graph]) => {
        setQuestions(qs);
        setConcepts(graph.concepts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const question = useMemo(() => questions.find((q) => q.id === questionId), [questions, questionId]);
  const concept = concepts.find((c) => c.id === question?.target_concept_id);
  const correct = submitted && selected === question?.correct_option_id;

  async function submit() {
    if (!question || !selected || submitted) return;
    const outcome = selected === question.correct_option_id ? "correct" : "incorrect";
    await recordAttempt({
      learner_id: getLearnerId(),
      question_id: question.id,
      answer: selected,
      outcome,
    });
    setSubmitted(true);
  }

  const nextQuestion = question
    ? questions.find((q) => q.target_concept_id === question.target_concept_id && q.id !== question.id)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-sm text-navy-600 hover:text-navy-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        {loading ? (
          <div className="bg-white border border-navy-200 rounded-2xl p-10 text-center">Loading question…</div>
        ) : !question ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8">
            <h1 className="text-xl font-bold text-navy-900">Question not found</h1>
            <p className="text-sm text-navy-600 mt-2">This question is not part of the reviewed curriculum.</p>
          </div>
        ) : (
          <div className="bg-white border border-navy-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-7">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold">
                {concept?.title ?? question.target_concept_id}
              </span>
              <span className="px-3 py-1 rounded-full bg-navy-50 text-navy-700 border border-navy-200 text-xs font-semibold capitalize">
                {question.difficulty}
              </span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-navy-500 font-bold">Diagnostic Question</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-950 mt-2">{question.prompt}</h1>
            </div>

            <div className="space-y-3">
              {question.options.map((option) => {
                const isChosen = selected === option.id;
                const isCorrect = submitted && option.id === question.correct_option_id;
                return (
                  <button
                    key={option.id}
                    disabled={submitted}
                    onClick={() => setSelected(option.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${isCorrect ? "border-emerald-400 bg-emerald-50" : isChosen ? "border-brand-500 bg-brand-50" : "border-navy-200 bg-white hover:border-brand-300"}`}
                  >
                    <span className="font-semibold mr-3">{option.id.toUpperCase()}.</span>{option.text}
                  </button>
                );
              })}
            </div>

            {!submitted ? (
              <button
                onClick={submit}
                disabled={!selected}
                className="w-full py-3 rounded-xl bg-navy-900 text-white font-semibold disabled:opacity-40"
              >
                Submit Answer
              </button>
            ) : (
              <div className={`rounded-2xl p-5 ${correct ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                <div className="flex items-center gap-2 font-bold">
                  {correct ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  {correct ? "Correct" : "Not quite"}
                </div>
                <p className="text-sm mt-2 text-navy-700">{question.answer_rubric}</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {nextQuestion && (
                    <Link href={`/student/quiz/${nextQuestion.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold">
                      Next question <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  <Link href="/student/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-navy-200 text-sm font-semibold">
                    Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
