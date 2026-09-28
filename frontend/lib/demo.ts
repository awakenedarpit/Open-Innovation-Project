import { api } from "./api";
import { getLearnerId, isPrimed, markPrimed } from "./learner";

/**
 * The curated demo script.
 *
 *  1. Warm-up: a correct answer on order-of-operations — establishes the
 *     learner can read and submit.
 *  2. Miss: a factoring question — plants direct-prereq evidence.
 *  3. Target: a quadratic-formula question — the one we trace back from.
 *
 * Priors are seeded so the trace has *inconsistent* evidence on
 * alg.poly_mul (a 3-hop ancestor of the target), which is exactly the
 * signal the scoring rules are designed to prioritise.
 */
export const DEMO_SCRIPT = {
  warmup: "q.num.operations.01",
  prereqMiss: "q.alg.factoring.01",
  target: "q.alg.quadratic_formula.01",
} as const;

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

/**
 * Seed historical evidence for the demo learner, once per browser.
 * Uses `alg.poly_mul`'s two reviewed questions — one older correct,
 * one recent incorrect — to trigger the `inconsistent_recent` rule.
 *
 * Idempotent: guarded by localStorage so refreshes don't inflate the log.
 */
export async function primeDemoEvidence(): Promise<void> {
  if (isPrimed()) return;
  const learnerId = getLearnerId();

  await api.postAttempt({
    learner_id: learnerId,
    question_id: "q.alg.poly_mul.02",
    answer: "a",
    outcome: "correct",
    timestamp: hoursAgo(30),
  });

  await api.postAttempt({
    learner_id: learnerId,
    question_id: "q.alg.poly_mul.01",
    answer: "c",
    outcome: "incorrect",
    timestamp: hoursAgo(2),
  });

  markPrimed();
}
