# Concept X-Ray — API Endpoint Reference (`docs/API.md`)

## 1. Public & Core Endpoints

### `GET /health`
Returns system status, concept count, question count, and edge count.

### `GET /graph`
Returns full prerequisite graph:
```json
{
  "concepts": [...],
  "edges": [...]
}
```

### `GET /questions`
Returns all reviewed diagnostic questions.

---

## 2. Assessment & Trace Endpoints

### `POST /attempts`
Records a learner answer attempt.
- **Request Body**: `{ "learner_id": "...", "question_id": "...", "answer": "...", "outcome": "incorrect" }`

### `GET /trace/{learner_id}/{question_id}`
Traces incorrect answer backward through prerequisite DAG using rule-based scoring.
- **Returns**: `TraceResponse` with ranked candidates, confidence levels, and recommended candidate ID.

---

## 3. Micro-Lessons & Repair Endpoints

### `GET /lesson/{concept_id}`
Returns micro-lesson (LLM-generated or static fallback).

### `POST /repair-check`
Starts a repair check session (probe question + parallel question).

### `POST /repair-check/{session_id}/submit`
Validates repair check attempt and returns outcome status.

---

## 4. Teacher Analytics Endpoints (Privacy Protected)

### `GET /teacher/heatmap`
Returns k-anonymized aggregate class heatmap ($k \ge 3$ floor suppression).

### `GET /teacher/concept/{concept_id}/patterns`
Returns wrong-answer pattern breakdowns for concepts above the privacy floor.
