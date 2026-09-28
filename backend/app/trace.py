"""
Concept X-Ray — rule-based root-cause trace.

Design principles enforced here:
  * Transparent scoring. Every point added to a candidate's score is
    traceable to a named rule below.
  * Diagnoses are hypotheses. Every candidate carries a confidence band
    and a machine-readable `flags` list; nothing is presented as a fact.
  * Insufficient evidence is a first-class outcome, not a failure.

Scoring rules (all constants at the top so they're easy to review):

  Base score:
    * direct prerequisite of the missed concept                 +50
    * indirect, at hop distance d (d >= 2)                      max(10, 30 - 5*(d-2))

  Evidence adjustments:
    * mixed correct+incorrect in last RECENT_WINDOW             +40  (inconsistent_recent)
    * only incorrect in last RECENT_WINDOW                      +30  (recent_failure)
    * exactly one attempt, correct                             +25  (suspected_lucky_guess)
    * >= 2 recent correct, no incorrect                        -20  (likely_secure)

  Recency:
    * most recent attempt within RECENCY_HOURS                  +10  (recent_activity)

Confidence bands (only meaningful when evidence exists):
    high    : score >= 60
    medium  : 30 <= score < 60
    low     : otherwise, OR whenever suspected_lucky_guess is set
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Optional

import networkx as nx

from .models import (
    Attempt, Concept, EvidenceItem, Outcome, Question,
    TraceCandidate, TraceResponse,
)

# ---- tunable constants ---------------------------------------------------- #
RECENT_WINDOW = 5
RECENCY_HOURS = 24

BASE_DIRECT = 50.0
BASE_INDIRECT_BASE = 30.0
BASE_INDIRECT_STEP = 5.0
BASE_INDIRECT_FLOOR = 10.0

SCORE_INCONSISTENT = 40.0
SCORE_RECENT_FAILURE = 30.0
SCORE_LUCKY_GUESS = 25.0
SCORE_LIKELY_SECURE = -20.0
SCORE_RECENT_ACTIVITY = 10.0

CONFIDENCE_HIGH = 60.0
CONFIDENCE_MEDIUM = 30.0


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- #
# Public entry point — pure, fully injectable for testing
# --------------------------------------------------------------------------- #
def compute_trace(
    learner_id: str,
    missed_question: Question,
    graph: nx.DiGraph,
    concept_lookup: Callable[[str], Optional[Concept]],
    attempts_by_concept: Callable[[str, str], list[Attempt]],
    question_lookup: Callable[[str], Optional[Question]],
    now: Optional[datetime] = None,
) -> TraceResponse:
    """
    Walk the prerequisite graph backward from `missed_question.target_concept_id`
    and return ranked root-cause candidates with supporting evidence.

    NOTE: the diagnostic_question field of the returned TraceResponse is left
    as None here; the API layer attaches a concrete question because doing so
    requires store access (which this pure function deliberately avoids).
    """
    now = now or _utcnow()
    target_id = missed_question.target_concept_id
    warnings: list[str] = []

    # ------------------------------------------------------------------ #
    # 0. Graph sanity — block the path if the relevant subgraph is broken
    # ------------------------------------------------------------------ #
    if target_id not in graph:
        return _blocked(
            learner_id, missed_question,
            warning=f"target concept '{target_id}' is not present in the concept graph",
        )

    try:
        ancestor_set = nx.ancestors(graph, target_id)
    except nx.NetworkXError as exc:
        return _blocked(learner_id, missed_question,
                        warning=f"graph traversal failed: {exc}")

    relevant = ancestor_set | {target_id}
    if not nx.is_directed_acyclic_graph(graph.subgraph(relevant)):
        cycles = [list(c) for c in nx.simple_cycles(graph.subgraph(relevant))]
        cycle_str = " -> ".join(cycles[0] + [cycles[0][0]]) if cycles else "unknown"
        return _blocked(
            learner_id, missed_question,
            warning=f"prerequisite cycle detected near '{target_id}': {cycle_str}",
        )

    if not ancestor_set:
        return TraceResponse(
            learner_id=learner_id,
            question_id=missed_question.id,
            target_concept_id=target_id,
            candidates=[],
            warnings=["no prerequisites declared for this concept"],
            recommended_action="diagnostic_check",
            recommended_candidate_id=None,
            diagnostic_question=None,
        )

    direct_prereqs = set(graph.predecessors(target_id))

    # ------------------------------------------------------------------ #
    # 1. Score every ancestor
    # ------------------------------------------------------------------ #
    candidates: list[TraceCandidate] = []
    for cand_id in ancestor_set:
        concept = concept_lookup(cand_id)
        if concept is None:
            warnings.append(f"missing concept metadata for '{cand_id}'; skipped")
            continue
        try:
            d = nx.shortest_path_length(graph, cand_id, target_id)
        except nx.NetworkXNoPath:
            warnings.append(f"no path from '{cand_id}' to '{target_id}'; skipped")
            continue

        raw_attempts = attempts_by_concept(learner_id, cand_id)
        candidates.append(_score_candidate(
            concept=concept,
            target_id=target_id,
            hop_distance=d,
            is_direct=(cand_id in direct_prereqs),
            raw_attempts=raw_attempts,
            now=now,
        ))

    # ------------------------------------------------------------------ #
    # 2. Order: direct prerequisites first (per spec), then by score
    # ------------------------------------------------------------------ #
    candidates.sort(key=lambda c: (not c.is_direct_prerequisite,
                                   -c.score,
                                   -c.hop_distance))
    for i, c in enumerate(candidates):
        c.rank = i + 1

    # ------------------------------------------------------------------ #
    # 3. Decide what to recommend
    # ------------------------------------------------------------------ #
    any_evidence = any(c.evidence for c in candidates)

    # Case A: no evidence anywhere -> "need one more check"
    if not any_evidence:
        deepest = max(candidates, key=lambda c: (c.hop_distance, c.score),
                      default=None)
        if deepest is not None:
            deepest.flags.append("preferred_deepest_due_to_no_evidence")
            deepest.confidence = "low"
            deepest.rationale += (
                " Chosen as the most upstream prerequisite in the absence of "
                "any attempt history — treated as a hypothesis, not a diagnosis."
            )
        return TraceResponse(
            learner_id=learner_id,
            question_id=missed_question.id,
            target_concept_id=target_id,
            candidates=candidates,
            warnings=warnings,
            recommended_action="diagnostic_check",
            recommended_candidate_id=None,
            diagnostic_question=None,
        )

    # Case B: top-scored candidate is still low confidence -> diagnostic check
    best = max(candidates, key=lambda c: c.score)
    if best.confidence == "low":
        best.flags.append("insufficient_evidence_for_confident_diagnosis")
        return TraceResponse(
            learner_id=learner_id,
            question_id=missed_question.id,
            target_concept_id=target_id,
            candidates=candidates,
            warnings=warnings,
            recommended_action="diagnostic_check",
            recommended_candidate_id=best.concept_id,
            diagnostic_question=None,
        )

    # Case C: confident enough to surface a review candidate
    return TraceResponse(
        learner_id=learner_id,
        question_id=missed_question.id,
        target_concept_id=target_id,
        candidates=candidates,
        warnings=warnings,
        recommended_action="review_candidate",
        recommended_candidate_id=best.concept_id,
        diagnostic_question=None,
    )


# --------------------------------------------------------------------------- #
# Scoring internals
# --------------------------------------------------------------------------- #
def _score_candidate(
    concept: Concept,
    target_id: str,
    hop_distance: int,
    is_direct: bool,
    raw_attempts: list[Attempt],
    now: datetime,
) -> TraceCandidate:
    score = 0.0
    flags: list[str] = []
    reasons: list[str] = []

    # --- base score ---------------------------------------------------- #
    if is_direct:
        score += BASE_DIRECT
        reasons.append(f"direct prerequisite (+{BASE_DIRECT:.0f})")
    else:
        base = max(
            BASE_INDIRECT_FLOOR,
            BASE_INDIRECT_BASE - BASE_INDIRECT_STEP * (hop_distance - 2),
        )
        score += base
        reasons.append(f"{hop_distance} hops upstream (+{base:.0f})")

    # --- evidence ------------------------------------------------------ #
    recent = sorted(raw_attempts, key=lambda a: a.timestamp,
                    reverse=True)[:RECENT_WINDOW]
    recent_correct = sum(1 for a in recent if a.outcome == Outcome.CORRECT)
    recent_incorrect = sum(1 for a in recent if a.outcome == Outcome.INCORRECT)

    if not recent:
        flags.append("no_evidence")
        reasons.append("no attempts on this concept")
    elif recent_correct > 0 and recent_incorrect > 0:
        score += SCORE_INCONSISTENT
        flags.append("inconsistent_recent")
        reasons.append(
            f"inconsistent recent performance "
            f"({recent_correct}✓ / {recent_incorrect}✗ in last {len(recent)}) "
            f"(+{SCORE_INCONSISTENT:.0f})"
        )
    elif recent_incorrect > 0:
        score += SCORE_RECENT_FAILURE
        flags.append("recent_failure")
        reasons.append(
            f"recent failures ({recent_incorrect}✗) (+{SCORE_RECENT_FAILURE:.0f})"
        )
    elif recent_correct == 1 and len(raw_attempts) == 1:
        score += SCORE_LUCKY_GUESS
        flags.append("suspected_lucky_guess")
        reasons.append(
            f"only one correct attempt — suspected lucky guess "
            f"(+{SCORE_LUCKY_GUESS:.0f}); recommend follow-up check"
        )
    elif recent_correct >= 2:
        score += SCORE_LIKELY_SECURE
        flags.append("likely_secure")
        reasons.append(
            f"{recent_correct} recent correct — likely secure "
            f"({SCORE_LIKELY_SECURE:.0f})"
        )

    # --- recency ------------------------------------------------------- #
    if recent:
        age_hours = (now - recent[0].timestamp).total_seconds() / 3600.0
        if age_hours <= RECENCY_HOURS:
            score += SCORE_RECENT_ACTIVITY
            flags.append("recent_activity")
            reasons.append(
                f"activity within {RECENCY_HOURS}h (+{SCORE_RECENT_ACTIVITY:.0f})"
            )

    # --- confidence ---------------------------------------------------- #
    if not recent:
        confidence = "low"
    elif score >= CONFIDENCE_HIGH:
        confidence = "high"
    elif score >= CONFIDENCE_MEDIUM:
        confidence = "medium"
    else:
        confidence = "low"

    # A single correct attempt is never enough to be confident — always
    # force a follow-up check rather than declaring the concept secure.
    if "suspected_lucky_guess" in flags:
        confidence = "low"

    evidence_items = [
        EvidenceItem(
            question_id=a.question_id,
            outcome=a.outcome,
            timestamp=a.timestamp,
            age_hours=(now - a.timestamp).total_seconds() / 3600.0,
        )
        for a in recent
    ]

    return TraceCandidate(
        concept_id=concept.id,
        concept_title=concept.title,
        score=round(score, 2),
        rank=0,  # filled in by caller
        is_direct_prerequisite=is_direct,
        hop_distance=hop_distance,
        evidence=evidence_items,
        confidence=confidence,
        flags=flags,
        rationale="; ".join(reasons) if reasons else "no signals",
    )


def _blocked(learner_id: str, missed_question: Question,
             warning: str) -> TraceResponse:
    return TraceResponse(
        learner_id=learner_id,
        question_id=missed_question.id,
        target_concept_id=missed_question.target_concept_id,
        candidates=[],
        warnings=[warning,
                  "trace blocked rather than guessing from unreliable graph data"],
        recommended_action="blocked",
        recommended_candidate_id=None,
        diagnostic_question=None,
    )
