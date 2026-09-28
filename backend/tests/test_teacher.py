"""Tests for the teacher aggregation layer."""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.class_seed import (
    CLASS_LEARNER_COUNT, generate_class_attempts,
)
from app.main import app
from app.models import (
    ClassAttempt, Concept, GradeBand, Outcome, Question, QuestionOption,
    Difficulty,
)
from app.seed_data import CONCEPTS, QUESTIONS
from app.store import store
from app.teacher import MIN_COHORT, aggregate_heatmap, aggregate_patterns

UTC = timezone.utc
NOW = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)


# --- fixtures -------------------------------------------------------------- #
def _concept(cid: str) -> Concept:
    return Concept(id=cid, title=f"Title {cid}", grade_band=GradeBand.G6_8,
                   description="d", curriculum_reference="x")


def _opts():
    return [QuestionOption(id="a", text="correct"),
            QuestionOption(id="b", text="wrong1"),
            QuestionOption(id="c", text="wrong2"),
            QuestionOption(id="d", text="wrong3")]


def _q(qid: str, target: str) -> Question:
    return Question(id=qid, prompt=f"prompt {qid}", options=_opts(),
                    correct_option_id="a", target_concept_id=target,
                    prerequisite_tags=[], difficulty=Difficulty.MEDIUM,
                    reviewed=True)


def _att(idx: int, qid: str, opt: str, outcome: Outcome, age_h: float = 1.0):
    return ClassAttempt(
        learner_idx=idx, question_id=qid, chosen_option_id=opt,
        outcome=outcome, timestamp=NOW - timedelta(hours=age_h),
    )


@pytest.fixture
def small_world():
    concepts = [_concept("c1"), _concept("c2"), _concept("c3")]
    questions = [_q("q.c1", "c1"), _q("q.c2", "c2"), _q("q.c3", "c3")]
    return concepts, questions


# --- determinism ----------------------------------------------------------- #
def test_seed_generation_is_deterministic():
    a = generate_class_attempts(CONCEPTS, list(QUESTIONS), rng_seed=42, now=NOW)
    b = generate_class_attempts(CONCEPTS, list(QUESTIONS), rng_seed=42, now=NOW)
    assert len(a) == len(b)
    for x, y in zip(a, b):
        assert x.learner_idx == y.learner_idx
        assert x.question_id == y.question_id
        assert x.chosen_option_id == y.chosen_option_id
        assert x.outcome == y.outcome
        assert x.timestamp == y.timestamp


def test_seed_covers_all_learners_somewhere():
    atts = generate_class_attempts(CONCEPTS, list(QUESTIONS), now=NOW)
    assert {a.learner_idx for a in atts} == set(range(CLASS_LEARNER_COUNT))


# --- privacy: no learner identifiers -------------------------------------- #
def test_class_attempt_excludes_learner_idx_from_dump():
    a = _att(7, "q.c1", "b", Outcome.INCORRECT)
    dumped = a.model_dump()
    assert "learner_idx" not in dumped
    assert "learner_idx" not in a.model_dump_json()


def test_heatmap_response_contains_no_learner_fields(small_world):
    concepts, questions = small_world
    # 5 learners, all wrong on c1 — above the floor of 3.
    atts = [_att(i, "q.c1", "b", Outcome.INCORRECT) for i in range(5)]
    resp = aggregate_heatmap(concepts, questions, atts, now=NOW)
    blob = json.dumps(resp.model_dump(mode="json"))
    assert "learner_idx" not in blob
    assert "learner_id" not in blob


def test_patterns_response_contains_no_learner_fields(small_world):
    concepts, questions = small_world
    atts = [_att(i, "q.c1", "b", Outcome.INCORRECT) for i in range(5)]
    resp = aggregate_patterns(concepts[0], questions, atts, now=NOW)
    blob = json.dumps(resp.model_dump(mode="json"))
    assert "learner_idx" not in blob
    assert "learner_id" not in blob


# --- heatmap aggregation --------------------------------------------------- #
def test_heatmap_counts_correctly(small_world):
    concepts, questions = small_world
    atts = (
        [_att(i, "q.c1", "b", Outcome.INCORRECT) for i in range(4)]
        + [_att(i, "q.c1", "a", Outcome.CORRECT) for i in range(4, 6)]
    )
    resp = aggregate_heatmap(concepts, questions, atts, now=NOW)
    c1 = next(c for c in resp.cells if c.concept_id == "c1")
    assert c1.total_attempts == 6
    assert c1.incorrect_attempts == 4
    assert c1.wrong_rate == pytest.approx(4 / 6)
    assert c1.distinct_learners_attempted == 6
    assert c1.distinct_learners_wrong == 4
    assert c1.suppressed is False


def test_heatmap_suppresses_small_numerator(small_world):
    """2 learners wrong is below the floor of 3 — cell must be suppressed."""
    concepts, questions = small_world
    atts = [_att(i, "q.c1", "b", Outcome.INCORRECT) for i in range(2)]
    resp = aggregate_heatmap(concepts, questions, atts, now=NOW)
    c1 = next(c for c in resp.cells if c.concept_id == "c1")
    assert c1.suppressed is True
    # Zeroed, not partially leaked.
    assert c1.total_attempts == 0
    assert c1.incorrect_attempts == 0
    assert c1.wrong_rate == 0.0
    assert c1.distinct_learners_wrong == 0


