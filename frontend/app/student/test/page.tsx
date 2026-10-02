"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchQuestions, recordAttempt, fetchGraph } from "@/lib/api";
import { getLearnerId } from "@/lib/learner";
import type { Question, Concept } from "@/lib/types";

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([fetchQuestions(), fetchGraph()]).then(([qs, graph]) => {
      setQuestions(qs);
      setConcepts(graph.concepts);
    }).catch(console.error);
  }, []);

  const testQuestions = useMemo(() => {
    const seen = new Set<string>();
    return questions.filter((q) => {
      if (seen.has(q.target_concept_id)) return false;
      seen.add(q.target_concept_id);
      return true;
    }).slice(0, 8);
  }, [questions]);

  async function submit() {
    if (submitted || testQuestions.some((q) => !answers[q.id])) return;
    await Promise.all(testQuestions.map((q) => recordAttempt({
      learner_id: getLearnerId(),
      question_id: q.id,
      answer: answers[q.id],
      outcome: answers[q.id] === q.correct_option_id ? "correct" : "incorrect",
    })));
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Mixed Concept Test</p>
          <h1 className="text-3xl font-bold text-navy-950 mt-2">Check your understanding across the curriculum</h1>
          <p className="text-sm text-navy-600 mt-2">Each question targets a different concept, so the test does not repeat the same item.</p>
        </div>

        {testQuestions.map((q, index) => {
          const concept = concepts.find((c) => c.id === q.target_concept_id);
          const correct = submitted && answers[q.id] === q.correct_option_id;
          return (
            <section key={q.id} className="bg-white border border-navy-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-brand-700">Question {index + 1}</span>
                <span className="text-xs text-navy-500">{concept?.title ?? q.target_concept_id}</span>
              </div>
              <h2 className="text-lg font-bold text-navy-900">{q.prompt}</h2>
              <div className="grid gap-2">
                {q.options.map((o) => (
                  <button
                    key={o.id}
                    disabled={submitted}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                    className={`text-left p-3 rounded-xl border ${answers[q.id] === o.id ? "border-brand-500 bg-brand-50" : "border-navy-200"} `}
                  >
                    <b>{o.id.toUpperCase()}.</b> {o.text}
                  </button>
                ))}
              </div>
              {submitted && (
                <p className={`text-sm font-semibold ${correct ? "text-emerald-700" : "text-rose-700"}`}>
                  {correct ? "Correct" : `Correct answer: ${q.correct_option_id.toUpperCase()}`}
                </p>
              )}
            </section>
          );
        })}

        <button
          onClick={submit}
          disabled={submitted || testQuestions.length === 0 || testQuestions.some((q) => !answers[q.id])}
          className="w-full py-3 rounded-xl bg-navy-900 text-white font-semibold disabled:opacity-40"
        >
          {submitted ? "Test Submitted" : "Submit Test"}
        </button>
        {submitted && <Link href="/student/dashboard" className="block text-center text-sm font-semibold text-brand-700">Return to dashboard</Link>}
      </main>
      <Footer />
    </div>
  );
}
