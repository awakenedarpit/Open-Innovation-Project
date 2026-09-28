const KEY = "cxr.learner_id";

/** Pseudonymous id, generated once per browser. Never contains PII. */
export function getLearnerId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = "L-" + Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

const PRIMED_KEY = "cxr.primed";

/** True if demo priming has already run for this browser. */
export function isPrimed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PRIMED_KEY) === "1";
}

export function markPrimed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRIMED_KEY, "1");
}
