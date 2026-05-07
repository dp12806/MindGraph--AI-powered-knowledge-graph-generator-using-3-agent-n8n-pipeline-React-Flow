export default function ConflictPanel({ conflicts, onClose }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(5,5,15,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#13131f", border: "1px solid #2a2a3e",
        borderRadius: "16px", padding: "32px", maxWidth: "520px",
        width: "90%", maxHeight: "70vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#e05c5c", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
              Conflict Report
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
              {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} detected
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #2a2a3e",
            borderRadius: "8px", color: "#a8a8c0", cursor: "pointer",
            padding: "8px 14px", fontSize: "13px",
          }}>
            Close
          </button>
        </div>

        {conflicts.map((c, i) => (
          <div key={i} style={{
            background: "#1a1a2e", border: "1px solid #e05c5c33",
            borderLeft: "3px solid #e05c5c", borderRadius: "8px",
            padding: "16px", marginBottom: "12px",
          }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
              <code style={{
                background: "#0d0d1a", border: "1px solid #2a2a3e",
                borderRadius: "4px", padding: "3px 8px",
                fontSize: "11px", color: "#4ecdc4", fontFamily: "monospace",
              }}>
                {c.edge_a}
              </code>
              <code style={{
                background: "#0d0d1a", border: "1px solid #2a2a3e",
                borderRadius: "4px", padding: "3px 8px",
                fontSize: "11px", color: "#f7c76f", fontFamily: "monospace",
              }}>
                {c.edge_b}
              </code>
            </div>
            <div style={{ fontSize: "13px", color: "#a8a8c0", lineHeight: 1.5 }}>
              {c.reason}
            </div>
            {c.severity && (
              <div style={{
                display: "inline-block", marginTop: "8px",
                background: "#e05c5c22", border: "1px solid #e05c5c44",
                borderRadius: "4px", padding: "2px 8px",
                fontSize: "11px", color: "#e05c5c", textTransform: "uppercase", letterSpacing: "1px",
              }}>
                {c.severity}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
