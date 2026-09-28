"use client";
import {
  Background, Controls, Handle, Position,
  ReactFlow, type Edge, type Node, type NodeProps,
} from "@xyflow/react";
import { useMemo } from "react";
import clsx from "clsx";
import type { Concept, PrerequisiteEdge, TraceCandidate } from "@/lib/types";

// --------------------------------------------------------------------------- //
// Custom node
// --------------------------------------------------------------------------- //
export type NodeRole = "target" | "root_cause" | "candidate" | "context";

type ConceptNodeData = {
  title: string;
  role: NodeRole;
  hopDistance?: number;
  confidence?: "low" | "medium" | "high";
};

function ConceptNode({ data }: NodeProps<Node<ConceptNodeData>>) {
  const roleStyles: Record<NodeRole, string> = {
    target:     "border-miss-500 bg-miss-500/10 text-miss-600",
    root_cause: "border-root-500 bg-root-500/15 text-root-600 ring-2 ring-root-500/40",
    candidate:  "border-slate-300 bg-white text-slate-700",
    context:    "border-slate-200 bg-slate-50 text-slate-500",
  };
  return (
    <div
      className={clsx(
        "rounded-xl border-2 px-3 py-2 shadow-sm w-[160px] sm:w-[180px]",
        roleStyles[data.role],
      )}
    >
      <Handle type="target" position={Position.Left} />
      <div className="text-[11px] font-semibold leading-tight">{data.title}</div>
      <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
        <span>{data.hopDistance !== undefined ? `${data.hopDistance} hop${data.hopDistance === 1 ? "" : "s"}` : ""}</span>
        {data.confidence && <span className="uppercase tracking-wide">{data.confidence}</span>}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const NODE_TYPES = { concept: ConceptNode };

// --------------------------------------------------------------------------- //
// Layered layout: x = distance from target, y = index within layer
// --------------------------------------------------------------------------- //
const X_GAP = 220;
const Y_GAP = 96;

function computeSubgraph(
  concepts: Concept[],
  edges: PrerequisiteEdge[],
  targetId: string,
  maxHops: number,
) {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  // Build reverse adjacency (dependent -> prerequisites) for ancestor walk.
  const prereqOf = new Map<string, string[]>();
  for (const e of edges) {
    const list = prereqOf.get(e.to_concept_id) ?? [];
    list.push(e.from_concept_id);
    prereqOf.set(e.to_concept_id, list);
  }
  // BFS out from target to ancestors, capping at maxHops.
  const hop = new Map<string, number>([[targetId, 0]]);
  const queue: string[] = [targetId];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = hop.get(cur)!;
    if (d >= maxHops) continue;
    for (const p of prereqOf.get(cur) ?? []) {
      if (!hop.has(p)) { hop.set(p, d + 1); queue.push(p); }
    }
  }
  const nodesInSubgraph = new Set(hop.keys());
  const edgesInSubgraph = edges.filter(
    (e) => nodesInSubgraph.has(e.from_concept_id) && nodesInSubgraph.has(e.to_concept_id),
  );
  return { byId, hop, nodesInSubgraph, edgesInSubgraph };
}

function shortestPathEdges(
  edges: PrerequisiteEdge[],
  from: string,
  to: string,
): Set<string> {
  // BFS forward (prerequisite -> dependent) from `from` to `to`.
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const l = adj.get(e.from_concept_id) ?? [];
    l.push(e.to_concept_id);
    adj.set(e.from_concept_id, l);
  }
  const prev = new Map<string, string>();
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    for (const nxt of adj.get(cur) ?? []) {
      if (!seen.has(nxt)) { seen.add(nxt); prev.set(nxt, cur); q.push(nxt); }
    }
  }
  const path = new Set<string>();
  let node: string | undefined = to;
  while (node && node !== from) {
    const p = prev.get(node);
    if (!p) return new Set();
    path.add(`${p}->${node}`);
    node = p;
  }
  return path;
}

// --------------------------------------------------------------------------- //
// Public component
// --------------------------------------------------------------------------- //
export function ConceptGraph({
  concepts,
  edges,
  targetId,
  candidates,
  recommendedCandidateId,
  maxHops = 4,
}: {
  concepts: Concept[];
  edges: PrerequisiteEdge[];
  targetId: string;
  candidates: TraceCandidate[];
  recommendedCandidateId: string | null;
  maxHops?: number;
}) {
  const { nodes, rfEdges } = useMemo(() => {
    const { byId, hop, edgesInSubgraph } = computeSubgraph(
      concepts, edges, targetId, maxHops,
    );
    // Bucket by hop distance, then by x-position (target far right, deepest far left).
    const byLayer = new Map<number, string[]>();
    for (const [id, h] of hop.entries()) {
      const list = byLayer.get(h) ?? [];
      list.push(id);
      byLayer.set(h, list);
    }
    const maxH = Math.max(...hop.values());
    const rfNodes: Node<ConceptNodeData>[] = [];
    for (const [h, ids] of byLayer.entries()) {
      ids.sort(); // deterministic order
      const x = (maxH - h) * X_GAP;
      const totalH = (ids.length - 1) * Y_GAP;
      ids.forEach((id, i) => {
        const concept = byId.get(id)!;
        const isTarget = id === targetId;
        const isRoot = id === recommendedCandidateId;
        const isCandidate = candidates.some((c) => c.concept_id === id);
        const cand = candidates.find((c) => c.concept_id === id);
        const role: NodeRole =
          isTarget ? "target" :
          isRoot   ? "root_cause" :
          isCandidate ? "candidate" :
          "context";
        rfNodes.push({
          id,
          type: "concept",
          position: { x, y: i * Y_GAP - totalH / 2 },
          data: {
            title: concept.title,
            role,
            hopDistance: cand?.hop_distance,
            confidence: cand?.confidence,
          },
        });
      });
    }

    // Edges — highlight the shortest path from recommended candidate to target.
    const highlight = recommendedCandidateId
      ? shortestPathEdges(edgesInSubgraph, recommendedCandidateId, targetId)
      : new Set<string>();

    const rfEdges: Edge[] = edgesInSubgraph.map((e) => {
      const key = `${e.from_concept_id}->${e.to_concept_id}`;
      const on = highlight.has(key);
      return {
        id: key,
        source: e.from_concept_id,
        target: e.to_concept_id,
        animated: on,
        style: on
          ? { stroke: "#d97706", strokeWidth: 2.5 }
          : { stroke: "#cbd5e1", strokeWidth: 1.5 },
      };
    });

    return { nodes: rfNodes, rfEdges };
  }, [concepts, edges, targetId, candidates, recommendedCandidateId, maxHops]);

  return (
    <div className="h-[420px] sm:h-[520px] w-full rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.35}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} color="#e2e8f0" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
