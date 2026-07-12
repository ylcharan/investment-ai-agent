import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import {
  AnalysisSchema,
  DecisionSchema,
  ResearchBriefSchema,
  type AgentState,
  type AnalysisReport,
  type InvestmentDecision,
  type ResearchBrief,
} from "@/lib/types";
import {
  ANALYSIS_PROMPT,
  DECISION_PROMPT,
  RESEARCH_PROMPT,
} from "@/lib/agent/prompts";
import { createSearchTool, searchCompany } from "@/lib/agent/tools";
import {
  getGeminiModels,
  isRetryableModelError,
  withRetry,
} from "@/lib/agent/retry";

const MAX_CHARS = 8_000;

const AgentAnnotation = Annotation.Root({
  company: Annotation<string>,
  research: Annotation<ResearchBrief | null>,
  analysis: Annotation<AnalysisReport | null>,
  researchNotes: Annotation<string>,
  fundamentalsAnalysis: Annotation<string>,
  riskAssessment: Annotation<string>,
  decision: Annotation<InvestmentDecision | null>,
  currentStep: Annotation<AgentState["currentStep"]>,
  error: Annotation<string | undefined>,
});

function getModel(modelName: string) {
  const isGemini3 = modelName.startsWith("gemini-3");
  return new ChatGoogleGenerativeAI({
    model: modelName,
    ...(isGemini3 ? {} : { temperature: 0.2 }),
    apiKey: process.env.GEMINI_API_KEY,
  });
}

