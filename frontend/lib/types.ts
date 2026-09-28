// Mirrors the FastAPI Pydantic models. Keep in sync with app/models.py.
export type GradeBand = "6-8" | "9-10" | "11-12";
export type Difficulty = "easy" | "medium" | "hard";
export type Outcome = "correct" | "incorrect" | "skipped";
export type Confidence = "low" | "medium" | "high";
export type RecommendedAction = "review_candidate" | "diagnostic_check" | "blocked";

export interface Concept {
  id: string;
  title: string;
  grade_band: GradeBand;
  description: string;
  curriculum_reference: string;
  active_version: number;
}

export interface PrerequisiteEdge {
  from_concept_id: string;
  to_concept_id: string;
  relationship: "requires" | "recommended" | "reinforces";
  source: string;
  reviewer: string;
}

export interface QuestionOption { id: string; text: string; }

export interface Question {
  id: string;
  prompt: string;
  options: QuestionOption[];
  correct_option_id: string;
  answer_rubric: string | null;
  target_concept_id: string;
  prerequisite_tags: string[];
  difficulty: Difficulty;
  reviewed: boolean;
}

export interface Attempt {
  learner_id: string;
  question_id: string;
  answer: string;
  outcome: Outcome;
  timestamp: string;
}

export interface EvidenceItem {
  question_id: string;
  outcome: Outcome;
  timestamp: string;
  age_hours: number;
}

export interface TraceCandidate {
  concept_id: string;
  concept_title: string;
  score: number;
  rank: number;
  is_direct_prerequisite: boolean;
  hop_distance: number;
  evidence: EvidenceItem[];
  confidence: Confidence;
  flags: string[];
  rationale: string;
}

export interface TraceResponse {
  learner_id: string;
  question_id: string;
  target_concept_id: string;
  candidates: TraceCandidate[];
  warnings: string[];
  recommended_action: RecommendedAction;
  recommended_candidate_id: string | null;
  diagnostic_question: Question | null;
}

export interface Lesson {
  concept_id: string;
  title: string;
  explanation: string;
  worked_example: string;
  source: "llm" | "static_fallback";
  version: number;
}

export interface RepairCheckSession {
  session_id: string;
  learner_id: string;
  original_question_id: string;
  root_cause_concept_id: string;
  probe_question: Question;
  parallel_question: Question;
  created_at: string;
}

export interface RepairCheckResult {
  session_id: string;
  learner_id: string;
  original_question_id: string;
  root_cause_concept_id: string;
  probe_correct: boolean;
  parallel_correct: boolean;
  repair_succeeded: boolean;
  message: string;
}

export interface GraphPayload {
  concepts: Concept[];
  edges: PrerequisiteEdge[];
}

export interface HeatmapCell {
  concept_id: string;
  concept_title: string;
  grade_band: GradeBand;
  total_attempts: number;
  incorrect_attempts: number;
  wrong_rate: number;
  distinct_learners_attempted: number;
  distinct_learners_wrong: number;
  suppressed: boolean;
}

export interface HeatmapResponse {
  cohort_id: string;
  learner_count: number;
  attempt_count: number;
  window_days: number;
  min_cohort: number;
  cells: HeatmapCell[];
  suppression_note: string | null;
}

export interface WrongAnswerPattern {
  question_id: string;
  question_prompt: string;
  chosen_option_id: string;
  chosen_option_text: string;
  count: number;
  distinct_learners: number;
  share_of_wrong: number;
}

export interface ConceptPatternsResponse {
  concept_id: string;
  concept_title: string;
  total_attempts: number;
  incorrect_attempts: number;
  wrong_rate: number;
  distinct_learners_attempted: number;
  distinct_learners_wrong: number;
  patterns: WrongAnswerPattern[];
  suppression_applied: boolean;
}