def test_heatmap_suppresses_small_denominator(small_world):
    """Total attempts below the floor is also suppressed."""
    concepts, questions = small_world
    atts = [_att(0, "q.c1", "b", Outcome.INCORRECT),
            _att(1, "q.c1", "a", Outcome.CORRECT)]
    resp = aggregate_heatmap(concepts, questions, atts, now=NOW)
    c1 = next(c for c in resp.cells if c.concept_id == "c1")
    assert c1.suppressed is True


def test_heatmap_no_attempts_is_not_suppressed(small_world):
    """A concept nobody attempted is cleanly empty, not 'suppressed'."""
    concepts, questions = small_world
    resp = aggregate_heatmap(concepts, questions, [], now=NOW)
    for c in resp.cells:
        assert c.suppressed is False
        assert c.total_attempts == 0
        assert c.wrong_rate == 0.0


def test_heatmap_window_filter(small_world):
    """Attempts older than the window are excluded."""
    concepts, questions = small_world
    atts = [
        _att(i, "q.c1", "b", Outcome.INCORRECT, age_h=1) for i in range(5)
    ] + [
        _att(i, "q.c1", "b", Outcome.INCORRECT, age_h=24 * 30) for i in range(5)
    ]
    resp = aggregate_heatmap(concepts, questions, atts,
                             window_days=7, now=NOW)
    c1 = next(c for c in resp.cells if c.concept_id == "c1")
    assert c1.total_attempts == 5  # only the recent five


# --- pattern aggregation --------------------------------------------------- #
def test_patterns_group_and_rank(small_world):
    concepts, questions = small_world
    atts = (
        [_att(i, "q.c1", "b", Outcome.INCORRECT) for i in range(6)]
        + [_att(i, "q.c1", "c", Outcome.INCORRECT) for i in range(6, 9)]
    )
    resp = aggregate_patterns(concepts[0], questions, atts, now=NOW)
    assert resp.suppression_applied is False
    assert len(resp.patterns) == 2
    # Most common first.
    assert resp.patterns[0].chosen_option_id == "b"
    assert resp.patterns[0].count == 6
    assert resp.patterns[1].chosen_option_id == "c"
    assert resp.patterns[1].count == 3
    # Shares sum to 1.
    total_share = sum(p.share_of_wrong for p in resp.patterns)
    assert total_share == pytest.approx(1.0)


def test_patterns_suppressed_below_floor(small_world):
    concepts, questions = small_world
    atts = [_att(i, "q.c1", "b", Outcome.INCORRECT) for i in range(2)]
    resp = aggregate_patterns(concepts[0], questions, atts, now=NOW)
    assert resp.suppression_applied is True
    assert resp.patterns == []


def test_patterns_empty_when_no_wrong(small_world):
    concepts, questions = small_world
    atts = [_att(i, "q.c1", "a", Outcome.CORRECT) for i in range(5)]
    resp = aggregate_patterns(concepts[0], questions, atts, now=NOW)
    assert resp.suppression_applied is False  # nothing to suppress
    assert resp.patterns == []


# --- endpoint integration -------------------------------------------------- #
@pytest.fixture
def client():
    return TestClient(app)


def test_heatmap_endpoint_returns_200(client):
    r = client.get("/teacher/heatmap")
    assert r.status_code == 200
    body = r.json()
    assert body["cohort_id"] == "demo-class"
    assert body["learner_count"] == CLASS_LEARNER_COUNT
    assert body["min_cohort"] == MIN_COHORT
    assert len(body["cells"]) == len(store.concepts)
    # No learner identifiers in the wire payload.
    assert "learner_idx" not in json.dumps(body)
    assert "learner_id" not in json.dumps(body)


def test_heatmap_endpoint_has_hot_concepts(client):
    """The seeded distribution must actually produce a visible story."""
    r = client.get("/teacher/heatmap")
    cells = r.json()["cells"]
    hot = [c for c in cells if not c["suppressed"] and c["wrong_rate"] >= 0.5]
    assert len(hot) >= 3, f"expected >=3 hot concepts, got {len(hot)}"
    hot_ids = {c["concept_id"] for c in hot}
    # The demo chain should be hot.
    assert "alg.factoring" in hot_ids
    assert "alg.quadratic_formula" in hot_ids


def test_concept_patterns_endpoint_returns_200(client):
    r = client.get("/teacher/concept/alg.factoring/patterns")
    assert r.status_code == 200
    body = r.json()
    assert body["concept_id"] == "alg.factoring"
    assert body["suppression_applied"] is False
    assert len(body["patterns"]) > 0
    assert "learner_idx" not in json.dumps(body)


def test_concept_patterns_endpoint_404(client):
    r = client.get("/teacher/concept/not.a.concept/patterns")
    assert r.status_code == 404
