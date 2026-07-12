# AI Investment Research Agent

**InsideIIM × Altuni AI Labs — Take-Home Assignment**

An AI agent that takes a company name, researches it live, and returns a clear **INVEST** or **PASS** verdict — with confidence, bull/bear cases, key metrics, and full reasoning you can audit.

> **Not another chatbot wrapper.** This is a multi-stage research pipeline with live web search, structured decisions, streaming progress, and production-minded failure handling (timeouts, model fallback, rate-limit retries).

---

## Overview

Enter a company (e.g. Apple, Tesla, TCS, Reliance). The agent:

1. **Searches** live market data, news, and competitive context (Tavily)
2. **Synthesizes** a research brief
3. **Analyzes** fundamentals and risks in one combined pass
4. **Decides** INVEST or PASS with a Zod-validated structured verdict

You see each stage stream in real time, plus how long the full run took.

### What makes this unique

| Differentiator | Why it matters |
|----------------|----------------|
| **LangGraph multi-node pipeline** | Research → Analyze → Verdict — not one mega-prompt. Each stage has a job, like a real equity desk. |
| **Structured CIO decision** | Zod schema forces `verdict`, `confidence`, `bullCase`, `bearCase`, `keyMetrics`, `riskLevel`, `timeHorizon` — no free-form waffle. |
| **Live SSE streaming** | Progress updates as the agent works (search → brief → analysis → verdict), not a frozen spinner. |
| **Resilient Gemini stack** | Model fallback (`gemini-3.5-flash` → `gemini-3.1-flash-lite`), retries on 429s, 60s timeouts — built after hitting real free-tier limits. |
| **Graceful search degradation** | Without Tavily (or on timeout), the agent continues on LLM knowledge and *explicitly flags* the data gap. |
| **Audit trail UI** | Verdict up front; Research / Fundamentals / Risks expandable underneath so reviewers can inspect how the call was made. |
| **Generation timer** | Shows elapsed time (e.g. `generated in 24.3s`) — transparency on cost/latency. |
| **Editorial, not dashboard UI** | Minimal dark interface focused on the decision, not a wall of tiles. |

---

## How to Run

### Prerequisites

