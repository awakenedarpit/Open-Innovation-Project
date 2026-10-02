"""
Concept X-Ray — FastAPI application.

Endpoints (Phase 1 + 2):
  POST /attempts                              — record a learner's answer
  GET  /trace/{learner_id}/{question_id}      — rule-based root-cause trace
  GET  /lesson/{concept_id}                   — LLM-first micro-lesson, static fallback
  POST /repair-check                          — start a repair session
  POST /repair-check/{session_id}/submit      — record repair outcome
  GET  /health                                — liveness + dataset stats

Endpoints (Phase 3 — read-only, added for Next.js frontend):
  GET  /graph                                 — full concept graph (nodes + edges)
  GET  /questions                             — all reviewed questions
  GET  /attempts/{learner_id}                 — learner's attempt history
  GET  /repair-check/{session_id}             — retrieve a repair session by id

Endpoints (Phase 4 — teacher class view):
  GET  /teacher/heatmap                       — aggregate class heatmap
  GET  /teacher/concept/{concept_id}/patterns — aggregate wrong-answer patterns
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .llm_adapter import adapter as llm_adapter
from .models import (
    Attempt, AttemptCreate, ConceptPatternsResponse, HeatmapResponse,
    Lesson, Question, RepairCheckResult, RepairCheckSession,
    RepairCheckStart, RepairCheckSubmit, TraceResponse,
)
from .static_lessons import STATIC_LESSONS
from .store import InMemoryStore, store
from .teacher import aggregate_heatmap, aggregate_patterns
from .trace import compute_trace

app = FastAPI(title="Concept X-Ray", version="0.4.0")

# Allow the Next.js dev server (port 3000) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[\n        "http://localhost:3000",\n        "http://127.0.0.1:3000",\n        "https://open-innovation-project-web.onrender.com",\n    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_store() -> InMemoryStore:
    return store


# --------------------------------------------------------------------------- #
# POST /attempts
# --------------------------------------------------------------------------- #
@app.post("/attempts", response_model=Attempt, status_code=201)
def record_attempt(payload: AttemptCreate,
                   s: InMemoryStore = Depends(get_store)) -> Attempt:
    q = s.get_question(payload.question_id)
    if q is None:
        raise HTTPException(404, f"unknown question_id '{payload.question_id}'")
    attempt = Attempt(
        learner_id=payload.learner_id,
        question_id=payload.question_id,
        answer=payload.answer,
        outcome=payload.outcome,
        timestamp=payload.timestamp or datetime.now(timezone.utc),
    )
    s.add_attempt(attempt)
    return attempt


# --------------------------------------------------------------------------- #
# GET /trace/{learner_id}/{question_id}
# --------------------------------------------------------------------------- #
@app.get("/trace/{learner_id}/{question_id}", response_model=TraceResponse)
def trace(learner_id: str, question_id: str,
          s: InMemoryStore = Depends(get_store)) -> TraceResponse:
    q = s.get_question(question_id)
    if q is None:
        raise HTTPException(404, f"unknown question_id '{question_id}'")

    resp = compute_trace(
        learner_id=learner_id,
        missed_question=q,
        graph=s.graph,
        concept_lookup=s.get_concept,
        attempts_by_concept=s.attempts_for_concept,
        question_lookup=s.get_question,
    )
    return _attach_diagnostic(resp, learner_id, s)


def _attach_diagnostic(resp: TraceResponse, learner_id: str,
                       s: InMemoryStore) -> TraceResponse:
    """Attach a diagnostic question when the trace asks for one."""
    if resp.recommended_action != "diagnostic_check" or resp.diagnostic_question:
        return resp

    attempted = s.attempted_question_ids(learner_id)

    # Preferred order: recommended candidate's concept, then direct prereqs
    order: list[str] = []
    if resp.recommended_candidate_id:
        order.append(resp.recommended_candidate_id)
    try:
        order.extend(list(s.graph.predecessors(resp.target_concept_id)))
    except Exception:
        pass
    order.append(resp.target_concept_id)

    seen: set[str] = set()
    for cid in order:
        if cid in seen:
            continue
        seen.add(cid)
        for q in s.questions_for_concept(cid):
            if q.id not in attempted:
                resp.diagnostic_question = q
                return resp
    return resp


# --------------------------------------------------------------------------- #
# GET /lesson/{concept_id}
# --------------------------------------------------------------------------- #
@app.get("/lesson/{concept_id}", response_model=Lesson)
def get_lesson(concept_id: str,
               s: InMemoryStore = Depends(get_store)) -> Lesson:
    concept = s.get_concept(concept_id)
    if concept is None:
        raise HTTPException(404, f"unknown concept_id '{concept_id}'")

    # 1. Try the LLM adapter (never sends learner identifiers)
    generated = llm_adapter.generate(concept)
    if generated is not None:
        return Lesson(
            concept_id=concept.id,
            title=concept.title,
            explanation=generated.explanation,
            worked_example=generated.worked_example,
            source="llm",
            version=concept.active_version,
        )

    # 2. Reviewed static fallback — must exist for every seeded concept
    static = STATIC_LESSONS.get(concept_id)
    if static is None:
        raise HTTPException(
            500,
            f"no reviewed fallback lesson exists for '{concept_id}'; "
            f"cannot serve the request safely",
        )
    explanation, example = static
    return Lesson(
        concept_id=concept.id,
        title=concept.title,
        explanation=explanation,
        worked_example=example,
        source="static_fallback",
        version=concept.active_version,
    )


# --------------------------------------------------------------------------- #
# POST /repair-check  +  POST /repair-check/{session_id}/submit
# --------------------------------------------------------------------------- #
@app.post("/repair-check", response_model=RepairCheckSession, status_code=201)
def start_repair_check(payload: RepairCheckStart,
                       s: InMemoryStore = Depends(get_store)) -> RepairCheckSession:
    original = s.get_question(payload.original_question_id)
    if original is None:
        raise HTTPException(404, f"unknown original_question_id "
                                 f"'{payload.original_question_id}'")
    root = s.get_concept(payload.root_cause_concept_id)
    if root is None:
        raise HTTPException(404, f"unknown root_cause_concept_id "
                                 f"'{payload.root_cause_concept_id}'")

    attempted = s.attempted_question_ids(payload.learner_id)

    # Probe: a question on the diagnosed root-cause concept, not yet attempted.
    probe: Question | None = next(
        (q for q in s.questions_for_concept(payload.root_cause_concept_id)
         if q.id not in attempted),
        None,
    )
    if probe is None:
        probe = next(iter(s.questions_for_concept(payload.root_cause_concept_id)), None)
    if probe is None:
        raise HTTPException(
            422,
            f"no reviewed question exists for root-cause concept "
            f"'{payload.root_cause_concept_id}'",
        )

    # Parallel: a different question on the SAME concept as the original.
    parallel: Question | None = next(
        (q for q in s.questions_for_concept(original.target_concept_id)
         if q.id != original.id and q.id not in attempted),
        None,
    )
    if parallel is None:
        parallel = next(
            (q for q in s.questions_for_concept(original.target_concept_id)
             if q.id != original.id),
            None,
        )
    if parallel is None:
        raise HTTPException(
            422,
            f"no parallel question exists for target concept "
            f"'{original.target_concept_id}'",
        )

    session = RepairCheckSession(
        learner_id=payload.learner_id,
        original_question_id=payload.original_question_id,
        root_cause_concept_id=payload.root_cause_concept_id,
        probe_question=probe,
        parallel_question=parallel,
        created_at=datetime.now(timezone.utc),
    )
    s.save_repair_session(session)
    return session


@app.post("/repair-check/{session_id}/submit", response_model=RepairCheckResult)
def submit_repair_check(session_id: str,
                        payload: RepairCheckSubmit,
                        s: InMemoryStore = Depends(get_store)) -> RepairCheckResult:
    session = s.get_repair_session(session_id)
    if session is None:
        raise HTTPException(404, f"unknown repair-check session '{session_id}'")

    probe_correct = payload.probe_outcome.value == "correct"
    parallel_correct = payload.parallel_outcome.value == "correct"
    succeeded = probe_correct and parallel_correct

    now = datetime.now(timezone.utc)
    s.add_attempt(Attempt(
        learner_id=session.learner_id,
        question_id=session.probe_question.id,
        answer=payload.probe_answer,
        outcome=payload.probe_outcome,
        timestamp=now,
    ))
    s.add_attempt(Attempt(
        learner_id=session.learner_id,
        question_id=session.parallel_question.id,
        answer=payload.parallel_answer,
        outcome=payload.parallel_outcome,
        timestamp=now,
    ))

    if succeeded:
        msg = ("Repair verified: the root-cause probe and the parallel "
               "check were both answered correctly.")
    elif probe_correct and not parallel_correct:
        msg = ("Root-cause probe passed but the parallel check failed. "
               "The gap may be in applying the concept, not in the concept itself.")
    elif not probe_correct and parallel_correct:
        msg = ("Parallel check passed but the root-cause probe failed — "
               "diagnosis may be off. Consider re-running the trace.")
    else:
        msg = ("Both probe and parallel check failed. Root-cause hypothesis "
               "is likely correct; retry the micro-lesson and a fresh repair check.")

    result = RepairCheckResult(
        session_id=session_id,
        learner_id=session.learner_id,
        original_question_id=session.original_question_id,
        root_cause_concept_id=session.root_cause_concept_id,
        probe_correct=probe_correct,
        parallel_correct=parallel_correct,
        repair_succeeded=succeeded,
        message=msg,
    )
    s.save_repair_result(result)
    return result


# --------------------------------------------------------------------------- #
# Phase 3 — read-only endpoints for the Next.js frontend
# --------------------------------------------------------------------------- #
@app.get("/graph")
def get_graph(s: InMemoryStore = Depends(get_store)) -> dict:
    """Full concept graph (nodes + edges). Frontend caches this once per session."""
    return {
        "concepts": [c.model_dump(mode="json") for c in s.concepts.values()],
        "edges": [e.model_dump(mode="json") for e in s.edges],
    }


@app.get("/questions", response_model=list[Question])
def list_questions(s: InMemoryStore = Depends(get_store)) -> list[Question]:
    """All reviewed questions. Frontend filters client-side for the demo script."""
    return [q for q in s.questions.values() if q.reviewed]


@app.get("/attempts/{learner_id}", response_model=list[Attempt])
def list_attempts(learner_id: str,
                  s: InMemoryStore = Depends(get_store)) -> list[Attempt]:
    """Recent attempts for a learner, newest first. Powers before/after view."""
    return sorted(
        s.attempts_for_learner(learner_id),
        key=lambda a: a.timestamp,
        reverse=True,
    )


@app.get("/repair-check/{session_id}", response_model=RepairCheckSession)
def get_repair_check(session_id: str,
                     s: InMemoryStore = Depends(get_store)) -> RepairCheckSession:
    """Retrieve a repair session by id (so the page survives a browser refresh)."""
    session = s.get_repair_session(session_id)
    if session is None:
        raise HTTPException(404, f"unknown repair-check session '{session_id}'")
    return session


# --------------------------------------------------------------------------- #
# Teacher view — aggregate-only (Phase 4).
#
# PRIVACY CONTRACT: neither endpoint accepts or returns a learner identifier.
# Aggregation is done in app/teacher.py; cells below the k-anonymity floor
# are suppressed server-side. Do not add learner-scoped parameters here.
# --------------------------------------------------------------------------- #
@app.get("/teacher/heatmap", response_model=HeatmapResponse)
def teacher_heatmap(s: InMemoryStore = Depends(get_store)) -> HeatmapResponse:
    return aggregate_heatmap(
        concepts=list(s.concepts.values()),
        questions=list(s.questions.values()),
        attempts=s.class_attempts,
    )


@app.get("/teacher/concept/{concept_id}/patterns",
         response_model=ConceptPatternsResponse)
def teacher_concept_patterns(
    concept_id: str,
    s: InMemoryStore = Depends(get_store),
) -> ConceptPatternsResponse:
    concept = s.get_concept(concept_id)
    if concept is None:
        raise HTTPException(404, f"unknown concept_id '{concept_id}'")
    return aggregate_patterns(
        concept=concept,
        questions=list(s.questions.values()),
        attempts=s.class_attempts,
    )


# --------------------------------------------------------------------------- #
# Health
# --------------------------------------------------------------------------- #
@app.get("/health")
def health(s: InMemoryStore = Depends(get_store)) -> JSONResponse:
    return JSONResponse({
        "status": "ok",
        "concepts": len(s.concepts),
        "questions": len(s.questions),
        "edges": len(s.edges),
        "attempts": len(s.attempts),
    })

