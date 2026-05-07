# ◈ MindGraph — AI-Powered Knowledge Graph Generator

<div align="center">

![MindGraph Banner](https://img.shields.io/badge/MindGraph-v4.0-7c6ff7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTVMMTIgMnpNMiAxN2wxMCA1IDEwLTVNMiAxMmwxMCA1IDEwLTUiLz48L3N2Zz4=)
![n8n](https://img.shields.io/badge/n8n-Agentic%20Workflows-ea4b71?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-f55036?style=for-the-badge)
![React](https://img.shields.io/badge/React-Flow-61dafb?style=for-the-badge&logo=react)
![Live](https://img.shields.io/badge/Live-mindgraph.surge.sh-4ecdc4?style=for-the-badge)

**Transform any text, URL, or YouTube video into an interactive knowledge graph — powered by a 3-agent AI pipeline.**

[🚀 Live Demo](https://mindgraph.surge.sh) · [📹 Watch Demo Video](https://youtu.be/DbseGRF2bpk) · [🏗️ Architecture](#architecture) · [⚙️ Setup](#setup)

</div>

---

## What is MindGraph?

MindGraph is an AI system that takes anything you throw at it — a topic, a webpage, a YouTube video — and turns it into a structured, interactive knowledge graph in seconds.

Under the hood, three specialized AI agents work in sequence: one extracts the key concepts, one arranges them into a hierarchy, and one labels every relationship between them. The result is a visual mind map that shows not just *what* the concepts are, but *how* they connect — whether one causes another, requires it, supports it, or contradicts it.

It's the kind of system that's genuinely useful for learning, research, and knowledge management — and it demonstrates what modern AI pipelines look like when you go beyond a single LLM call.

---

## Demo

> 📹 **[Watch the full demo video](#)** — (https://youtu.be/DbseGRF2bpk)

**What you're looking at:**
- Purple node = root concept
- Teal nodes = branches (sub-domains)
- Gray nodes = leaves (specific concepts)
- Edge colors = relationship types (contains, causes, enables, requires, supports, contradicts, opposes)
- Dashed red edges = conflicting relationships flagged by the conflict detector

---

## Features

**Three input modes**
- **Text** — type any topic and get a structured mind map instantly
- **URL** — paste any webpage URL and map its content
- **YouTube** — paste a YouTube URL, fetch the real transcript via Supadata, and map what the video actually says

**3-Agent AI pipeline**
Each generation runs three sequential LLM calls, each with a focused job:
1. Topic Decomposer — reads the input and extracts 6–15 key concepts
2. Hierarchy Builder — organizes those concepts into a parent-child tree
3. Relationship Typer — labels every edge with a semantic relationship type and a strength weight

**RAG pipeline**
When URL or YouTube input is provided, the content is chunked into 400-character segments with 80-character overlap, scored using TF-IDF keyword similarity against the query, and the top 5 most relevant chunks are injected as context into all three agent prompts. The header shows "RAG · 5 chunks" so you can see it working.

**Conflict detector**
After the agents finish, a fourth pass scans every edge pair for contradictions — for example if node A "supports" node B and also "contradicts" node B. Flagged conflicts appear as dashed red edges and are listed in the conflict report panel.

**Schema validator with retry loop**
Every agent output is validated against a strict JSON schema. If an agent returns malformed output, the system retries up to 3 times before failing gracefully.

**Export panel**
Download the generated graph as JSON (raw data), Markdown (structured outline), or PNG (visual snapshot).

**Interactive graph**
Pan, zoom, expand, collapse. Edge labels show relationship types. Node thickness indicates depth in the hierarchy. The minimap gives a bird's-eye view of large graphs.

---

## Architecture

```
User Input (text / URL / YouTube)
          │
          ▼
  ┌─────────────────┐
  │   React Frontend │  mindgraph.surge.sh
  │   (Vite + React  │
  │    Flow)         │
  └────────┬────────┘
           │ POST /webhook/generate-mindmap
           ▼
  ┌─────────────────────────────────────────┐
  │           n8n Cloud (Backend)            │
  │                                          │
  │  Webhook → Input Normalizer              │
  │       │                                  │
  │       ▼                                  │
  │  ┌─────────────────────────────────┐    │
  │  │     RAG + 3-Agent Chain          │    │
  │  │                                  │    │
  │  │  1. Chunk + TF-IDF retrieval     │    │
  │  │  2. Agent 1: Topic Decomposer    │◄──►│ Groq API
  │  │  3. Agent 2: Hierarchy Builder   │    │ (Llama 3.3 70B)
  │  │  4. Agent 3: Relationship Typer  │    │
  │  │  5. Conflict Detector            │    │
  │  └──────────────┬──────────────────┘    │
  │                 │                         │
  │       Schema Validator                    │
  │                 │                         │
  │    Success Response / Error Response      │
  └─────────────────────────────────────────┘
           │
           ▼
  Structured JSON → React Flow renders graph
```

### Why 3 agents instead of 1?

A single LLM call doing everything produces shallow, generic output — the model tries to optimize for all three tasks at once and does none of them well.

By separating the concerns:
- Agent 1 focuses entirely on *what* the concepts are — it produces richer, more accurate concept lists
- Agent 2 focuses entirely on *structure* — it produces deeper, more meaningful hierarchies
- Agent 3 focuses entirely on *relationships* — it produces more varied, semantically accurate edge types

This is analogous to how NLQ-to-SQL systems decompose a natural language question into structured query steps rather than asking a single model to produce SQL directly.

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Graph rendering | React Flow |
| Workflow automation | n8n (agentic pipeline) |
| LLM | Groq — Llama 3.3 70B Versatile |
| YouTube transcripts | Supadata API |
| Deployment — Frontend | Surge.sh |
| Deployment — Backend | n8n Cloud |

---

## Project Structure

```
mindmap-frontend/
│
├── src/
│   ├── App.jsx                  # Main app — input handling, fetch, state
│   ├── index.css                # Global styles (dark theme)
│   ├── main.jsx                 # React entry point
│   │
│   ├── components/
│   │   ├── MindMapNode.jsx      # Custom React Flow node (root/branch/leaf)
│   │   ├── ConflictPanel.jsx    # Conflict report modal
│   │   └── ExportPanel.jsx      # JSON / Markdown / PNG export
│   │
│   └── utils/
│       └── graphBuilder.js      # Converts n8n JSON → React Flow nodes/edges
│
├── n8n_workflows/
│   └── n8n_workflow_phase4.json # Import this into n8n
│
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Setup

### Prerequisites

- Node.js 18+
- n8n account (free trial at n8n.io)
- Groq API key (free at console.groq.com)
- Supadata API key (free at supadata.ai) — for YouTube transcripts

### 1 — Clone the repo

```bash
git clone https://github.com/dp12806/mindgraph.git
cd mindgraph
npm install
```

### 2 — Set up n8n backend

1. Go to [n8n.io](https://n8n.io) → create account
2. Import `n8n_workflows/n8n_workflow_phase4.json`
3. Open the **RAG + 3-Agent Chain** node
4. Replace `REPLACE_WITH_YOUR_GROQ_API_KEY` with your Groq key
5. Click **Publish** → copy the production webhook URL:
   ```
   https://YOUR_INSTANCE.app.n8n.cloud/webhook/generate-mindmap
   ```

### 3 — Configure frontend

Open `src/App.jsx` and update lines 7–8:

```javascript
const N8N_WEBHOOK_URL = "https://YOUR_INSTANCE.app.n8n.cloud/webhook/generate-mindmap";
const SUPADATA_API_KEY = "your_supadata_key_here";
```

### 4 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5 — Deploy

```bash
npm run build
npm install -g surge
surge dist your-project-name.surge.sh
```

---

## How to test

**Text mode**
Type any topic — "Machine Learning", "Climate Change", "Stoic Philosophy" — and click Generate.

**URL mode**
Paste any public URL:
```
https://en.wikipedia.org/wiki/Artificial_intelligence
```

**YouTube mode**
Paste any YouTube URL:
```
https://youtu.be/DbseGRF2bpk
```

**Export**
After generating any map, click **Export** in the header to download as JSON, Markdown, or PNG.

---

## n8n Workflow Explained

The entire backend logic lives in one n8n workflow with 5 nodes:

| Node | Type | What it does |
|---|---|---|
| Webhook | Trigger | Receives POST requests from the frontend |
| Input Normalizer | Set | Extracts prompt, source_type from request body |
| RAG + 3-Agent Chain | Code | Runs the full pipeline — RAG + 3 agents + conflict detector |
| Schema Validator | Code | Validates output JSON structure and semantic integrity |
| Success / Error Response | Respond to Webhook | Returns JSON to frontend with CORS headers |

The RAG + 3-Agent Chain node is ~300 lines of JavaScript running inside n8n. It makes 3 sequential calls to the Groq API, each building on the previous agent's output.

---

## JSON Output Format

Every generation returns a structured JSON object:

```json
{
  "topic": "Machine Learning",
  "nodes": [
    { "id": "machine_learning", "label": "Machine Learning", "type": "root", "depth": 0 },
    { "id": "supervised_learning", "label": "Supervised Learning", "type": "branch", "depth": 1 },
    { "id": "classification", "label": "Classification", "type": "leaf", "depth": 2 }
  ],
  "edges": [
    { "from": "machine_learning", "to": "supervised_learning", "relation": "contains", "weight": 0.9 },
    { "from": "supervised_learning", "to": "classification", "relation": "contains", "weight": 0.8 }
  ],
  "meta": {
    "source_type": "text",
    "agent_version": "v4.0",
    "pipeline": "rag-3-agent-chain",
    "node_count": 11,
    "edge_count": 16,
    "conflict_count": 0,
    "conflicts": [],
    "rag": {
      "enabled": false,
      "chunks_used": 0,
      "context_len": 0
    }
  }
}
```

---

## Edge Relationship Types

| Relation | Color | Meaning |
|---|---|---|
| `contains` | Teal | Parent includes child as a category or component |
| `causes` | Orange | A directly leads to B |
| `enables` | Purple | A makes B possible without guaranteeing it |
| `requires` | Yellow | B cannot exist without A |
| `supports` | Green | A provides evidence or backing for B |
| `contradicts` | Red (dashed) | A and B are in conceptual tension |
| `opposes` | Red (dashed) | A actively works against B |

---

## What I learned building this

Building MindGraph taught me a few things that aren't obvious from tutorials:

**Prompt engineering for structured output is harder than it looks.** Getting an LLM to reliably return valid JSON with a specific schema requires strict system prompts, output cleaning (stripping markdown fences), regex-based JSON extraction, and retry logic. A single prompt that "usually works" isn't good enough for a production system.

**Multi-agent decomposition genuinely improves output quality.** When I ran a single prompt trying to extract concepts, build hierarchy, and type relationships simultaneously, the output was flat and generic. Splitting into three focused agents produced noticeably richer, more accurate graphs.

**n8n is a serious tool for AI pipelines.** The visual workflow editor makes it easy to reason about data flow, and the Code node gives you full JavaScript when you need custom logic. It's not just a no-code toy.

**CORS is still annoying in 2026.** Even with proper headers set in the response node, there are edge cases with proxies, preflight requests, and n8n cloud's behavior that require careful handling.

---

## Roadmap

- [ ] Server-side URL content extraction (proper HTML parsing)
- [ ] Real-time streaming — nodes appear as agents respond
- [ ] Graph persistence — save and reload previous maps
- [ ] Multi-document RAG — upload multiple PDFs and map across them
- [ ] Neo4j export — push graph to a real graph database
- [ ] Collaborative editing — share and annotate maps with others

---

## License

MIT — use it however you want.

---

<div align="center">

Built with curiosity and too many n8n retries.

**[Live Demo](https://mindgraph.surge.sh)** · **[LinkedIn](https://linkedin.com/in/drashti-padhiyar)**

</div>