- **Node.js 18+**
- **[Google Gemini API key](https://aistudio.google.com/apikey)** — required
- **[Tavily API key](https://tavily.com)** — optional but strongly recommended for live research

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure env
cp .env.example .env.local
```

Edit `.env.local`:

```bash
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash          # optional
TAVILY_API_KEY=tvly-your-tavily-key    # optional but recommended
```

```bash
# 3. Start
npm run dev
```

Open **http://localhost:3000** → enter a company → **Analyze**.

### Production

```bash
npm run build
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | **Yes** | Google AI Studio / Gemini API key |
| `GEMINI_MODEL` | No | Default `gemini-3.5-flash`; falls back to `gemini-3.1-flash-lite` |
| `TAVILY_API_KEY` | No | Live finance web search; without it, agent uses model knowledge + notes the gap |

---

## How It Works

### Approach

I modeled the agent after how a small research desk works — not how a chatbot answers a question:

1. **Gather evidence** (search + brief)
2. **Form a view** (fundamentals + risks)
3. **Make a call** (structured INVEST/PASS)

That separation keeps prompts focused, makes failures isolatable, and lets the UI show *where* the agent is — which matters for trust.

### Architecture

```
Browser (Next.js)
    │  POST /api/research { company, stream: true }
    ▼
API Route (SSE)
    │  streams status + state updates
    ▼
Agent pipeline (LangGraph + sequential stream helpers)
    │
    ├─ research  → Tavily search → research brief (Gemini)
    ├─ analyze   → fundamentals + risks in one LLM call
    └─ verdict   → Zod-structured INVEST | PASS (Gemini)
```

### Pipeline stages

| Stage | What happens |
|-------|----------------|
| `research` | One finance-topic Tavily query → Gemini synthesizes a concise research brief |
| `analyze` | Single prompt producing **Fundamentals** and **Risks** sections (split for the UI) |
| `verdict` | `withStructuredOutput(DecisionSchema)` → forced INVEST/PASS with confidence, cases, metrics |

Originally I used four LLM nodes (research / fundamentals / risks / decision). That burned free-tier quota and felt “stuck” on the UI. I **collapsed fundamentals + risks into one analyze pass** to cut Gemini calls from ~4 to ~3 while keeping the same audit surface.

### Tech stack (assignment stack)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js App Router API (`/api/research`) |
| Agent | LangGraph.js + LangChain.js |
| LLM | Google Gemini (`@langchain/google-genai`) |
| Search | Tavily (`@langchain/tavily`, finance topic) |
| Schema | Zod decision object |

### Project layout

```
app/
  page.tsx                 # UI: form, progress, results, elapsed time
  api/research/route.ts    # SSE + non-stream research endpoint
lib/
  types.ts                 # AgentState + DecisionSchema
  agent/
    graph.ts               # Pipeline, streaming generator
    prompts.ts             # Research / analysis / decision prompts
    tools.ts               # Tavily search + timeout
    retry.ts               # Timeout, retry, model fallback, error formatting
components/
  company-form.tsx
  research-progress.tsx
  decision-card.tsx        # Verdict + generation time
  analysis-panel.tsx       # Expandable research / fundamentals / risks
docs/
  example-runs.md          # Sample company outputs
  llm-transcripts/         # Build chat logs (bonus)
```

---

## Key Decisions & Trade-offs

### What I chose (and why)

1. **LangGraph + explicit stages over one prompt**  
   Better reasoning quality, clearer debugging, and a UI that can show progress. Reviewers can see *how* the agent thought, not just the final sentence.

2. **Zod structured output for the verdict**  
   Assignment asks for invest/pass *with reasoning*. Structured fields make that consistent and demo-friendly — confidence, bull/bear, metrics every time.

3. **Gemini over OpenAI**  
   Easy free-tier access for the assignment; switched after building; then hardened for real 429/404 model churn (`gemini-2.0` / `2.5` → `3.5` / `3.1-flash-lite`).

4. **Collapse analyze into one LLM call**  
   Trade: slightly less “role separation” inside analysis. Gain: fewer rate limits, faster runs, less “stuck at 13%” while retries burn minutes.

5. **SSE streaming + status messages**  
   Users (and reviewers) see `Searching…` / `Writing brief…` / `Forming verdict…` instead of a dead spinner.

6. **Timeouts everywhere**  
   15s search, 60s LLM — prefer a clear error over a 13-minute hang (which we hit once during free-tier storms).

7. **Advise, don’t execute**  
   No brokerage APIs. The product is research + judgment, not autonomous trading.

### What I left out

| Left out | Reason |
|----------|--------|
| Technical charts / price series | Scope = fundamental research + decision |
| User accounts / memory | Single-session keeps demo simple |
| Peer comparison in one run | High value, but more tokens + latency |
| PDF export | Nice-to-have after the core loop works |
| Paid market-data terminals | Tavily + Gemini is enough to prove the agent |

### Ambiguity calls (noted for reviewers)

- **Company name, not ticker required** — agent resolves “Apple”, “TCS”, “Reliance Industries”.
- **Non-listed / unclear entities → PASS** — prompts instruct the CIO to pass when data is insufficient or the company isn’t investable as a public equity.
- **Verdict is advisory** — not financial advice; human oversight assumed.

---

## Example Runs

Full narrative samples: **[docs/example-runs.md](./docs/example-runs.md)**.

| Company | Typical call | Why |
|---------|--------------|-----|
| **Apple** | INVEST (high confidence) | Ecosystem moat, services growth, cash generation; premium valuation noted |
| **Tesla** | PASS or cautious INVEST | Growth vs. margin compression, competition, narrative valuation |
| **Reliance Industries** | INVEST (medium confidence) | India digital/retail + energy scale; conglomerate complexity |

*Live runs vary with market news and model sampling. Re-run in the UI to reproduce.*

**Try these yourself after setup:** `Apple`, `Tesla`, `NVIDIA`, `Reliance`, `Infosys`, `TCS`.

---

## What I Would Improve With More Time

1. **Deploy on Vercel** with env vars for a shareable demo link (bonus)
2. **Structured fundamentals feed** (Yahoo Finance / Alpha Vantage) for numeric P/E, revenue, margins — less scrape noise
3. **Peer set comparison** in the same graph (company vs 2–3 peers)
4. **Eval harness** — golden companies + expected verdict ranges to catch prompt regressions
5. **Human-in-the-loop** — challenge the verdict with a follow-up question before locking
6. **Session cache** — don’t re-research the same company within N minutes
7. **PDF / Markdown report export** for sharing
8. **Per-node model routing** — long-context model for filings, flash for verdict

---

## BONUS — LLM build transcripts

This project was built with **Cursor + AI pair programming** (architecture, LangGraph design, Gemini migration, quota/stuck debugging, UI polish).

Transcripts and build notes:

- **[docs/llm-transcripts/](./docs/llm-transcripts/)** — session logs and process notes for reviewers

Including them shows the real path: Next.js scaffold → LangGraph agent → OpenAI → Gemini → rate limits → model deprecations → pipeline simplification → clean UI → elapsed timer.

---

## Zip submission checklist

Before zipping:

```bash
# Do NOT include secrets or junk
# Exclude: node_modules, .next, .env.local, .git (optional)

zip -r investment-research-agent.zip . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".env.local" \
  -x ".git/*" \
  -x "*.DS_Store"
```

Include:

- [x] Source code
- [x] `README.md` (this file — all required sections)
- [x] `.env.example` (keys documented, no secrets)
- [x] `docs/example-runs.md`
- [x] `docs/llm-transcripts/` (bonus)

---

Built for **InsideIIM × Altuni AI Labs** — AI Product Development Engineer (Intern) take-home.
# investment-ai-agent
