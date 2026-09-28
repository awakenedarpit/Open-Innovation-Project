"""Backend tests for the Concept X-Ray data layer (Phase 1)."""
from __future__ import annotations

import pytest

from app.graph import (
    build_graph, find_cycles, find_dangling_edges,
    find_orphan_concepts, is_acyclic, longest_prerequisite_chain,
)
from app.models import (
    Concept, Difficulty, GradeBand, PrerequisiteEdge,
    Question, QuestionOption,
)
from app.seed_data import CONCEPTS, EDGES, QUESTIONS
from app.parallel_questions import PARALLEL_QUESTIONS
from app.static_lessons import STATIC_LESSONS


def test_seed_is_acyclic():
    g = build_graph(CONCEPTS, EDGES)
    assert is_acyclic(g)
    assert find_cycles(g) == []


def test_seed_has_no_orphans():
    assert find_orphan_concepts(CONCEPTS, EDGES) == []


def test_seed_has_no_dangling_edges():
    assert find_dangling_edges(CONCEPTS, EDGES) == []


def test_every_question_has_one_existing_target_concept():
    ids = {c.id for c in CONCEPTS}
    for q in list(QUESTIONS) + list(PARALLEL_QUESTIONS):
        assert q.target_concept_id in ids


def test_seed_has_deep_chain():
    g = build_graph(CONCEPTS, EDGES)
    assert len(longest_prerequisite_chain(g)) >= 4


def test_every_concept_has_reviewed_static_lesson():
    for c in CONCEPTS:
        assert c.id in STATIC_LESSONS, f"missing fallback lesson for {c.id}"


def test_no_duplicate_question_ids():
    ids = [q.id for q in list(QUESTIONS) + list(PARALLEL_QUESTIONS)]
    assert len(ids) == len(set(ids))


def test_self_loop_edge_rejected():
    with pytest.raises(Exception):
        PrerequisiteEdge(
            from_concept_id="alg.variables",
            to_concept_id="alg.variables",
            source="test", reviewer="test",
        )


def test_two_node_cycle_detected_at_graph_level():
    a = Concept(id="a", title="A", grade_band=GradeBand.G6_8,
                description="a", curriculum_reference="x")
    b = Concept(id="b", title="B", grade_band=GradeBand.G6_8,
                description="b", curriculum_reference="x")
    e1 = PrerequisiteEdge(from_concept_id="a", to_concept_id="b",
                          source="s", reviewer="r")
    e2 = PrerequisiteEdge(from_concept_id="b", to_concept_id="a",
                          source="s", reviewer="r")
    g = build_graph([a, b], [e1, e2])
    assert not is_acyclic(g)
    assert find_cycles(g)


def test_question_rejects_target_in_prereq_tags():
    with pytest.raises(Exception):
        Question(
            id="q.x", prompt="?",
            options=[QuestionOption(id="a", text="1"),
                     QuestionOption(id="b", text="2")],
            correct_option_id="a",
            target_concept_id="alg.variables",
            prerequisite_tags=["alg.variables"],
            difficulty=Difficulty.EASY, reviewed=True,
        )


def test_question_rejects_bad_correct_option():
    with pytest.raises(Exception):
        Question(
            id="q.x", prompt="?",
            options=[QuestionOption(id="a", text="1"),
                     QuestionOption(id="b", text="2")],
            correct_option_id="z",
            target_concept_id="alg.variables",
            prerequisite_tags=[],
            difficulty=Difficulty.EASY, reviewed=True,
        )
