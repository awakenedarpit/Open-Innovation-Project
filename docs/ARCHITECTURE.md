# Concept X-Ray — Architecture & Project Audit

## 1. Project Overview & Current Structure

Concept X-Ray is an educational diagnostic platform designed to uncover the prerequisite misconceptions behind incorrect answers.

```text
Codeslayer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI routes & endpoints
│   │   ├── models.py              # Pydantic schemas (Attempt, Concept, Question, Trace, etc.)
│   │   ├── graph.py               # NetworkX DiGraph builder & DAG operations
│   │   ├── trace.py               # Rule-based root-cause analysis engine
│   │   ├── store.py               # In-memory thread-safe data store
│   │   ├── seed_data.py           # 30 concepts, 39 prerequisite edges, seed questions
│   │   ├── parallel_questions.py  # Diagnostic check & parallel questions
│   │   ├── static_lessons.py      # Reviewed static fallback micro-lessons
│   │   ├── class_seed.py          # Class attempt generator for teacher analytics
│   │   ├── teacher.py             # k-anonymity privacy-aware class aggregation
│   │   └── llm_adapter.py         # Optional LLM adapter for micro-lessons
│   ├── scripts/
│   │   ├── seed.py
│   │   └── validate.py
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_data_layer.py
│   │   ├── test_teacher.py
│   │   └── test_trace.py
│   ├── pytest.ini
│   ├── README.md
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Current prototype landing / entry page
│   │   ├── quiz/page.tsx          # Current quiz interface
│   │   ├── trace/[questionId]/page.tsx # Current trace diagnosis view
│   │   ├── lesson/[conceptId]/page.tsx # Current lesson view
│   │   ├── repair/[sessionId]/page.tsx # Current repair/validation loop
│   │   └── teacher/page.tsx       # Current teacher dashboard
│   ├── components/
│   │   ├── ConceptGraph.tsx       # React Flow graph component
│   │   ├── QuizCard.tsx
│   │   ├── CandidateList.tsx
│   │   ├── HeatmapGrid.tsx
│   │   ├── Stepper.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                 # REST client calling FastAPI backend
│   │   ├── demo.ts                # Client-side demo helpers
│   │   ├── learner.ts             # Session / local learner state helper
│   │   └── types.ts               # Shared TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── docs/                          # Project documentation
```

---

## 2. Current Frontend Architecture
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18, Tailwind CSS, `@xyflow/react` (React Flow)
- **State Management**: React state hooks (`useState`, `useEffect`) and local storage for learner state (`lib/learner.ts`).
- **API Client**: `lib/api.ts` makes `fetch` requests to `http://localhost:8000`.
- **Pages**: Prototype layout with simple UI styling across quiz, trace, lesson, repair, and teacher views.

---

## 3. Current Backend Architecture
- **Framework**: FastAPI with Pydantic v2 validation.
- **Graph Processing**: NetworkX `DiGraph` constructed on server startup.
- **Storage**: In-memory `InMemoryStore` (`app/store.py`) protected with thread locks.
- **Privacy Model**: k-anonymity aggregation in `app/teacher.py` suppressing cohort counts $< 3$.
- **Lessons**: `app/llm_adapter.py` attempts LLM call with instant static fallback in `app/static_lessons.py`.

---

## 4. Current Root-Cause Engine Flow
```text
Learner Answer (Incorrect)
       ↓
POST /attempts (Recorded)
       ↓
GET /trace/{learner_id}/{question_id}
       ↓
NetworkX DAG Traversal (Upstream Ancestors)
       ↓
Rule-based Candidate Scoring:
  • Direct Prereq: +50 pts
  • Hop Distance Decay: max(10, 30 - 5*(d-2))
  • Inconsistent Recent: +40 pts
  • Recent Failure: +30 pts
  • Suspected Lucky Guess: +25 pts
  • Likely Secure: -20 pts
  • Activity within 24h: +10 pts
       ↓
Ranked Candidates & Confidence Assessment
       ↓
Attach Diagnostic Question or Surfacing Candidate
       ↓
POST /repair-check (Probe + Parallel Question Session)
       ↓
POST /repair-check/{session_id}/submit (Verify Repair)
```

