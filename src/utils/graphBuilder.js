import { MarkerType } from "reactflow";

// Edge colors by relation type
const EDGE_STYLES = {
  contains:    { stroke: "#4ecdc4", label: "contains" },
  causes:      { stroke: "#f7a34b", label: "causes" },
  enables:     { stroke: "#7c6ff7", label: "enables" },
  requires:    { stroke: "#f7c76f", label: "requires" },
  supports:    { stroke: "#6fcf97", label: "supports" },
  contradicts: { stroke: "#e05c5c", label: "contradicts" },
  opposes:     { stroke: "#eb5757", label: "opposes" },
};

// Auto-layout: position nodes based on depth and index
function computeLayout(nodes) {
  const byDepth = {};
  for (const node of nodes) {
    const d = node.depth ?? 0;
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(node);
  }

  const X_SPACING = 220;
  const Y_SPACING = 140;
  const positions = {};

  const depths = Object.keys(byDepth).map(Number).sort((a, b) => a - b);

  for (const depth of depths) {
    const group = byDepth[depth];
    const totalWidth = (group.length - 1) * X_SPACING;
    const startX = -totalWidth / 2;

    group.forEach((node, i) => {
      positions[node.id] = {
        x: startX + i * X_SPACING,
        y: depth * Y_SPACING,
      };
    });
  }

  return positions;
}

export function buildGraphElements(data) {
  const { nodes: rawNodes, edges: rawEdges } = data;

  // Compute positions
  const positions = computeLayout(rawNodes);

  // Build React Flow nodes
  const rfNodes = rawNodes.map(node => ({
    id: node.id,
    type: "mindmap",
    position: positions[node.id] || { x: 0, y: 0 },
    data: {
      label: node.label,
      type:  node.type,
      depth: node.depth,
    },
  }));

  // Build React Flow edges
  const rfEdges = rawEdges.map((edge, i) => {
    const style = EDGE_STYLES[edge.relation] || { stroke: "#4a4a6a", label: edge.relation };
    const isConflict = edge.relation === "contradicts" || edge.relation === "opposes";

    return {
      id: `edge-${i}-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      label: style.label,
      labelStyle: {
        fontSize: 10,
        fill: style.stroke,
        fontFamily: "'DM Mono', monospace",
      },
      labelBgStyle: {
        fill: "#0d0d1a",
        fillOpacity: 0.85,
        rx: 4,
      },
      style: {
        stroke: style.stroke,
        strokeWidth: edge.weight ? Math.max(1, edge.weight * 2.5) : 1.5,
        strokeDasharray: isConflict ? "5 3" : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: style.stroke,
        width: 16,
        height: 16,
      },
      animated: edge.relation === "causes",
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}
