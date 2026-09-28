# Concept X-Ray — Root-Cause Learning Debugger

> **SIH26207 Smart Education** — **CodeSlayer 2K26 (Open Innovation Track)**  
> Tracing backward through prerequisite graphs to uncover root-cause misconceptions when learners make mistakes.

---

## Architecture Overview

```
Codeslayer/
├── backend/                  # FastAPI + NetworkX + Pydantic Engine
│   ├── app/
│   │   ├── models.py         # Pydantic v2 domain models (Learner + Teacher)
│   │   ├── graph.py          # Prerequisite DAG & cycle detection
│   │   ├── seed_data.py      # 30 concepts, 39 edges, 21 seed questions
│   │   ├── class_seed.py     # Deterministic class attempts generator (24 learners)
│   │   ├── parallel_questions.py # Parallel check & probe questions
│   │   ├── store.py          # Thread-safe in-memory store
│   │   ├── trace.py          # Rule-based root-cause scoring engine
│   │   ├── teacher.py        # Teacher heatmap & pattern aggregation (k-anonymity)
│   │   ├── llm_adapter.py    # LLM micro-lesson generator with fallback
│   │   ├── static_lessons.py # 30 reviewed fallback lessons
│   │   └── main.py           # FastAPI REST API + CORS middleware
│   ├── scripts/
│   │   ├── seed.py           # Export seed graph to data/seed.json
│   │   └── validate.py       # Graph DAG & curriculum validator
│   ├── tests/
│   │   ├── test_data_layer.py # Graph structure & model tests
│   │   ├── test_trace.py     # Root-cause algorithm & scoring tests
│   │   ├── test_api.py       # Learner API integration tests
│   │   └── test_teacher.py   # Teacher aggregation & privacy tests (58 total tests passing)
│   ├── requirements.txt
│   └── pytest.ini
│
└── frontend/                 # Next.js 14 + TailwindCSS + @xyflow/react
    ├── app/
    │   ├── page.tsx          # Landing & demo script launcher
    │   ├── quiz/page.tsx     # Interactive quiz screen
    │   ├── trace/[questionId]/page.tsx # Star screen: interactive DAG trace visualizer
    │   ├── lesson/[conceptId]/page.tsx # Micro-lesson with check-in
    │   ├── repair/[sessionId]/page.tsx # Before/after repair validation
    │   ├── teacher/page.tsx  # Teacher class heatmap dashboard
    │   └── globals.css
    ├── components/
    │   ├── ConceptGraph.tsx  # Interactive React Flow DAG visualizer
    │   ├── CandidateCard.tsx # Ranked root-cause hypotheses
    │   ├── QuizCard.tsx      # Multi-choice question component
    │   ├── RepairComparison.tsx # Before vs after attempt comparison
    │   ├── HeatmapGrid.tsx   # 5-tier color-coded class concept heatmap
    │   ├── ConceptPatternDrawer.tsx # Aggregate wrong-answer pattern drawer
    │   └── Stepper.tsx       # Progress workflow navigation
    ├── lib/
    │   ├── api.ts            # Type-safe fetch client with error handling
    │   ├── types.ts          # Mirrors backend Pydantic models
    │   ├── learner.ts        # Session & learner ID manager
    │   └── demo.ts           # Pre-configured demo scenarios
    └── package.json
```

---

## Phase Verification Status (100% Complete)

| Phase | Component | Scope | Verification Status |
|---|---|---|---|
| **Phase 1** | **Foundation Data Layer** | 30 concepts, 39 edges, 21 questions, DAG cycle detection, validation suite | ✅ **100% Verified** (`scripts/validate.py` passes 0 errors) |
| **Phase 2** | **FastAPI Backend Engine** | Scoring engine, attempt tracker, lesson generator, repair loop, 10 endpoints | ✅ **100% Verified** (Pytest integration tests pass) |
| **Phase 3** | **Learner-Facing Next.js App** | Quiz, React Flow trace graph, micro-lesson, repair check, responsive UI | ✅ **100% Verified** (Typecheck + production build exit 0) |
| **Phase 4** | **Teacher Class Heatmap** | Anonymized class heatmap, k-anonymity privacy floor (min 3), pattern drawer | ✅ **100% Verified** (58/58 Pytest tests pass, Next.js build exit 0) |

---

## Quickstart

### 1. Run Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python scripts/seed.py
python scripts/validate.py
python -m pytest -v
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 2. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
