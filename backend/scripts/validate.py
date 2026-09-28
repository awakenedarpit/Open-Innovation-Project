"""
Concept X-Ray — Dataset validator.

Checks:
  1. No dangling edges.
  2. Graph is a DAG.
  3. No orphan concepts.
  4. Every question targets exactly one existing concept.
  5. Question prerequisite_tags are real (transitive) prerequisites of target.
  6. Graph contains a multi-hop chain of depth >= 4.
  7. Every seeded concept has a reviewed static lesson.
Exit code 0 on success, 1 on failure.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.graph import (  # noqa: E402
    ancestors_of, build_graph, find_cycles, find_dangling_edges,
    find_orphan_concepts, longest_prerequisite_chain,
)
from app.seed_data import CONCEPTS, EDGES, QUESTIONS  # noqa: E402
from app.parallel_questions import PARALLEL_QUESTIONS  # noqa: E402
from app.static_lessons import STATIC_LESSONS  # noqa: E402


def run_checks() -> list[str]:
    errors: list[str] = []
    concept_ids = {c.id for c in CONCEPTS}
    all_questions = list(QUESTIONS) + list(PARALLEL_QUESTIONS)

    for e in find_dangling_edges(CONCEPTS, EDGES):
        errors.append(f"Dangling edge: {e.from_concept_id} -> {e.to_concept_id}")

    g = build_graph(CONCEPTS, EDGES)

    for cyc in find_cycles(g):
        errors.append("Cycle detected: " + " -> ".join(cyc + [cyc[0]]))

    orphans = find_orphan_concepts(CONCEPTS, EDGES)
    if orphans:
        errors.append(f"Orphan concepts (no edges): {orphans}")

    for q in all_questions:
        if q.target_concept_id not in concept_ids:
            errors.append(
                f"Question {q.id}: target_concept_id "
                f"'{q.target_concept_id}' not found in concepts"
            )

    for q in all_questions:
        if q.target_concept_id not in concept_ids:
            continue
        ancestors = set(ancestors_of(g, q.target_concept_id))
        for tag in q.prerequisite_tags:
            if tag not in concept_ids:
                errors.append(
                    f"Question {q.id}: prerequisite tag '{tag}' not found"
                )
            elif tag not in ancestors:
                errors.append(
                    f"Question {q.id}: tag '{tag}' is not a prerequisite "
                    f"of target '{q.target_concept_id}'"
                )

    if not any("Cycle detected" in e for e in errors):
        chain = longest_prerequisite_chain(g)
        if len(chain) < 4:
            errors.append(
                f"Longest chain is only {len(chain)} nodes; "
                f"expected >= 4 for a meaningful trace demo."
            )

    for c in CONCEPTS:
        if c.id not in STATIC_LESSONS:
            errors.append(f"Concept '{c.id}' has no reviewed static lesson fallback")

    return errors


def main() -> int:
    errors = run_checks()
    if errors:
        print("VALIDATION FAILED")
        for e in errors:
            print(f"  - {e}")
        return 1

    g = build_graph(CONCEPTS, EDGES)
    chain = longest_prerequisite_chain(g)
    all_q = list(QUESTIONS) + list(PARALLEL_QUESTIONS)
    print("VALIDATION PASSED")
    print(f"  concepts              : {len(CONCEPTS)}")
    print(f"  prerequisite edges    : {len(EDGES)}")
    print(f"  seed questions        : {len(QUESTIONS)}")
    print(f"  parallel questions    : {len(PARALLEL_QUESTIONS)}")
    print(f"  static lessons        : {len(STATIC_LESSONS)}")
    print(f"  acyclic (DAG)         : yes")
    print(f"  orphan concepts       : 0")
    print(f"  dangling edges        : 0")
    print(f"  longest prereq chain  : {len(chain)} nodes")
    print("    " + " -> ".join(chain))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
