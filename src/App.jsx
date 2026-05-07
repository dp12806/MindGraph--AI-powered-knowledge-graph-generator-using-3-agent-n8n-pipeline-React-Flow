import { useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import MindMapNode from "./components/MindMapNode";
import ConflictPanel from "./components/ConflictPanel";
import ExportPanel from "./components/ExportPanel";
import { buildGraphElements } from "./utils/graphBuilder";

const nodeTypes = { mindmap: MindMapNode };
const N8N_WEBHOOK_URL = "YOUR_WEBHOOK_URL";
const SUPADATA_API_KEY = "YOUR_SUPADATA_API_KEY";

const SOURCE_MODES = [
  { id: "text",    label: "Text"    },
  { id: "url",     label: "URL"     },
  { id: "youtube", label: "YouTube" },
];

function detectSourceType(input) {
  if (input.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/)) return "youtube";
  if (input.match(/^https?:\/\//)) return "url";
  return "text";
}

// ── YouTube transcript via Supadata ───────────────────────────
async function fetchYouTubeContent(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return `Generate a detailed mind map about this YouTube video: ${url}`;
  const videoId = match[1];

  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
      { headers: { "x-api-key": SUPADATA_API_KEY } }
    );
    const data = await res.json();
    if (data?.content && data.content.length > 100) {
      return data.content.slice(0, 8000);
    }
  } catch (_) {}

  // Fallback if transcript unavailable
  return `Generate a detailed and comprehensive mind map about the content and main topics of this YouTube video: ${url} (Video ID: ${videoId})`;
}

// ── URL content via proxy ─────────────────────────────────────
async function fetchUrlContent(url) {
  return `Generate a detailed and comprehensive mind map about the content and main topics covered at this webpage: ${url}`;
}

