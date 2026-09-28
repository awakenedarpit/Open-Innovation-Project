"""
Concept X-Ray — teacher aggregation.

Pure functions. Take concepts, questions, and class attempts; return the
privacy-safe aggregate responses. No store access, no I/O — fully testable.

PRIVACY RULES ENFORCED HERE:
  1. No learner identifier appears in any returned model.
  2. Cells below `min_cohort` (default 3) are suppressed: their numeric
     fields are zeroed and `suppressed=True` is set. This is a k-anonymity
     floor applied to *both* the denominator (total attempts) and the
     numerator (distinct learners wrong).
  3. Patterns (per-question wrong-answer breakdowns) are entirely withheld
     when a concept is below the floor — the aggregate counts still show,
     but the "which option did they pick" detail does not.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .class_seed import COHORT_ID, WINDOW_DAYS
from .models import (
    ClassAttempt, Concept, ConceptPatternsResponse, HeatmapCell,
    HeatmapResponse, Outcome, Question, WrongAnswerPattern,
)

MIN_COHORT = 3


def aggregate_heatmap(
    concepts: list[Concept],
    questions: list[Question],
    attempts: list[ClassAttempt],
    *,
    cohort_id: str = COHORT_ID,
    window_days: int = WINDOW_DAYS,
    min_cohort: int = MIN_COHORT,
    now: datetime | None = None,
) -> HeatmapResponse:
    now = now or datetime.now(timezone.utc)
    window_start = now - timedelta(days=window_days)

    q_by_id = {q.id: q for q in questions}
    in_window = [a for a in attempts if a.timestamp >= window_start]

    by_concept: dict[str, list[ClassAttempt]] = {}
    for a in in_window:
        q = q_by_id.get(a.question_id)
        if q is None:
            continue
        by_concept.setdefault(q.target_concept_id, []).append(a)

    cells: list[HeatmapCell] = []
    any_suppressed = False
    for concept in concepts:
        atts = by_concept.get(concept.id, [])
        total = len(atts)
        wrong = sum(1 for a in atts if a.outcome == Outcome.INCORRECT)
        attempted_learners = {a.learner_idx for a in atts}
        wrong_learners = {a.learner_idx for a in atts
                          if a.outcome == Outcome.INCORRECT}

        # Suppress when either the denominator or the numerator is too small
        # to protect individual learners from being inferred.
        suppressed = (
            (0 < total < min_cohort)
            or (0 < len(wrong_learners) < min_cohort)
        )
        if suppressed:
            any_suppressed = True

        if suppressed:
            cells.append(HeatmapCell(
                concept_id=concept.id,
                concept_title=concept.title,
                grade_band=concept.grade_band,
                total_attempts=0,
                incorrect_attempts=0,
                wrong_rate=0.0,
                distinct_learners_attempted=0,
                distinct_learners_wrong=0,
                suppressed=True,
            ))
        else:
            cells.append(HeatmapCell(
                concept_id=concept.id,
                concept_title=concept.title,
                grade_band=concept.grade_band,
                total_attempts=total,
                incorrect_attempts=wrong,
                wrong_rate=(wrong / total) if total else 0.0,
                distinct_learners_attempted=len(attempted_learners),
                distinct_learners_wrong=len(wrong_learners),
                suppressed=False,
            ))

    learner_count = len({a.learner_idx for a in attempts})
    return HeatmapResponse(
        cohort_id=cohort_id,
        learner_count=learner_count,
        attempt_count=len(in_window),
        window_days=window_days,
        min_cohort=min_cohort,
        cells=cells,
        suppression_note=(
            f"Concepts with fewer than {min_cohort} learners are suppressed "
            f"to protect individual privacy."
        ) if any_suppressed else None,
    )


def aggregate_patterns(
    concept: Concept,
    questions: list[Question],
    attempts: list[ClassAttempt],
    *,
    min_cohort: int = MIN_COHORT,
    now: datetime | None = None,
    window_days: int = WINDOW_DAYS,
) -> ConceptPatternsResponse:
    now = now or datetime.now(timezone.utc)
    window_start = now - timedelta(days=window_days)

    q_by_id = {q.id: q for q in questions}
    relevant = [
        a for a in attempts
        if a.timestamp >= window_start
        and q_by_id.get(a.question_id) is not None
        and q_by_id[a.question_id].target_concept_id == concept.id
    ]

    total = len(relevant)
    wrong_attempts = [a for a in relevant if a.outcome == Outcome.INCORRECT]
    wrong = len(wrong_attempts)
    attempted_learners = {a.learner_idx for a in relevant}
    wrong_learners = {a.learner_idx for a in wrong_attempts}

    suppressed = (
        (0 < total < min_cohort)
        or (0 < len(wrong_learners) < min_cohort)
    )

    if suppressed:
        return ConceptPatternsResponse(
            concept_id=concept.id,
            concept_title=concept.title,
            total_attempts=total,
            incorrect_attempts=wrong,
            wrong_rate=(wrong / total) if total else 0.0,
            distinct_learners_attempted=len(attempted_learners),
            distinct_learners_wrong=len(wrong_learners),
            patterns=[],
            suppression_applied=True,
        )

    buckets: dict[tuple[str, str], list[ClassAttempt]] = {}
    for a in wrong_attempts:
        buckets.setdefault((a.question_id, a.chosen_option_id), []).append(a)

    patterns: list[WrongAnswerPattern] = []
    for (qid, oid), bucket in buckets.items():
        q = q_by_id[qid]
        opt = next((o for o in q.options if o.id == oid), None)
        if opt is None:
            continue
        patterns.append(WrongAnswerPattern(
            question_id=qid,
            question_prompt=q.prompt,
            chosen_option_id=oid,
            chosen_option_text=opt.text,
            count=len(bucket),
            distinct_learners=len({a.learner_idx for a in bucket}),
            share_of_wrong=(len(bucket) / wrong) if wrong else 0.0,
        ))

    patterns.sort(key=lambda p: (-p.count, p.question_id, p.chosen_option_id))
    return ConceptPatternsResponse(
        concept_id=concept.id,
        concept_title=concept.title,
        total_attempts=total,
        incorrect_attempts=wrong,
        wrong_rate=(wrong / total) if total else 0.0,
        distinct_learners_attempted=len(attempted_learners),
        distinct_learners_wrong=len(wrong_learners),
        patterns=patterns,
        suppression_applied=False,
    )
