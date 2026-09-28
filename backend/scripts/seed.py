"""Concept X-Ray — Seed script. Writes data/seed.json."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.seed_data import CONCEPTS, EDGES, QUESTIONS  # noqa: E402
from app.parallel_questions import PARALLEL_QUESTIONS  # noqa: E402

DATA_DIR = ROOT / "data"


def main() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    payload = {
        "concepts":  [c.model_dump(mode="json") for c in CONCEPTS],
        "edges":     [e.model_dump(mode="json") for e in EDGES],
        "questions": [q.model_dump(mode="json")
                      for q in list(QUESTIONS) + list(PARALLEL_QUESTIONS)],
    }
    out = DATA_DIR / "seed.json"
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(CONCEPTS)} concepts, {len(EDGES)} edges, "
          f"{len(QUESTIONS) + len(PARALLEL_QUESTIONS)} questions -> {out}")


if __name__ == "__main__":
    main()