const STEPS_TEXT = [
  { id: 1, label: "Agent 1 — extracting concepts"  },
  { id: 2, label: "Agent 2 — building hierarchy"   },
  { id: 3, label: "Agent 3 — typing relationships" },
  { id: 4, label: "Conflict detector — scanning"   },
];
const STEPS_RAG = [
  { id: 0, label: "Fetching source content"         },
  ...STEPS_TEXT,
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [prompt, setPrompt]               = useState("");
  const [sourceMode, setSourceMode]       = useState("text");
  const [isUrlMode, setIsUrlMode]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [conflicts, setConflicts]         = useState([]);
  const [meta, setMeta]                   = useState(null);
  const [topic, setTopic]                 = useState("");
  const [agentStatus, setAgentStatus]     = useState([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showExport, setShowExport]       = useState(false);
  const [ragInfo, setRagInfo]             = useState(null);

  const timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };

  const simulateProgress = (hasRAG) => {
    const steps = (hasRAG ? STEPS_RAG : STEPS_TEXT).map(s => ({ ...s, done: false }));
    setAgentStatus(steps);
    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setAgentStatus(prev =>
          prev.map(s => s.id === step.id ? { ...s, done: true } : s)
        );
      }, (i + 1) * 2500);
      timers.push(t);
    });
  };

  const generate = async () => {
    if (!prompt.trim()) return;

    const detectedType = sourceMode === "text"
      ? detectSourceType(prompt)
      : sourceMode;
    const urlMode = detectedType === "url" || detectedType === "youtube";

    setIsUrlMode(urlMode);
    setLoading(true);
    setError(null);
    setConflicts([]);
    setMeta(null);
    setRagInfo(null);
    setTopic("");
    setNodes([]);
    setEdges([]);
    simulateProgress(urlMode);

    // Build final prompt
    let finalPrompt = prompt.trim();
    if (urlMode) {
      try {
        if (detectedType === "youtube") {
          finalPrompt = await fetchYouTubeContent(prompt.trim());
        } else {
          finalPrompt = await fetchUrlContent(prompt.trim());
        }
        if (!finalPrompt || finalPrompt.length < 50) {
          finalPrompt = prompt.trim();
        }
      } catch (_) {
        finalPrompt = prompt.trim();
      }
    }

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: "text",
          prompt:      finalPrompt,
        }),
        signal: controller.signal,
      });

      clearTimeout(tid);
      clearTimers();

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `HTTP ${res.status}`);
      }

      const text = await res.text();
      if (!text?.trim()) {
        throw new Error("n8n returned empty response — make sure workflow is Published.");
      }

      const data = JSON.parse(text);
      if (data.error) throw new Error(data.message || "Workflow error");

      const { nodes: rfNodes, edges: rfEdges } = buildGraphElements(data);

      setNodes(rfNodes);
      setEdges(rfEdges);
      setConflicts(data.meta?.conflicts || []);
      setMeta(data.meta);
      setTopic(data.topic || prompt);
      setRagInfo(data.meta?.rag || null);
      setLoading(false);
      setAgentStatus([]);

    } catch (e) {
      clearTimeout(tid);
      clearTimers();
      setError(
        e.name === "AbortError"
          ? "Timed out after 60s — try a shorter topic."
          : e.message
      );
      setLoading(false);
      setAgentStatus([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); }
  };

  const placeholders = {
    text:    "Enter any topic — Machine Learning, Climate Change...",
    url:     "Paste any URL — https://en.wikipedia.org/wiki/...",
    youtube: "Paste a YouTube URL — https://youtube.com/watch?v=...",
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-mark">◈</span>
            <span className="logo-text">MindGraph</span>
          </div>
          <span className="version-badge">v4.0 · RAG</span>
        </div>
        <div className="header-right">
          {ragInfo?.enabled && (
            <div className="rag-badge">RAG · {ragInfo.chunks_used} chunks</div>
          )}
          {meta && (
            <div className="header-stats">
              <span>{meta.node_count} nodes</span>
              <span className="dot">·</span>
              <span>{meta.edge_count} edges</span>
              {conflicts.length > 0 && (
                <>
                  <span className="dot">·</span>
                  <button
                    className="conflict-badge"
                    onClick={() => setShowConflicts(true)}
                  >
                    {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}
                  </button>
                </>
              )}
              <span className="dot">·</span>
              <button
                className="export-btn"
                onClick={() => setShowExport(true)}
              >
                Export
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="canvas-wrapper">
        {nodes.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <h2>Transform any source into a knowledge map</h2>
            <p>
              Text, URLs, or YouTube videos — 3 AI agents extract
              and structure the knowledge
            </p>
            <div className="example-pills">
              {[
                { label: "Machine Learning",  mode: "text" },
                { label: "Wikipedia: AI",     mode: "url",
                  val: "https://en.wikipedia.org/wiki/Artificial_intelligence" },
                { label: "Climate Change",    mode: "text" },
                { label: "Stoic Philosophy",  mode: "text" },
              ].map(ex => (
                <button
                  key={ex.label}
                  className="pill"
                  onClick={() => {
                    setPrompt(ex.val || ex.label);
                    setSourceMode(ex.mode);
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="agent-overlay">
            <div className="agent-progress">
              <div className="agent-title">Building your knowledge graph</div>
              {agentStatus.map(step => (
                <div
                  key={step.id}
                  className={`agent-step ${step.done ? "done" : "pending"}`}
                >
                  <span className="step-indicator">
                    {step.done ? "✓" : "○"}
                  </span>
                  <span className="step-label">{step.label}</span>
                </div>
              ))}
              {isUrlMode && (
                <div className="agent-note">
                  URL / YouTube sources may take 20–40s
                </div>
              )}
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2} maxZoom={2}
        >
          <Background color="#2a2a3e" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor={n =>
              n.data?.type === "root"   ? "#7c6ff7" :
              n.data?.type === "branch" ? "#4ecdc4" : "#a8a8c0"
            }
            maskColor="rgba(10,10,20,0.7)"
            style={{ background: "#13131f", border: "1px solid #2a2a3e" }}
          />
        </ReactFlow>

        {showConflicts && (
          <ConflictPanel
            conflicts={conflicts}
            onClose={() => setShowConflicts(false)}
          />
        )}

        {showExport && (
          <ExportPanel
            nodes={nodes}
            edges={edges}
            meta={meta}
            topic={topic}
            onClose={() => setShowExport(false)}
          />
        )}
      </div>

      <div className="input-bar">
        <div className="mode-tabs">
          {SOURCE_MODES.map(m => (
            <button
              key={m.id}
              className={`mode-tab ${sourceMode === m.id ? "active" : ""}`}
              onClick={() => setSourceMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="input-container">
          <textarea
            className="prompt-input"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[sourceMode]}
            rows={1}
            disabled={loading}
          />
          <button
            className={`generate-btn ${loading ? "loading" : ""}`}
            onClick={generate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <span className="spinner" /> : "Generate"}
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}
