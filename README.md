# Concept X-Ray — Root-Cause Learning Debugger

> **SIH / Open Innovation Track Educational Technology Platform**  
> "Find the misconception. Fix the concept."

Concept X-Ray is an educational diagnostic platform designed to uncover the prerequisite misconceptions behind student incorrect answers by walking backward along directed concept DAGs.

---

## Architecture Overview

```text
                 ┌──────────────────────────────────────┐
                 │       Next.js 14 Frontend            │
                 │ React + Tailwind CSS + React Flow    │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼ REST API
                 ┌──────────────────────────────────────┐
                 │          FastAPI Backend             │
                 │ Pydantic v2 + NetworkX RCA Engine    │
                 └──────────┬───────────────────┬───────┘
                            │                   │
                     ┌──────┴──────┐     ┌──────┴──────┐
                     ▼             ▼     ▼             ▼
              ┌────────────┐ ┌───────────┐ ┌───────────┐
              │ PostgreSQL │ │ NetworkX  │ │ Optional  │
              │ SQLModel   │ │ Prereq    │ │ LLM       │
              │ Storage    │ │ DAG & RCA │ │ Service   │
              └────────────┘ └───────────┘ └───────────┘
```

---

## Key Features

1. **Prerequisite Concept DAG**: 30 CS concepts connected by 39 directed prerequisite relationships.
2. **Deterministic Root-Cause Engine**: Rules-based ancestor tracing with hop distance decay and performance weighting.
3. **Targeted Micro-Lessons**: Contextual explanations with code examples and fallback support.
4. **Repair & Validation Loop**: Dual-question verification (root-cause probe + parallel check) updating concept mastery.
5. **Teacher Analytics with k-Anonymity**: Aggregated class heatmaps and wrong-answer patterns protected by $k \ge 3$ privacy floors.
6. **EdTech Hub Design System**: Editorial typography (`Inter` + `Newsreader`), modern card components, responsive layouts, and interactive React Flow DAG exploration.
7. **Persistent Database**: SQLModel ORM integration supporting PostgreSQL and SQLite with single-command data seeding.

---

## Directory Structure

```text
Codeslayer/
├── backend/
│   ├── app/
│   │   ├── db/
│   │   │   ├── database.py       # Engine session manager (PostgreSQL / SQLite)
│   │   │   └── models.py         # SQLModel database schemas
│   │   ├── graph.py              # NetworkX DAG & cycle detection
│   │   ├── trace.py              # Root cause algorithm & scoring
│   │   ├── teacher.py            # k-Anonymity class heatmap aggregation
│   │   ├── store.py              # Data store provider
│   │   ├── seed_data.py          # 30 concepts, 39 prerequisite edges
│   │   ├── parallel_questions.py # Diagnostic check & parallel questions
│   │   ├── static_lessons.py     # Static fallback micro-lessons
│   │   └── main.py               # FastAPI application endpoints
│   ├── scripts/
│   │   ├── seed_database.py      # Idempotent DB seeder
│   │   └── validate.py           # Curriculum DAG validator
│   ├── tests/                    # Pytest integration suite (58 passing tests)
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Modern landing page
│   │   ├── student/
│   │   │   ├── dashboard/        # Student dashboard
│   │   │   ├── concepts/         # Concept explorer & detail
│   │   │   ├── quiz/[id]/        # Diagnostic quiz interface
│   │   │   ├── trace/[id]/       # X-Ray diagnosis view
│   │   │   ├── lesson/[id]/      # Micro-lesson view
│   │   │   └── repair/[sessionId]/ # Repair & validation loop
│   │   └── teacher/
│   │       └── dashboard/        # Educator class analytics
│   ├── components/
│   │   ├── Navbar.tsx            # Global responsive navigation
│   │   ├── Footer.tsx            # Editorial footer
│   │   ├── Sidebar.tsx           # Workspace sidebar
│   │   └── ConceptGraph.tsx      # Interactive React Flow DAG component
│   ├── lib/
│   │   ├── api.ts                # REST API client & helpers
│   │   └── types.ts              # TypeScript interfaces
│   └── package.json
└── docs/                         # Architecture, Database, API, Privacy, & UI docs
```

---

## Quickstart Guide

### 1. Backend Setup & Database Seeding

```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate

pip install -r requirements.txt

# Seed the Database (SQLite default or PostgreSQL via DATABASE_URL)
python scripts/seed_database.py

# Run Pytest Integration Suite
python -m pytest

# Start FastAPI Dev Server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 2. Frontend Setup & Run

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Environment Variables (`.env.example`)

```env
# Backend
DATABASE_URL=sqlite:///./concept_xray.db
# DATABASE_URL=postgresql://user:password@localhost:5432/concept_xray
SECRET_KEY=super-secret-key-change-in-production
LLM_API_KEY=optional_gemini_or_openai_key

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

---

## Testing & Production Verification

- **Backend Pytest**: `python -m pytest` (58/58 tests passing).
- **Frontend Build**: `npm run build` (Next.js 14 production build succeeds exit code 0).
