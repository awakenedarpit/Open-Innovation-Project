"""Unit tests for the rule-based trace scoring (Phase 2)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import networkx as nx
import pytest

from app.graph import build_graph
from app.models import (
    Attempt, Concept, Difficulty, GradeBand, Outcome, PrerequisiteEdge,
    Question, QuestionOption,
)
from app.trace import (
    BASE_DIRECT, SCORE_INCONSISTENT, SCORE_LUCKY_GUESS,
    SCORE_RECENT_FAILURE, compute_trace,
)

UTC = timezone.utc
NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)


def _concept(cid: str) -> Concept:
    return Concept(
        id=cid, title=cid.upper(), grade_band=GradeBand.G9_10,
        description=f"about {cid}", curriculum_reference="test",
    )


def _opts():
    return [QuestionOption(id="a", text="1"), QuestionOption(id="b", text="2")]


def _q(qid: str, target: str) -> Question:
    return Question(
        id=qid, prompt=f"prompt for {qid}",
        options=_opts(), correct_option_id="a",
        target_concept_id=target,
        prerequisite_tags=[], difficulty=Difficulty.MEDIUM, reviewed=True,
    )


@pytest.fixture
def chain():
    concepts = [_concept(x) for x in ("a", "b", "c", "d")]
    edges = [
        PrerequisiteEdge(from_concept_id="a", to_concept_id="b",
                         source="t", reviewer="t"),
        PrerequisiteEdge(from_concept_id="b", to_concept_id="c",
                         source="t", reviewer="t"),
        PrerequisiteEdge(from_concept_id="c", to_concept_id="d",
                         source="t", reviewer="t"),
    ]
    g = build_graph(concepts, edges)
    cmap = {c.id: c for c in concepts}
    qmap = {q.id: q for q in [_q("q.d", "d"), _q("q.c", "c"),
                              _q("q.b", "b"), _q("q.a", "a")]}
    return g, cmap, qmap


def _run_trace(g, cmap, qmap, attempts_by_concept, target_q="q.d"):
    return compute_trace(
        learner_id="learner-1",
        missed_question=qmap[target_q],
        graph=g,
        concept_lookup=cmap.get,
        attempts_by_concept=attempts_by_concept,
        question_lookup=qmap.get,
        now=NOW,
    )


def _attempt(qid: str, outcome: Outcome, age_hours: float = 1.0) -> Attempt:
    return Attempt(
        learner_id="learner-1", question_id=qid, answer="x",
        outcome=outcome, timestamp=NOW - timedelta(hours=age_hours),
    )


# --- core behaviour -------------------------------------------------------- #
def test_direct_prerequisites_listed_first(chain):
    g, cmap, qmap = chain
    resp = _run_trace(g, cmap, qmap, lambda l, c: [])
    assert resp.candidates[0].concept_id == "c"
    assert resp.candidates[0].is_direct_prerequisite is True


def test_recent_failure_raises_score(chain):
    g, cmap, qmap = chain
    attempts = {
        "c": [_attempt("q.c", Outcome.INCORRECT, age_hours=1)],
        "b": [_attempt("q.b", Outcome.CORRECT, age_hours=100),
              _attempt("q.b", Outcome.CORRECT, age_hours=200)],
        "a": [],
    }
    resp = _run_trace(g, cmap, qmap, lambda l, c: attempts.get(c, []))
    by_id = {c.concept_id: c for c in resp.candidates}
    assert "recent_failure" in by_id["c"].flags
    assert by_id["c"].score > by_id["b"].score
    assert by_id["c"].confidence in ("medium", "high")


def test_inconsistent_recent_beats_all_wrong(chain):
    g, cmap, qmap = chain
    inconsistent = [_attempt("q.b", Outcome.CORRECT, 1),
                    _attempt("q.b", Outcome.INCORRECT, 2)]
    all_wrong = [_attempt("q.a", Outcome.INCORRECT, 1)]
    attempts = {"b": inconsistent, "a": all_wrong}
    resp = _run_trace(g, cmap, qmap, lambda l, c: attempts.get(c, []))
    by_id = {c.concept_id: c for c in resp.candidates}
    assert "inconsistent_recent" in by_id["b"].flags
    assert SCORE_INCONSISTENT > SCORE_RECENT_FAILURE


def test_lucky_guess_flagged_and_forced_low_confidence(chain):
    g, cmap, qmap = chain
    attempts = {"c": [_attempt("q.c", Outcome.CORRECT, age_hours=1)]}
    resp = _run_trace(g, cmap, qmap, lambda l, c: attempts.get(c, []))
    c_cand = next(c for c in resp.candidates if c.concept_id == "c")
    assert "suspected_lucky_guess" in c_cand.flags
    assert "likely_secure" not in c_cand.flags
    # The bug fix: a lucky guess must never yield a confident diagnosis.
    assert c_cand.confidence == "low"


def test_two_correct_marks_likely_secure(chain):
    g, cmap, qmap = chain
    attempts = {"c": [_attempt("q.c", Outcome.CORRECT, 1),
                      _attempt("q.c", Outcome.CORRECT, 2)]}
    resp = _run_trace(g, cmap, qmap, lambda l, c: attempts.get(c, []))
    c_cand = next(c for c in resp.candidates if c.concept_id == "c")
    assert "likely_secure" in c_cand.flags


# --- edge cases ------------------------------------------------------------ #
def test_no_evidence_returns_diagnostic_action(chain):
    g, cmap, qmap = chain
    resp = _run_trace(g, cmap, qmap, lambda l, c: [])
    assert resp.recommended_action == "diagnostic_check"
    assert resp.recommended_candidate_id is None
    deepest = max(resp.candidates, key=lambda c: c.hop_distance)
    assert "preferred_deepest_due_to_no_evidence" in deepest.flags
    assert deepest.confidence == "low"


def test_insufficient_evidence_prefers_deepest_low_confidence(chain):
    """A single stale correct attempt is not enough to assert a root cause."""
    g, cmap, qmap = chain
    stale = [_attempt("q.b", Outcome.CORRECT, age_hours=999)]
    resp = _run_trace(g, cmap, qmap, lambda l, c: stale if c == "b" else [])
    assert resp.recommended_action == "diagnostic_check"
    top = max(resp.candidates, key=lambda c: c.score)
    assert top.confidence == "low"
    assert "insufficient_evidence_for_confident_diagnosis" in top.flags


def test_cyclic_graph_blocks_trace():
    concepts = [_concept(x) for x in ("a", "b", "c")]
    edges = [
        PrerequisiteEdge(from_concept_id="a", to_concept_id="b",
                         source="t", reviewer="t"),
        PrerequisiteEdge(from_concept_id="b", to_concept_id="c",
                         source="t", reviewer="t"),
        PrerequisiteEdge(from_concept_id="c", to_concept_id="a",
                         source="t", reviewer="t"),
    ]
    g = build_graph(concepts, edges)
    cmap = {c.id: c for c in concepts}
    qmap = {"q.c": _q("q.c", "c")}
    resp = _run_trace(g, cmap, qmap, lambda l, c: [], target_q="q.c")
    assert resp.recommended_action == "blocked"
    assert any("cycle" in w.lower() for w in resp.warnings)
    assert resp.candidates == []


def test_unknown_target_concept_blocks():
    g = nx.DiGraph()
    resp = compute_trace(
        learner_id="learner-1",
        missed_question=_q("q.x", "missing"),
        graph=g,
        concept_lookup=lambda _: None,
        attempts_by_concept=lambda l, c: [],
        question_lookup=lambda _: None,
        now=NOW,
    )
    assert resp.recommended_action == "blocked"
    assert resp.candidates == []


def test_no_prerequisites_offers_diagnostic():
    concept = _concept("solo")
    g = build_graph([concept], [])
    resp = compute_trace(
        learner_id="learner-1",
        missed_question=_q("q.solo", "solo"),
        graph=g,
        concept_lookup={"solo": concept}.get,
        attempts_by_concept=lambda l, c: [],
        question_lookup=lambda _: None,
        now=NOW,
    )
    assert resp.recommended_action == "diagnostic_check"
    assert resp.candidates == []
    assert any("no prerequisites" in w.lower() for w in resp.warnings)


# --- ranking rules --------------------------------------------------------- #
def test_direct_prereq_outranks_indirect_at_equal_evidence(chain):
    g, cmap, qmap = chain
    same_evidence = [_attempt("q.c", Outcome.INCORRECT, age_hours=1)]
    attempts = {"c": same_evidence, "b": same_evidence}
    resp = _run_trace(g, cmap, qmap, lambda l, c: attempts.get(c, []))
    order = [c.concept_id for c in resp.candidates]
    assert order.index("c") < order.index("b")


def test_hop_distance_recorded(chain):
    g, cmap, qmap = chain
    resp = _run_trace(g, cmap, qmap, lambda l, c: [])
    by_id = {c.concept_id: c for c in resp.candidates}
    assert by_id["c"].hop_distance == 1
    assert by_id["b"].hop_distance == 2
    assert by_id["a"].hop_distance == 3
