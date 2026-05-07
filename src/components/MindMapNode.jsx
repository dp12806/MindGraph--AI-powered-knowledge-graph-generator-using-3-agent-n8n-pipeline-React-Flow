import { Handle, Position } from "reactflow";

const TYPE_COLORS = {
  root:   { bg: "#7c6ff7", border: "#a89cf7", text: "#fff" },
  branch: { bg: "#1e2a3a", border: "#4ecdc4", text: "#4ecdc4" },
  leaf:   { bg: "#161624", border: "#2a2a3e", text: "#a8a8c0" },
};

export default function MindMapNode({ data }) {
  const colors = TYPE_COLORS[data.type] || TYPE_COLORS.leaf;

  return (
    <div
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: data.type === "root" ? "12px" : "8px",
        padding: data.type === "root" ? "14px 20px" : "10px 16px",
        minWidth: data.type === "root" ? "140px" : "110px",
        maxWidth: "200px",
        textAlign: "center",
        boxShadow: data.type === "root"
          ? "0 0 24px rgba(124,111,247,0.35)"
          : data.type === "branch"
          ? "0 0 12px rgba(78,205,196,0.15)"
          : "none",
        cursor: "default",
        transition: "box-shadow 0.2s",
      }}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />

      {data.type === "root" && (
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "4px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
          root
        </div>
      )}

      <div style={{
        fontSize: data.type === "root" ? "15px" : "13px",
        fontWeight: data.type === "root" ? 700 : data.type === "branch" ? 600 : 400,
        color: colors.text,
        lineHeight: 1.3,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {data.label}
      </div>

      {data.depth !== undefined && data.type !== "root" && (
        <div style={{ fontSize: "10px", color: "rgba(168,168,192,0.4)", marginTop: "4px" }}>
          depth {data.depth}
        </div>
      )}
    </div>
  );
}
