# Concept X-Ray — Database Architecture & Schema (`docs/DATABASE.md`)

## 1. Overview
Concept X-Ray persists its prerequisite concept graph, question bank, diagnostic attempts, root-cause analyses, micro-lessons, and class analytics using SQLModel (SQLAlchemy 2.0 ORM + Pydantic v2).

Supports PostgreSQL and SQLite database backends via `DATABASE_URL`.

---

## 2. Relational Entity Relationship Diagram
```text
┌──────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│    users     │       │       concepts       │───────│ concept_prerequisites│
├──────────────┤       ├──────────────────────┤       └──────────────────────┘
│ id           │       │ id                   │
│ email        │       │ title                │       ┌──────────────────────┐
│ role         │       │ grade_band           │───────│    micro_lessons     │
└──────┬───────┘       └──────────┬───────────┘       └──────────────────────┘
       │                          │
       │                          ▼
       │               ┌──────────────────────┐       ┌──────────────────────┐
       │               │      questions       │───────│   question_options   │
       │               └──────────┬───────────┘       └──────────────────────┘
       │                          │
       ▼                          ▼
┌─────────────────────────────────────────────┐
│                  attempts                   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                 diagnoses                   │
└─────────────────────────────────────────────┘
```

---

## 3. Entity Definitions & Tables

### `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR (PK) | User identifier |
| `name` | VARCHAR | Full user name |
| `email` | VARCHAR (Unique, Index) | Login email address |
| `password_hash` | VARCHAR | Hashed credential |
| `role` | VARCHAR | `student`, `teacher`, or `admin` |

### `concepts`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR (PK) | Unique concept slug (e.g. `pointers`) |
| `title` | VARCHAR | Display title |
| `description` | TEXT | Detailed educational overview |
| `grade_band` | VARCHAR | Target band (`6-8`, `9-10`, `11-12`) |

### `concept_prerequisites`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INT (PK) | Autoincrement edge ID |
| `concept_id` | VARCHAR (FK) | Dependent concept |
| `prerequisite_id` | VARCHAR (FK) | Required upstream prerequisite concept |

### `questions`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR (PK) | Question ID (e.g. `q_ptr_01`) |
| `target_concept_id` | VARCHAR (FK) | Evaluated concept |
| `prompt` | TEXT | Question text |
| `correct_option_id` | VARCHAR | Correct option ID |

---

## 4. Seeding Command
```bash
python scripts/seed_database.py
```
Seeds all 30 concepts, 39 edges, 32 questions, options, static micro-lessons, and demo users in one command.
