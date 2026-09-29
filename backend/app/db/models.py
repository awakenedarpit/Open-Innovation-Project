from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: str = Field(primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: UserRole = Field(default=UserRole.STUDENT)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class ConceptDB(SQLModel, table=True):
    __tablename__ = "concepts"

    id: str = Field(primary_key=True)
    title: str
    slug: str = Field(index=True)
    description: str
    grade_band: str = Field(default="9-10")
    difficulty: str = Field(default="medium")
    category: str = Field(default="Computer Science")
    active_version: int = Field(default=1)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class ConceptPrerequisiteDB(SQLModel, table=True):
    __tablename__ = "concept_prerequisites"

    id: Optional[int] = Field(default=None, primary_key=True)
    concept_id: str = Field(foreign_key="concepts.id", index=True)
    prerequisite_id: str = Field(foreign_key="concepts.id", index=True)
    relationship: str = Field(default="requires")
    source: str = Field(default="curriculum")
    reviewer: str = Field(default="expert")

class QuestionDB(SQLModel, table=True):
    __tablename__ = "questions"

    id: str = Field(primary_key=True)
    target_concept_id: str = Field(foreign_key="concepts.id", index=True)
    prompt: str
    difficulty: str = Field(default="medium")
    answer_rubric: Optional[str] = None
    correct_option_id: str
    reviewed: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class QuestionOptionDB(SQLModel, table=True):
    __tablename__ = "question_options"

    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: str = Field(foreign_key="questions.id", index=True)
    option_id: str
    option_text: str
    is_correct: bool = Field(default=False)

class AttemptDB(SQLModel, table=True):
    __tablename__ = "attempts"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    question_id: str = Field(foreign_key="questions.id", index=True)
    selected_option_id: str
    outcome: str = Field(index=True)
    time_taken: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now, index=True)

class DiagnosisDB(SQLModel, table=True):
    __tablename__ = "diagnoses"

    id: Optional[int] = Field(default=None, primary_key=True)
    attempt_id: Optional[int] = Field(default=None, foreign_key="attempts.id")
    user_id: str = Field(index=True)
    target_concept_id: str = Field(foreign_key="concepts.id")
    root_concept_id: Optional[str] = Field(default=None, foreign_key="concepts.id")
    confidence_score: float = Field(default=0.0)
    recommended_action: str = Field(default="diagnostic_check")
    rationale: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class MisconceptionDB(SQLModel, table=True):
    __tablename__ = "misconceptions"

    id: str = Field(primary_key=True)
    concept_id: str = Field(foreign_key="concepts.id", index=True)
    title: str
    description: str
    severity: str = Field(default="high")
    created_at: datetime = Field(default_factory=utc_now)

class MicroLessonDB(SQLModel, table=True):
    __tablename__ = "micro_lessons"

    id: Optional[int] = Field(default=None, primary_key=True)
    concept_id: str = Field(foreign_key="concepts.id", index=True)
    misconception_id: Optional[str] = Field(default=None)
    title: str
    explanation: str
    worked_example: str
    source: str = Field(default="static_fallback")
    estimated_minutes: int = Field(default=3)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class LearningProgressDB(SQLModel, table=True):
    __tablename__ = "learning_progress"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    concept_id: str = Field(foreign_key="concepts.id", index=True)
    mastery_score: float = Field(default=0.0)
    status: str = Field(default="not_started", index=True)  # not_started, developing, mastered, needs_attention
    last_attempt_at: Optional[datetime] = Field(default=None)
    updated_at: datetime = Field(default_factory=utc_now)

class TeacherClassDB(SQLModel, table=True):
    __tablename__ = "teacher_classes"

    id: str = Field(primary_key=True)
    teacher_id: str = Field(index=True)
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class ClassStudentDB(SQLModel, table=True):
    __tablename__ = "class_students"

    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: str = Field(foreign_key="teacher_classes.id", index=True)
    student_id: str = Field(index=True)

class AnalyticsSnapshotDB(SQLModel, table=True):
    __tablename__ = "analytics_snapshots"

    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: str = Field(foreign_key="teacher_classes.id", index=True)
    concept_id: str = Field(foreign_key="concepts.id", index=True)
    student_count: int = Field(default=0)
    mastery_average: float = Field(default=0.0)
    misconception_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=utc_now)
