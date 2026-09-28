"""
LLM lesson-generation adapter.

Kept deliberately thin so the endpoint can reason about failure modes
without knowing which provider is wired in. Returns None on ANY failure —
network, timeout, malformed response, missing key. Callers must fall back.

Design guarantee: this adapter only ever receives a Concept. There is no
parameter for a learner id, so there is no code path that could leak PII.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from .models import Concept

log = logging.getLogger(__name__)


@dataclass
class GeneratedLesson:
    explanation: str
    worked_example: str


class LessonLLMAdapter:
    """
    Adapter surface. The real implementation would call an LLM provider.
    In the hackathon MVP we deliberately fail closed (return None) so the
    static fallback path is exercised.
    """

    def __init__(self, provider: Optional[str] = None) -> None:
        self.provider = provider  # kept for tests to inject a fake

    def generate(self, concept: Concept) -> Optional[GeneratedLesson]:
        try:
            if self.provider is None:
                return None  # no LLM configured — expected in the demo
            # Real implementations would build a prompt from *concept content*
            # only (title, description, grade band, curriculum reference).
            return None
        except Exception as exc:  # noqa: BLE001 — adapter must never raise
            log.warning("LLM lesson generation failed for %s: %s", concept.id, exc)
            return None


adapter = LessonLLMAdapter()
