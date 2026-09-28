import type {
  Attempt, ConceptPatternsResponse, GraphPayload, HeatmapResponse,
  Lesson, Outcome, Question, RepairCheckResult, RepairCheckSession,
  TraceResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (e) {
    throw new ApiError(0, `Cannot reach API at ${API_BASE} — is the FastAPI server running?`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string; concepts: number; questions: number }>("/health"),
  graph: () => request<GraphPayload>("/graph"),
  questions: () => request<Question[]>("/questions"),

  postAttempt: (body: {
    learner_id: string; question_id: string; answer: string;
    outcome: Outcome; timestamp?: string;
  }) => request<Attempt>("/attempts", { method: "POST", body: JSON.stringify(body) }),

  listAttempts: (learnerId: string) =>
    request<Attempt[]>(`/attempts/${encodeURIComponent(learnerId)}`),

  trace: (learnerId: string, questionId: string) =>
    request<TraceResponse>(
      `/trace/${encodeURIComponent(learnerId)}/${encodeURIComponent(questionId)}`,
    ),

  lesson: (conceptId: string) =>
    request<Lesson>(`/lesson/${encodeURIComponent(conceptId)}`),

  startRepair: (body: {
    learner_id: string; original_question_id: string; root_cause_concept_id: string;
  }) => request<RepairCheckSession>("/repair-check", {
    method: "POST", body: JSON.stringify(body),
  }),

  getRepair: (sessionId: string) =>
    request<RepairCheckSession>(`/repair-check/${encodeURIComponent(sessionId)}`),

  submitRepair: (sessionId: string, body: {
    probe_answer: string; probe_outcome: Outcome;
    parallel_answer: string; parallel_outcome: Outcome;
  }) => request<RepairCheckResult>(
    `/repair-check/${encodeURIComponent(sessionId)}/submit`,
    { method: "POST", body: JSON.stringify(body) },
  ),

  teacherHeatmap: () => request<HeatmapResponse>("/teacher/heatmap"),

  teacherConceptPatterns: (conceptId: string) =>
    request<ConceptPatternsResponse>(
      `/teacher/concept/${encodeURIComponent(conceptId)}/patterns`,
    ),
};

