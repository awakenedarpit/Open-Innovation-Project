"""
Deterministic seeded class attempts.

Generates a plausible, reproducible attempt log for a demo class by sampling
against hand-tuned per-concept wrong-rate targets. Every run with the same
seed produces the same heatmap — critical for a demo that must not surprise
the presenter.

The distribution is deliberately uneven: numeric foundations are cool, and
the factoring -> quadratic chain is hot. This mirrors the story the learner
flow tells, so a judge sees the same gap from both sides.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from .models import ClassAttempt, Concept, Outcome, Question
from .seed_data import QUESTIONS

CLASS_LEARNER_COUNT = 24
CLASS_SEED = 42
WINDOW_DAYS = 7
COHORT_ID = "demo-class"

# Per-concept wrong-rate targets, hand-tuned in [0, 1].
# Any concept not listed defaults to 0.20.
CONCEPT_WRONG_RATE: dict[str, float] = {
    # numeric foundations — mostly cool
    "num.integers":           0.08,
    "num.operations":         0.15,
    "num.signed":             0.38,
    "num.fractions":          0.30,
    "num.decimals":           0.22,
    "num.exponents":          0.26,
    "num.roots":              0.34,

    # pre-algebra
    "alg.variables":          0.20,
    "alg.substitution":       0.22,
    "alg.combine_like":       0.42,
    "alg.distribute":         0.24,
    "alg.one_step":           0.18,
    "alg.two_step":           0.28,
    "alg.multi_step":         0.34,
    "alg.variables_both_sides": 0.44,
    "alg.inequalities":       0.36,

    # linear functions
    "alg.coordinate":         0.15,
    "alg.slope":              0.36,
    "alg.linear_graph":       0.30,
    "alg.linear_equation":    0.42,

    # polynomials and factoring — warm
    "alg.poly_add_sub":       0.28,
    "alg.poly_mul":           0.48,
    "alg.gcf":                0.40,
    "alg.special_products":   0.52,
    "alg.factoring":          0.66,   # hot

    # quadratics — hot
    "alg.quadratic_eq":       0.58,
    "alg.quadratic_formula":  0.62,
    "alg.quadratic_graph":    0.50,

    # systems
    "alg.systems_sub":        0.45,
    "alg.systems_elim":       0.48,
}

# For a handful of demo-critical questions, weight the wrong options so one
# distractor dominates. Models "the class keeps making the same mistake".
# Keys are option ids; values are relative weights over the wrong options.
WRONG_OPTION_WEIGHTS: dict[str, dict[str, float]] = {
    "q.alg.factoring.01":         {"b": 0.60, "c": 0.10, "d": 0.30},
    "q.alg.factoring.02":         {"b": 0.50, "c": 0.15, "d": 0.35},
    "q.alg.poly_mul.01":          {"b": 0.55, "c": 0.25, "d": 0.20},
    "q.alg.quadratic_eq.01":      {"b": 0.30, "c": 0.45, "d": 0.25},
    "q.alg.quadratic_formula.01": {"b": 0.35, "c": 0.20, "d": 0.45},
    "q.alg.combine_like.01":      {"b": 0.40, "c": 0.30, "d": 0.30},
    "num.signed.01":            {"a": 0.50, "c": 0.30, "d": 0.20},
    "q.alg.variables_both_sides.01": {"b": 0.45, "c": 0.20, "d": 0.35},
    "q.alg.gcf.01":               {"b": 0.50, "c": 0.30, "d": 0.20},
    "q.alg.slope.01":             {"b": 0.55, "c": 0.25, "d": 0.20},
}


def generate_class_attempts(
    concepts: list[Concept],
    questions: list[Question] | None = None,
    *,
    learner_count: int = CLASS_LEARNER_COUNT,
    rng_seed: int = CLASS_SEED,
    now: datetime | None = None,
) -> list[ClassAttempt]:
    """
    Deterministically generate seeded class attempts.

    Same (concepts, questions, rng_seed) -> same output, byte-for-byte.
    Uses only reviewed seed questions; parallel questions are excluded so the
    heatmap reflects the diagnostic set, not the repair-check pool.
    """
    rng = random.Random(rng_seed)
    now = now or datetime.now(timezone.utc).replace(microsecond=0)
    qs_in = questions if questions is not None else list(QUESTIONS)

    by_concept: dict[str, list[Question]] = {}
    for q in qs_in:
        if not q.reviewed:
            continue
        by_concept.setdefault(q.target_concept_id, []).append(q)

    attempts: list[ClassAttempt] = []
    for concept in concepts:
        qs = by_concept.get(concept.id, [])
        if not qs:
            continue
        target_wrong = CONCEPT_WRONG_RATE.get(concept.id, 0.20)

        for learner_idx in range(learner_count):
            # Not every learner attempts every concept.
            if rng.random() > 0.75:
                continue
            n_attempts = rng.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
            for _ in range(n_attempts):
                q = rng.choice(qs)
                if rng.random() < target_wrong:
                    wrong_opts = [o for o in q.options
                                  if o.id != q.correct_option_id]
                    weights_map = WRONG_OPTION_WEIGHTS.get(q.id)
                    if weights_map:
                        weights = [weights_map.get(o.id, 0.01) for o in wrong_opts]
                        chosen = rng.choices(wrong_opts, weights=weights)[0]
                    else:
                        chosen = rng.choice(wrong_opts)
                    outcome = Outcome.INCORRECT
                else:
                    chosen = next(o for o in q.options
                                  if o.id == q.correct_option_id)
                    outcome = Outcome.CORRECT

                # Skew timestamps toward the recent end of the window.
                age_days = WINDOW_DAYS * (rng.random() ** 0.7)
                ts = now - timedelta(
                    days=age_days,
                    hours=rng.randint(0, 23),
                    minutes=rng.randint(0, 59),
                )
                attempts.append(ClassAttempt(
                    learner_idx=learner_idx,
                    question_id=q.id,
                    chosen_option_id=chosen.id,
                    outcome=outcome,
                    timestamp=ts,
                ))

    return attempts
