"""
In-memory store for the hackathon MVP.

Holds the seeded concept graph + questions, plus learner attempts and
repair-check sessions. Swappable for a PostgreSQL repository later — every
access goes through a small method surface.
"""
from __future__ import annotations

from threading import Lock
from typing import Optional

from .graph import build_graph
from .models import (
    Attempt, ClassAttempt, Concept, PrerequisiteEdge, Question,
    RepairCheckResult, RepairCheckSession,
)
from .class_seed import generate_class_attempts
from .parallel_questions import PARALLEL_QUESTIONS
from .seed_data import CONCEPTS, EDGES, QUESTIONS


class InMemoryStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.concepts: dict[str, Concept] = {c.id: c for c in CONCEPTS}
        all_questions = list(QUESTIONS) + list(PARALLEL_QUESTIONS)
        ids = [q.id for q in all_questions]
        assert len(ids) == len(set(ids)), f"Duplicate question ids: {ids}"
        self.questions: dict[str, Question] = {q.id: q for q in all_questions}
        self.edges: list[PrerequisiteEdge] = list(EDGES)
        self.graph = build_graph(CONCEPTS, self.edges)

        self.class_attempts: list[ClassAttempt] = generate_class_attempts(
            list(self.concepts.values()),
            list(QUESTIONS),  # seeded diagnostic set only — not parallels
        )

        self.attempts: list[Attempt] = []
        self.repair_sessions: dict[str, RepairCheckSession] = {}
        self.repair_results: dict[str, RepairCheckResult] = {}

    # --- concept / question lookup -------------------------------------- #
    def get_concept(self, concept_id: str) -> Optional[Concept]:
        return self.concepts.get(concept_id)

    def get_question(self, qid: str) -> Optional[Question]:
        return self.questions.get(qid)

    def questions_for_concept(self, concept_id: str) -> list[Question]:
        return [q for q in self.questions.values()
                if q.target_concept_id == concept_id and q.reviewed]

    # --- attempts -------------------------------------------------------- #
    def add_attempt(self, attempt: Attempt) -> None:
        with self._lock:
            self.attempts.append(attempt)

    def attempts_for_learner(self, learner_id: str) -> list[Attempt]:
        return [a for a in self.attempts if a.learner_id == learner_id]

    def attempts_for_concept(self, learner_id: str,
                             concept_id: str) -> list[Attempt]:
        qids = {q.id for q in self.questions.values()
                if q.target_concept_id == concept_id}
        return [a for a in self.attempts
                if a.learner_id == learner_id and a.question_id in qids]

    def attempted_question_ids(self, learner_id: str) -> set[str]:
        return {a.question_id for a in self.attempts if a.learner_id == learner_id}

    # --- repair sessions ------------------------------------------------- #
    def save_repair_session(self, session: RepairCheckSession) -> None:
        with self._lock:
            self.repair_sessions[session.session_id] = session

    def get_repair_session(self, session_id: str) -> Optional[RepairCheckSession]:
        return self.repair_sessions.get(session_id)

    def save_repair_result(self, result: RepairCheckResult) -> None:
        with self._lock:
            self.repair_results[result.session_id] = result

    # --- test helper ----------------------------------------------------- #
    def reset_activity(self) -> None:
        """Clear attempts + repair sessions. Keeps the seeded curriculum."""
        with self._lock:
            self.attempts.clear()
            self.repair_sessions.clear()
            self.repair_results.clear()


store = InMemoryStore()
