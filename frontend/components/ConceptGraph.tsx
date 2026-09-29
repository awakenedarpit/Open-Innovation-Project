"use client";

import React, { useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import clsx from "clsx";
import { Search, Info, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, X } from "lucide-react";
import type { Concept, PrerequisiteEdge, TraceCandidate } from "@/lib/types";

export type MasteryStatus = "mastered" | "developing" | "misconception" | "not_attempted";
export type NodeRole = "target" | "root_cause" | "candidate" | "context";

type ConceptNodeData = {
  title: string;
  conceptId: string;
  role?: NodeRole;
  status?: MasteryStatus;
  hopDistance?: number;
  confidence?: "low" | "medium" | "high";
  isSelected?: boolean;
};

function ConceptNode({ data }: NodeProps<Node<ConceptNodeData>>) {
  // Mastery status style dictionary
  const statusStyles: Record<MasteryStatus, string> = {
    mastered: "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-emerald-100",
    developing: "border-amber-400 bg-amber-50 text-amber-900 shadow-amber-100",
    misconception: "border-rose-500 bg-rose-50 text-rose-900 shadow-rose-100 ring-2 ring-rose-300 animate-pulse",
    not_attempted: "border-slate-200 bg-white text-slate-700 shadow-slate-50",
  };

  // Diagnostic role style dictionary
  const roleStyles: Record<NodeRole, string> = {
    target: "border-rose-500 bg-rose-500/10 text-rose-900 font-bold",
    root_cause: "border-amber-500 bg-amber-500/20 text-amber-950 font-bold ring-2 ring-amber-400/50",
    candidate: "border-indigo-300 bg-indigo-50 text-indigo-900",
    context: "border-slate-200 bg-slate-50 text-slate-600",
  };

  const currentStyle = data.role 
    ? roleStyles[data.role]
    : statusStyles[data.status || "not_attempted"];

  return (
    <div
      className={clsx(
        "rounded-xl border-2 px-3 py-2.5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md min-w-[170px]",
        currentStyle,
        data.isSelected && "ring-2 ring-navy-900 scale-105"
      )}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-navy-400" />
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs font-semibold leading-tight text-navy-900">
          {data.title}
        </span>
        {data.status === "mastered" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
        {data.status === "misconception" && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
      </div>
      
      {(data.hopDistance !== undefined || data.confidence) && (
        <div className="flex items-center justify-between text-[10px] text-navy-600 font-medium pt-1 border-t border-black/5">
          <span>{data.hopDistance !== undefined ? `${data.hopDistance} hop${data.hopDistance === 1 ? "" : "s"}` : ""}</span>
          {data.confidence && (
            <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/5 font-mono">
              {data.confidence}
            </span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-navy-400" />
    </div>
  );
}

const NODE_TYPES = { concept: ConceptNode };

interface ConceptGraphProps {
  concepts: Concept[];
  edges: PrerequisiteEdge[];
  targetId?: string;
  candidates?: TraceCandidate[];
  recommendedCandidateId?: string | null;
  masteryMap?: Record<string, MasteryStatus>;
  onConceptSelect?: (concept: Concept) => void;
  isLoading?: boolean;
}

export function ConceptGraph({
  concepts = [],
  edges = [],
  targetId,
  candidates = [],
  recommendedCandidateId,
  masteryMap = {},
  onConceptSelect,
  isLoading = false,
}: ConceptGraphProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Compute graph layout nodes and edges
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!concepts.length) return { rfNodes: [], rfEdges: [] };

    // Layout graph using topological sorting / topological levels
    const levelMap = new Map<string, number>();
    const inDegree = new Map<string, number>();

    concepts.forEach(c => {
      levelMap.set(c.id, 0);
      inDegree.set(c.id, 0);
    });

    edges.forEach(e => {
      inDegree.set(e.to_concept_id, (inDegree.get(e.to_concept_id) || 0) + 1);
    });

    // BFS topological leveling
    const queue = concepts.filter(c => (inDegree.get(c.id) || 0) === 0).map(c => c.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currLevel = levelMap.get(curr) || 0;

      edges.filter(e => e.from_concept_id === curr).forEach(e => {
        const target = e.to_concept_id;
        levelMap.set(target, Math.max(levelMap.get(target) || 0, currLevel + 1));
        inDegree.set(target, (inDegree.get(target) || 1) - 1);
        if (inDegree.get(target) === 0) queue.push(target);
      });
    }

    // Bucket nodes by computed level
    const levelBuckets = new Map<number, Concept[]>();
    concepts.forEach(c => {
      const lvl = levelMap.get(c.id) || 0;
      const bucket = levelBuckets.get(lvl) || [];
      bucket.push(c);
      levelBuckets.set(lvl, bucket);
    });

    const X_SPACING = 240;
    const Y_SPACING = 90;

    const nodes: Node<ConceptNodeData>[] = [];
    levelBuckets.forEach((bucket, lvl) => {
      bucket.forEach((concept, idx) => {
        const matchesSearch = searchQuery
          ? concept.title.toLowerCase().includes(searchQuery.toLowerCase())
          : true;

        const isTarget = concept.id === targetId;
        const isRoot = concept.id === recommendedCandidateId;
        const cand = candidates.find(c => c.concept_id === concept.id);
        const isCandidate = Boolean(cand);

        let role: NodeRole | undefined = undefined;
        if (targetId) {
          role = isTarget ? "target" : isRoot ? "root_cause" : isCandidate ? "candidate" : "context";
        }

        const status: MasteryStatus = masteryMap[concept.id] || "not_attempted";

        nodes.push({
          id: concept.id,
          type: "concept",
          position: {
            x: lvl * X_SPACING,
            y: idx * Y_SPACING - (bucket.length * Y_SPACING) / 2,
          },
          data: {
            title: concept.title,
            conceptId: concept.id,
            role,
            status,
            hopDistance: cand?.hop_distance,
            confidence: cand?.confidence,
            isSelected: concept.id === selectedNodeId,
          },
          hidden: !matchesSearch && Boolean(searchQuery),
        });
      });
    });

    const flowEdges: Edge[] = edges.map(e => {
      const isHighlighted = selectedNodeId
        ? e.from_concept_id === selectedNodeId || e.to_concept_id === selectedNodeId
        : false;

      return {
        id: `${e.from_concept_id}->${e.to_concept_id}`,
        source: e.from_concept_id,
        target: e.to_concept_id,
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? "#059669" : "#cbd5e1",
          strokeWidth: isHighlighted ? 2.5 : 1.5,
        },
      };
    });

    return { rfNodes: nodes, rfEdges: flowEdges };
  }, [concepts, edges, targetId, candidates, recommendedCandidateId, masteryMap, searchQuery, selectedNodeId]);

  const selectedConcept = useMemo(
    () => concepts.find(c => c.id === selectedNodeId),
    [concepts, selectedNodeId]
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    const concept = concepts.find(c => c.id === node.id);
    if (concept && onConceptSelect) {
      onConceptSelect(concept);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[480px] w-full rounded-2xl border border-navy-200 bg-white flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-navy-600">Loading Prerequisite DAG...</p>
      </div>
    );
  }

  if (!concepts.length) {
    return (
      <div className="h-[480px] w-full rounded-2xl border border-navy-200 bg-navy-50 flex flex-col items-center justify-center p-6 text-center space-y-2">
        <HelpCircle className="w-10 h-10 text-navy-400 mb-2" />
        <h4 className="text-base font-semibold text-navy-900">No Concepts Found</h4>
        <p className="text-xs text-navy-500 max-w-sm">
          No concept graph nodes are currently available to render.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] sm:h-[580px] w-full rounded-2xl border border-navy-200 bg-white overflow-hidden shadow-subtle flex flex-col">
      {/* Top Bar / Search Controls */}
      <div className="p-3 bg-white border-b border-navy-100 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-navy-400" />
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-navy-50 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-navy-900 placeholder-navy-400"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-[11px] font-medium text-navy-600 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Developing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Misconception</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>Not Attempted</span>
          </div>
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={NODE_TYPES}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#f1f5f9" />
          <Controls showInteractive={true} className="!left-4 !bottom-4" />
        </ReactFlow>

        {/* Concept Detail Slide-Over */}
        {selectedConcept && (
          <div className="absolute right-4 top-4 bottom-4 w-72 sm:w-80 bg-white border border-navy-200 rounded-xl shadow-elevated p-4 z-20 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-navy-100 pb-3 mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  Concept Detail
                </span>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 text-navy-400 hover:text-navy-900 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-navy-900 mb-1">
                {selectedConcept.title}
              </h3>
              <p className="text-xs text-navy-600 leading-relaxed mb-4">
                {selectedConcept.description}
              </p>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-navy-500 block mb-1">
                    Direct Prerequisites
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {edges.filter(e => e.to_concept_id === selectedConcept.id).length > 0 ? (
                      edges
                        .filter(e => e.to_concept_id === selectedConcept.id)
                        .map(e => {
                          const prereq = concepts.find(c => c.id === e.from_concept_id);
                          return (
                            <span
                              key={e.from_concept_id}
                              className="text-[11px] bg-navy-50 border border-navy-200 px-2 py-1 rounded text-navy-800 font-medium"
                            >
                              {prereq?.title || e.from_concept_id}
                            </span>
                          );
                        })
                    ) : (
                      <span className="text-xs text-navy-400 italic">No prerequisites (Root Concept)</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-navy-500 block mb-1">
                    Grade Band & Category
                  </span>
                  <span className="text-xs font-mono text-navy-700 bg-navy-100 px-2 py-0.5 rounded">
                    {selectedConcept.grade_band || "Introductory CS"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-navy-100 mt-4">
              <a
                href={`/student/concepts/${selectedConcept.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <span>View Full Curriculum</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