function fillPrompt(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

function truncate(text: string, max = MAX_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[truncated]`;
}

function formatResearchNotes(brief: ResearchBrief): string {
  return [
    brief.overview,
    "",
    `Sector: ${brief.sector}`,
    "",
    "Financials:",
    ...brief.financials.map((f) => `- ${f.label}: ${f.value} (${f.signal})`),
    "",
    `Competitive position: ${brief.competitivePosition}`,
    "",
    "Recent developments:",
    ...brief.recentDevelopments.map((d) => `- ${d}`),
    "",
    `Valuation: ${brief.valuationNote}`,
    "",
    "Related peers:",
    ...brief.relatedCompanies.map(
      (c) =>
        `- ${c.name}${c.ticker ? ` (${c.ticker})` : ""} — ${c.category}: ${c.whyRelated}`
    ),
    brief.dataGaps?.length
      ? `\nData gaps:\n${brief.dataGaps.map((g) => `- ${g}`).join("\n")}`
      : "",
  ].join("\n");
}

function formatFundamentals(analysis: AnalysisReport): string {
  const f = analysis.fundamentals;
  return [
    `Quality score: ${f.qualityScore}/10`,
    `Rating: ${f.rating}`,
    `Growth: ${f.growth}`,
    `Profitability: ${f.profitability}`,
    `Balance sheet: ${f.balanceSheet}`,
    `Moat: ${f.moat}`,
    `Management: ${f.management}`,
    "",
    "Highlights:",
    ...f.highlights.map((h) => `- [${h.signal}] ${h.point}`),
  ].join("\n");
}

function formatRisks(analysis: AnalysisReport): string {
  const r = analysis.risks;
  return [
    `Overall risk: ${r.overall}`,
    "",
    "Categories:",
    ...r.categories.map(
      (c) => `- ${c.category} (${c.severity}): ${c.detail}`
    ),
    "",
    "Top risks:",
    ...r.topRisks.map((t) => `- ${t}`),
  ].join("\n");
}

async function invokeWithModelFallback<T>(
  run: (model: ChatGoogleGenerativeAI) => Promise<T>
): Promise<T> {
  const models = getGeminiModels();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await withRetry(() => run(getModel(modelName)));
    } catch (error) {
      lastError = error;
      if (!isRetryableModelError(error)) throw error;
    }
  }

  throw lastError;
}

export async function runSearch(company: string): Promise<string> {
  const tool = createSearchTool();
  const query = `${company} stock company financial results earnings risks outlook`;
  return searchCompany(query, tool);
}

export async function runResearchBrief(
  company: string,
  searchResults: string
): Promise<ResearchBrief> {
  const prompt = fillPrompt(RESEARCH_PROMPT, {
    company,
    searchResults: truncate(searchResults),
  });

  return invokeWithModelFallback((model) =>
    model.withStructuredOutput(ResearchBriefSchema).invoke([
      new SystemMessage("Produce a structured equity research brief."),
      new HumanMessage(prompt),
    ])
  );
}

export async function runAnalysis(
  company: string,
  researchNotes: string
): Promise<AnalysisReport> {
  const prompt = fillPrompt(ANALYSIS_PROMPT, {
    company,
    researchNotes: truncate(researchNotes),
  });

  return invokeWithModelFallback((model) =>
    model.withStructuredOutput(AnalysisSchema).invoke([
      new SystemMessage("Produce structured fundamentals and risk analysis."),
      new HumanMessage(prompt),
    ])
  );
}

export async function runVerdict(
  company: string,
  researchNotes: string,
  fundamentalsAnalysis: string,
  riskAssessment: string
): Promise<InvestmentDecision> {
  const analysis = `${fundamentalsAnalysis}\n\n${riskAssessment}`;
  const prompt = fillPrompt(DECISION_PROMPT, {
    company,
    researchNotes: truncate(researchNotes, 5_000),
    analysis: truncate(analysis, 5_000),
  });

  return invokeWithModelFallback((model) =>
    model.withStructuredOutput(DecisionSchema).invoke([
      new SystemMessage("Make a clear INVEST or PASS decision."),
      new HumanMessage(prompt),
    ])
  );
}

async function researchNode(
  state: typeof AgentAnnotation.State
): Promise<Partial<typeof AgentAnnotation.State>> {
  const searchResults = await runSearch(state.company);
  const research = await runResearchBrief(state.company, searchResults);
  return {
    research,
    researchNotes: formatResearchNotes(research),
    currentStep: "analyze",
  };
}

async function analyzeNode(
  state: typeof AgentAnnotation.State
): Promise<Partial<typeof AgentAnnotation.State>> {
  const analysis = await runAnalysis(state.company, state.researchNotes);
  return {
    analysis,
    fundamentalsAnalysis: formatFundamentals(analysis),
    riskAssessment: formatRisks(analysis),
    currentStep: "verdict",
  };
}

async function verdictNode(
  state: typeof AgentAnnotation.State
): Promise<Partial<typeof AgentAnnotation.State>> {
  const decision = await runVerdict(
    state.company,
    state.researchNotes,
    state.fundamentalsAnalysis,
    state.riskAssessment
  );
  return { decision, currentStep: "complete" };
}

function buildGraph() {
  return new StateGraph(AgentAnnotation)
    .addNode("research", researchNode)
    .addNode("analyze", analyzeNode)
    .addNode("verdict", verdictNode)
    .addEdge(START, "research")
    .addEdge("research", "analyze")
    .addEdge("analyze", "verdict")
    .addEdge("verdict", END)
    .compile();
}

let compiledGraph: ReturnType<typeof buildGraph> | null = null;

function getResearchGraph() {
  if (!compiledGraph) compiledGraph = buildGraph();
  return compiledGraph;
}

function initialState(company: string): AgentState {
  return {
    company: company.trim(),
    research: null,
    analysis: null,
    researchNotes: "",
    fundamentalsAnalysis: "",
    riskAssessment: "",
    decision: null,
    currentStep: "research",
  };
}

export async function runResearch(company: string): Promise<AgentState> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }
  const result = await getResearchGraph().invoke(initialState(company));
  return result as AgentState;
}

export type StreamEvent = {
  step: string;
  state: Partial<AgentState>;
  message?: string;
};

export async function* streamResearch(
  company: string
): AsyncGenerator<StreamEvent> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }

  let state: AgentState = initialState(company);

  yield { step: "research", state, message: "Searching market data..." };
  const searchResults = await runSearch(state.company);

  yield { step: "research", state, message: "Writing research brief..." };
  const research = await runResearchBrief(state.company, searchResults);
  state = {
    ...state,
    research,
    researchNotes: formatResearchNotes(research),
    currentStep: "analyze",
  };
  yield { step: "research", state };

  yield {
    step: "analyze",
    state,
    message: "Analyzing fundamentals & risks...",
  };
  const analysis = await runAnalysis(state.company, state.researchNotes);
  state = {
    ...state,
    analysis,
    fundamentalsAnalysis: formatFundamentals(analysis),
    riskAssessment: formatRisks(analysis),
    currentStep: "verdict",
  };
  yield { step: "analyze", state };

  yield { step: "verdict", state, message: "Forming investment verdict..." };
  const decision = await runVerdict(
    state.company,
    state.researchNotes,
    state.fundamentalsAnalysis,
    state.riskAssessment
  );
  state = { ...state, decision, currentStep: "complete" };
  yield { step: "verdict", state };

  yield { step: "complete", state };
}
