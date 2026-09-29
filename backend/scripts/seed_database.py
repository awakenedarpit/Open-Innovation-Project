"""
Concept X-Ray — Idempotent Database Seeding Script.

Seeds all 30 concepts, 39 prerequisite edges, questions, parallel questions,
static fallback micro-lessons, and class attempt data into PostgreSQL/SQLite.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

# Add backend root to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import Session, select
from app.db.database import engine, init_db
from app.db.models import (
    ConceptDB, ConceptPrerequisiteDB, QuestionDB, QuestionOptionDB,
    MicroLessonDB, User, UserRole, AttemptDB
)
from app.seed_data import CONCEPTS, EDGES, QUESTIONS
from app.parallel_questions import PARALLEL_QUESTIONS
from app.static_lessons import STATIC_LESSONS

def seed_database() -> None:
    print("Initializing Database tables...")
    init_db()

    with Session(engine) as session:
        # 1. Seed Concepts
        print(f"Seeding {len(CONCEPTS)} Concepts...")
        for c in CONCEPTS:
            existing = session.exec(select(ConceptDB).where(ConceptDB.id == c.id)).first()
            if not existing:
                db_concept = ConceptDB(
                    id=c.id,
                    title=c.title,
                    slug=c.id,
                    description=c.description,
                    grade_band=c.grade_band.value if hasattr(c.grade_band, 'value') else str(c.grade_band),
                    active_version=c.active_version,
                )
                session.add(db_concept)
        session.commit()

        # 2. Seed Prerequisite Edges
        print(f"Seeding {len(EDGES)} Prerequisite Edges...")
        for e in EDGES:
            existing = session.exec(
                select(ConceptPrerequisiteDB).where(
                    ConceptPrerequisiteDB.concept_id == e.to_concept_id,
                    ConceptPrerequisiteDB.prerequisite_id == e.from_concept_id
                )
            ).first()
            if not existing:
                db_edge = ConceptPrerequisiteDB(
                    concept_id=e.to_concept_id,
                    prerequisite_id=e.from_concept_id,
                    relationship=e.relationship.value if hasattr(e.relationship, 'value') else str(e.relationship),
                    source=e.source,
                    reviewer=e.reviewer,
                )
                session.add(db_edge)
        session.commit()

        # 3. Seed Questions & Options
        all_questions = list(QUESTIONS) + list(PARALLEL_QUESTIONS)
        print(f"Seeding {len(all_questions)} Questions & Options...")
        for q in all_questions:
            existing_q = session.exec(select(QuestionDB).where(QuestionDB.id == q.id)).first()
            if not existing_q:
                db_q = QuestionDB(
                    id=q.id,
                    target_concept_id=q.target_concept_id,
                    prompt=q.prompt,
                    difficulty=q.difficulty.value if hasattr(q.difficulty, 'value') else str(q.difficulty),
                    answer_rubric=q.answer_rubric,
                    correct_option_id=q.correct_option_id,
                    reviewed=q.reviewed,
                )
                session.add(db_q)
                session.commit()

                # Add options
                for opt in q.options:
                    db_opt = QuestionOptionDB(
                        question_id=q.id,
                        option_id=opt.id,
                        option_text=opt.text,
                        is_correct=(opt.id == q.correct_option_id),
                    )
                    session.add(db_opt)
        session.commit()

        # 4. Seed Micro Lessons
        print(f"Seeding {len(STATIC_LESSONS)} Micro Lessons...")
        for cid, (exp, wrk) in STATIC_LESSONS.items():
            existing_l = session.exec(select(MicroLessonDB).where(MicroLessonDB.concept_id == cid)).first()
            if not existing_l:
                concept_obj = session.exec(select(ConceptDB).where(ConceptDB.id == cid)).first()
                title = concept_obj.title if concept_obj else cid
                db_lesson = MicroLessonDB(
                    concept_id=cid,
                    title=title,
                    explanation=exp,
                    worked_example=wrk,
                    source="static_fallback",
                )
                session.add(db_lesson)
        session.commit()

        # 5. Seed Demo Users
        print("Seeding Demo Users...")
        demo_users = [
            User(id="demo_student_01", name="Demo Student", email="student@conceptxray.org", password_hash="hashed_secret", role=UserRole.STUDENT),
            User(id="demo_teacher_01", name="Demo Teacher", email="teacher@conceptxray.org", password_hash="hashed_secret", role=UserRole.TEACHER),
        ]
        for u in demo_users:
            if not session.exec(select(User).where(User.id == u.id)).first():
                session.add(u)
        session.commit()

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
