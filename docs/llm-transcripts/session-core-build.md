# LLM Build Transcripts (Bonus)

This folder documents the AI-assisted build process for the Investment Research Agent assignment.

> **Reviewer note:** The project was built in Cursor with an AI coding agent. Sessions covered architecture, LangGraph, Gemini migration, rate-limit / stuck fixes, and UI polish. Below is a condensed transcript of the main build conversation reflecting decisions and debugging — not every token, but the thought process.

---

## Session: Core build & iteration

**Tools used:** Cursor agent · LangChain/LangGraph.js · Google Gemini · Tavily · Next.js 16

### 1. Briefing & scope

**Human:** Shared the Jenova-style AI investment agent article + InsideIIM × Altuni take-home brief: build an agent that takes a company name, researches, and decides invest/pass with reasoning. Stack: Next.js + LangChain/LangGraph. README sections required. LLM transcripts = bonus.

**Agent approach:**
- Scaffold on existing Next.js app
- LangGraph linear pipeline (research → fundamentals → risks → decision)
- Tavily for live finance search
- Zod structured verdict
- SSE streaming UI
- Full README with required sections

**Why:** Separating stages mirrors how analysts work and makes the demo auditable.

---

### 2. OpenAI → Gemini

**Human:** “make it gemini api”

**Change:** Replaced `@langchain/openai` / `ChatOpenAI` with `@langchain/google-genai` / `ChatGoogleGenerativeAI`. Env: `GEMINI_API_KEY`, `GEMINI_MODEL`.

**Why:** User preference / free-tier access for the assignment.

---

### 3. UI cleanup

**Human:** Remove tiles; make UI clean and modern.

**Change:** Removed feature-card grid and metric tiles. Editorial dark layout, glass search bar, accordion analysis, minimal progress line.

**Human:** Remove “InsideIIM × Altuni AI Labs” branding from the page.

**Change:** Removed eyebrow; kept product title only.

---

### 4. Dev cache crash

**Error:** `@swc/helpers` module not found → 500 on `/`.

**Fix:** Stopped `next dev`, deleted corrupted `.next`, rebuilt. Classic Turbopack stale-cache issue.

---

### 5. LangGraph naming bug

**Error:** `decision is already being used as a state attribute … cannot also be used as a node name.`

**Fix:** Renamed graph node `decision` → `verdict`. Kept state field `decision` for the structured output object.

**Learning:** In LangGraph, node names and state channels must not collide.

---

### 6. Gemini quota / model churn

**Errors:**
- `429` free-tier quota on `gemini-2.0-flash`
- `404` `gemini-2.5-flash` “no longer available to new users”

**Fixes:**
- Default to `gemini-3.5-flash` with fallback `gemini-3.1-flash-lite`
- Retry + backoff on rate limits
- Friendlier error messages in the API/UI
- Truncate context to reduce tokens

---

### 7. “Stuck” at 13% research

**Symptom:** UI frozen on “Gathering market intelligence”; server logs showed research taking **minutes to 13+ minutes**.

**Root cause:** Aggressive retries across multiple models + delays + 4 sequential LLM calls → felt hung; SSE only updated after full nodes finished.

**Fixes:**
- Cut pipeline to **research → analyze → verdict** (fundamentals+risks in one analyze call)
- 60s LLM timeout, 15s search timeout, max 1 retry
- Stream **status messages** (`Searching…`, `Writing brief…`, etc.)
- Faster, clearer failure instead of silent multi-minute retry storms

---

### 8. Elapsed time

**Human:** Show how long generation took.

**Change:** Client `performance.now()` around the stream; DecisionCard shows `generated in 24.3s` (or `Xm Ys`).

---

### 9. Submission README

**Human:** Create README with all required sections + what makes it unique; include transcript bonus.

**Change:** Rewrote README (Overview, How to run, How it works, Decisions/trade-offs, Example runs, Improvements, Bonus transcripts, zip checklist) and this file.

---

## Design principles that emerged

1. **Show the work** — streaming + expandable analysis beats a black-box answer.
2. **Structure the decision** — Zod schema makes INVEST/PASS demos consistent.
3. **Fail loud, fail fast** — timeouts > infinite retries on free-tier APIs.
4. **Ship the assignment stack** — Next.js + LangGraph + Gemini + Tavily, no extras that dilute the story.
5. **Advise, don’t trade** — verdict is research output, not execution.

---

## How to add more raw logs

If you export additional Cursor chats:

```
docs/llm-transcripts/
  session-core-build.md          ← this file
  cursor-export-raw.md           ← optional full paste
```

Keep secrets out of transcripts (API keys, `.env.local`).