---

## 5. Current API Endpoints
- `POST /attempts`: Record learner answer attempt.
- `GET /trace/{learner_id}/{question_id}`: Perform root-cause analysis trace.
- `GET /lesson/{concept_id}`: Fetch micro-lesson (LLM or static fallback).
- `POST /repair-check`: Create a repair check session (probe + parallel question).
- `POST /repair-check/{session_id}/submit`: Validate repair attempt.
- `GET /graph`: Return all nodes and prerequisite edges.
- `GET /questions`: Return reviewed diagnostic questions.
- `GET /attempts/{learner_id}`: Retrieve attempt history for a student.
- `GET /repair-check/{session_id}`: Retrieve active repair check session.
- `GET /teacher/heatmap`: Return k-anonymized aggregate class heatmap.
- `GET /teacher/concept/{concept_id}/patterns`: Return aggregated wrong-answer breakdown.
- `GET /health`: System health status and item counts.

---

## 6. Current Data & Seed Structure
- **30 Concepts**: Fundamental computer science concepts (e.g., `variables`, `pointers`, `pointer_arithmetic`, `dynamic_memory`, etc.).
- **39 Prerequisite Edges**: Directed prerequisite relationships ($A \to B$ means $A$ is a prerequisite for $B$).
- **21 Seed Questions**: Diagnostic multiple-choice questions mapped to target concepts.
- **Parallel Questions**: Additional question bank used specifically for repair validation.
- **Class Seed Data**: 24 simulated learners producing 150+ class attempts for teacher analytics.

---

## 7. Current Dependencies
- **Backend**: `fastapi`, `uvicorn`, `pydantic`, `networkx`, `httpx`, `pytest`
- **Frontend**: `next`, `react`, `react-dom`, `@xyflow/react`, `tailwindcss`, `postcss`, `autoprefixer`, `clsx`, `typescript`

---

## 8. Component Reuse & Replacement Identification
- **Reusable**:
  - Backend NetworkX graph traversal logic (`app/graph.py`).
  - Backend Root-Cause Analysis engine (`app/trace.py`).
  - Backend Teacher k-anonymity privacy logic (`app/teacher.py`).
  - Core React Flow custom node logic (refactored into new visual design system).
- **Needs Replacement / Major Redesign**:
  - Hardcoded `InMemoryStore` replaced with **PostgreSQL + SQLAlchemy / SQLModel + Alembic**.
  - All frontend pages (`/`, `/quiz`, `/trace`, `/lesson`, `/repair`, `/teacher`) redesigned with an editorial, high-end EdTech Hub design system.
  - Adding Auth (`/api/auth`), User roles (Student, Teacher, Admin), and database schemas.

---

## 9. Planned Target Architecture
```text
┌───────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                    │
│   Landing Page | Student Dashboard | Teacher Dashboard    │
│   Concept Explorer | Quiz | Diagnosis X-Ray | Micro-Lesson│
└─────────────┬───────────────────────────────┬─────────────┘
              │ REST API                      │ React Flow
              ▼                               ▼
┌───────────────────────────────────────────────────────────┐
│                     FastAPI Backend                       │
│  Auth | Concepts | Questions | Attempts | Progress | Class│
└──────┬──────────────────────┬──────────────────────┬──────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │ NetworkX RCA │      │ LLM Adapter  │
│ Database &   │      │ Engine       │      │ (Optional    │
│ SQLModel ORM │      │ Prereq Graph │      │ Fallback)    │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 10. Potential Breaking Changes & Safeguards
1. **API Route Restructuring**: Existing endpoints will be upgraded to `/api/*` endpoints while maintaining backward compatibility wrappers if needed.
2. **Database Persistence**: Replacing `InMemoryStore` require converting memory objects to relational database tables without breaking seed data loading.
3. **Frontend Route Shift**: Re-routing to clean paths `/student/dashboard`, `/student/concepts`, `/student/quiz/[id]`, `/teacher/dashboard`.
