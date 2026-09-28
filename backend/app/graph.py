"""
Concept X-Ray — Graph construction and structural checks.

Direction convention: edges point prerequisite -> dependent, so
`ancestors_of(g, c)` returns the transitive prerequisites of `c`.
"""
from __future__ import annotations

from typing import Sequence

import networkx as nx

from .models import Concept, PrerequisiteEdge


def build_graph(concepts: Sequence[Concept],
                edges: Sequence[PrerequisiteEdge]) -> nx.DiGraph:
    """Build the concept dependency graph; edges point prerequisite -> dependent."""
    g = nx.DiGraph()
    for c in concepts:
        g.add_node(c.id, title=c.title, grade_band=c.grade_band.value)
    for e in edges:
        g.add_edge(
            e.from_concept_id,
            e.to_concept_id,
            relationship=e.relationship.value,
            source=e.source,
            reviewer=e.reviewer,
        )
    return g


def find_cycles(g: nx.DiGraph) -> list[list[str]]:
    return [list(cycle) for cycle in nx.simple_cycles(g)]


def is_acyclic(g: nx.DiGraph) -> bool:
    return nx.is_directed_acyclic_graph(g)


def find_orphan_concepts(concepts: Sequence[Concept],
                         edges: Sequence[PrerequisiteEdge]) -> list[str]:
    connected: set[str] = set()
    for e in edges:
        connected.add(e.from_concept_id)
        connected.add(e.to_concept_id)
    return [c.id for c in concepts if c.id not in connected]


def find_dangling_edges(concepts: Sequence[Concept],
                        edges: Sequence[PrerequisiteEdge]
                        ) -> list[PrerequisiteEdge]:
    known = {c.id for c in concepts}
    return [e for e in edges
            if e.from_concept_id not in known or e.to_concept_id not in known]


def longest_prerequisite_chain(g: nx.DiGraph) -> list[str]:
    if not nx.is_directed_acyclic_graph(g):
        raise ValueError("Graph is not a DAG; cannot compute longest chain.")
    return list(nx.dag_longest_path(g))


def prerequisites_of(g: nx.DiGraph, concept_id: str) -> list[str]:
    """Direct predecessors (immediate prerequisites)."""
    return list(g.predecessors(concept_id))


def ancestors_of(g: nx.DiGraph, concept_id: str) -> list[str]:
    """All transitive prerequisites (candidate root causes for the trace)."""
    return list(nx.ancestors(g, concept_id))


def hop_distance(g: nx.DiGraph, source: str, target: str) -> int:
    """Shortest directed path length from source (prereq) to target (dependent)."""
    return nx.shortest_path_length(g, source, target)


def is_subgraph_acyclic(g: nx.DiGraph, nodes) -> bool:
    """True iff the subgraph induced by `nodes` (plus internal edges) is a DAG."""
    return nx.is_directed_acyclic_graph(g.subgraph(nodes))


def simple_cycles_in_subgraph(g: nx.DiGraph, nodes) -> list[list[str]]:
    return [list(c) for c in nx.simple_cycles(g.subgraph(nodes))]
