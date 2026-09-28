"""
Concept X-Ray — Core data models.

All identifiers are stable slugs (e.g. 'alg.factoring') so the graph,
questions, and any future fixtures can reference concepts without
coupling to database row ids.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, model_validator


# --------------------------------------------------------------------------- #
# Enums
# --------------------------------------------------------------------------- #
class GradeBand(str, Enum):
    G6_8 = "6-8"
    G9_10 = "9-10"
    G11_12 = "11-12"


class RelationshipType(str, Enum):
    """Semantics of a prerequisite edge."""
    REQUIRES = "requires"
    RECOMMENDED = "recommended"
    REINFORCES = "reinforces"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Outcome(str, Enum):
    CORRECT = "correct"
    INCORRECT = "incorrect"
    SKIPPED = "skipped"


# --------------------------------------------------------------------------- #
# Curriculum layer
# --------------------------------------------------------------------------- #
class Concept(BaseModel):
    """A single teachable concept node in the curriculum graph."""
    id: str = Field(..., min_length=1, pattern=r"^[a-z0-9_.]+$",
                    description="Stable slug, e.g. 'alg.factoring'")
    title: str = Field(..., min_length=1)
    grade_band: GradeBand
    description: str = Field(..., min_length=1)
    curriculum_reference: str = Field(..., min_length=1)
    active_version: int = Field(default=1, ge=1)


class PrerequisiteEdge(BaseModel):
    """
    Directed edge from a prerequisite concept -> a dependent concept.

    A single edge can only reject the degenerate 1-edge self-loop.
    Multi-hop cycles are a property of the edge *set* and are caught by
    graph.find_cycles / validate.py.
    """
    from_concept_id: str = Field(..., min_length=1)
    to_concept_id: str = Field(..., min_length=1)
    relationship: RelationshipType = RelationshipType.REQUIRES
    source: str = Field(..., min_length=1)
    reviewer: str = Field(..., min_length=1)

    @model_validator(mode="after")
    def _reject_self_loop(self) -> "PrerequisiteEdge":
        if self.from_concept_id == self.to_concept_id:
            raise ValueError(
                f"Self-loop not allowed: "
                f"{self.from_concept_id} -> {self.to_concept_id}"
            )
        return self


class QuestionOption(BaseModel):
    id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)


class Question(BaseModel):
    """A single quiz item. Exactly one target concept per item."""
    id: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1)
    options: list[QuestionOption] = Field(..., min_length=2)
    correct_option_id: str
    answer_rubric: Optional[str] = None
    target_concept_id: str = Field(..., min_length=1)
    prerequisite_tags: list[str] = Field(default_factory=list)
    difficulty: Difficulty
    reviewed: bool = Field(default=False)

    @model_validator(mode="after")
    def _check_consistency(self) -> "Question":
        option_ids = [o.id for o in self.options]
        if len(set(option_ids)) != len(option_ids):
            raise ValueError(f"Question {self.id}: duplicate option ids {option_ids}")
        if self.correct_option_id not in option_ids:
            raise ValueError(
                f"Question {self.id}: correct_option_id "
                f"'{self.correct_option_id}' not in {option_ids}"
            )
        if self.target_concept_id in self.prerequisite_tags:
            raise ValueError(
                f"Question {self.id}: target concept must not appear in "
                f"its own prerequisite_tags."
            )
        return self


# --------------------------------------------------------------------------- #
# Learner activity
# --------------------------------------------------------------------------- #
class Attempt(BaseModel):
    learner_id: str = Field(..., min_length=1,
                            description="Pseudonymous learner id. No PII.")
    question_id: str = Field(..., min_length=1)
    answer: str
    outcome: Outcome
    timestamp: datetime


class AttemptCreate(BaseModel):
    """Request body for POST /attempts."""
    learner_id: str = Field(..., min_length=1)
    question_id: str = Field(..., min_length=1)
    answer: str
    outcome: Outcome
    timestamp: Optional[datetime] = None


# --------------------------------------------------------------------------- #
# Trace response
# --------------------------------------------------------------------------- #
class EvidenceItem(BaseModel):
    question_id: str
    outcome: Outcome
    timestamp: datetime
    age_hours: float


class TraceCandidate(BaseModel):
    concept_id: str
    concept_title: str
    score: float
    rank: int
    is_direct_prerequisite: bool
    hop_distance: int = Field(..., ge=1)
    evidence: list[EvidenceItem]
    confidence: Literal["low", "medium", "high"]
    flags: list[str] = Field(default_factory=list)
    rationale: str


class TraceResponse(BaseModel):
    learner_id: str
    question_id: str
    target_concept_id: str
    candidates: list[TraceCandidate]
    warnings: list[str] = Field(default_factory=list)
    recommended_action: Literal["review_candidate", "diagnostic_check", "blocked"]
    recommended_candidate_id: Optional[str] = None
    diagnostic_question: Optional[Question] = None


# --------------------------------------------------------------------------- #
# Lesson
# --------------------------------------------------------------------------- #
class Lesson(BaseModel):
    concept_id: str
    title: str
    explanation: str
    worked_example: str
    source: Literal["llm", "static_fallback"]
    version: int = 1


# --------------------------------------------------------------------------- #
# Repair check
# --------------------------------------------------------------------------- #
class RepairCheckStart(BaseModel):
    learner_id: str = Field(..., min_length=1)
    original_question_id: str = Field(..., min_length=1)
    root_cause_concept_id: str = Field(..., min_length=1)


class RepairCheckSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"rc_{uuid4().hex[:12]}")
    learner_id: str
    original_question_id: str
    root_cause_concept_id: str
    probe_question: Question
    parallel_question: Question
    created_at: datetime


class RepairCheckSubmit(BaseModel):
    probe_answer: str
    probe_outcome: Outcome
    parallel_answer: str
    parallel_outcome: Outcome


class RepairCheckResult(BaseModel):
    session_id: str
    learner_id: str
    original_question_id: str
    root_cause_concept_id: str
    probe_correct: bool
    parallel_correct: bool
    repair_succeeded: bool
    message: str


# --------------------------------------------------------------------------- #
# Teacher view — aggregate-only models (Phase 4).
#
# PRIVACY CONTRACT:
#   * No model below carries a `learner_id`. Ever.
#   * `ClassAttempt.learner_idx` is a local integer used ONLY to count
#     distinct learners during aggregation. It is marked `exclude=True`
#     so Pydantic physically cannot serialize it.
#   * Endpoints returning these models MUST NOT be given a `learner_id`
#     parameter. If you ever need to add one, stop and reconsider the design.
# --------------------------------------------------------------------------- #
class ClassAttempt(BaseModel):
    """
    A pseudonymous attempt from the seeded demo class.

    `learner_idx` is a local integer in [0, CLASS_LEARNER_COUNT). It exists
    only to compute distinct-learner counts during aggregation. It is
    excluded from every serialization path.
    """
    learner_idx: int = Field(..., ge=0, exclude=True)
    question_id: str
    chosen_option_id: str
    outcome: Outcome
    timestamp: datetime


class HeatmapCell(BaseModel):
    concept_id: str
    concept_title: str
    grade_band: GradeBand
    total_attempts: int = Field(..., ge=0)
    incorrect_attempts: int = Field(..., ge=0)
    wrong_rate: float = Field(..., ge=0.0, le=1.0)
    distinct_learners_attempted: int = Field(..., ge=0)
    distinct_learners_wrong: int = Field(..., ge=0)
    suppressed: bool = Field(
        default=False,
        description="True when the underlying counts are below the privacy floor. "
                    "All numeric fields are zeroed when suppressed.",
    )


class HeatmapResponse(BaseModel):
    cohort_id: str
    learner_count: int
    attempt_count: int
    window_days: int
    min_cohort: int
    cells: list[HeatmapCell]
    suppression_note: Optional[str] = None


class WrongAnswerPattern(BaseModel):
    question_id: str
    question_prompt: str
    chosen_option_id: str
    chosen_option_text: str
    count: int = Field(..., ge=0)
    distinct_learners: int = Field(..., ge=0)
    share_of_wrong: float = Field(..., ge=0.0, le=1.0)


class ConceptPatternsResponse(BaseModel):
    concept_id: str
    concept_title: str
    total_attempts: int = Field(..., ge=0)
    incorrect_attempts: int = Field(..., ge=0)
    wrong_rate: float = Field(..., ge=0.0, le=1.0)
    distinct_learners_attempted: int = Field(..., ge=0)
    distinct_learners_wrong: int = Field(..., ge=0)
    patterns: list[WrongAnswerPattern]
    suppression_applied: bool = False

