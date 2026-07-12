import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { ChatReplySchema, type AgentState, type ChatReply } from "@/lib/types";
import {
  formatGeminiError,
  getGeminiModels,
  isRetryableModelError,
  withRetry,
} from "@/lib/agent/retry";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  reply?: ChatReply;
}

function getModel(modelName: string) {
  const isGemini3 = modelName.startsWith("gemini-3");
  return new ChatGoogleGenerativeAI({
    model: modelName,
    ...(isGemini3 ? {} : { temperature: 0.3 }),
    apiKey: process.env.GEMINI_API_KEY,
  });
}

function buildContext(company: string, state: Partial<AgentState>): string {
  const parts = [
    `Company: ${company}`,
    state.researchNotes ? `\n## Research\n${state.researchNotes}` : "",
    state.fundamentalsAnalysis
      ? `\n## Fundamentals\n${state.fundamentalsAnalysis}`
      : "",
    state.riskAssessment ? `\n## Risks\n${state.riskAssessment}` : "",
  ];

  if (state.decision) {
    const d = state.decision;
    parts.push(
      `\n## Verdict\n${d.verdict} (${d.confidence}% confidence, ${d.riskLevel} risk, ${d.timeHorizon})`,
      `Summary: ${d.summary}`,
      `Bull: ${d.bullCase.join("; ")}`,
      `Bear: ${d.bearCase.join("; ")}`,
      `Reasoning: ${d.reasoning}`
    );
    if (d.futureReturns) {
      parts.push(
        `Future returns outlook: ${d.futureReturns.outlook}`,
        ...d.futureReturns.scenarios.map(
          (s) =>
            `${s.horizon}: ${s.expectedReturn} (${s.conviction}) — ${s.thesis}`
        ),
        `Upside: ${d.futureReturns.upsideCase}`,
        `Downside: ${d.futureReturns.downsideCase}`
      );
    }
  }

  const text = parts.filter(Boolean).join("\n");
  return text.length > 12_000 ? `${text.slice(0, 12_000)}\n\n[truncated]` : text;
}

function formatReplyAsText(reply: ChatReply): string {
  const points = reply.keyPoints.map((point) => `• ${point}`).join("\n");
  const caveats =
    reply.caveats && reply.caveats.length > 0
      ? `\n\nCaveats:\n${reply.caveats.map((c) => `• ${c}`).join("\n")}`
      : "";
  return `${reply.answer}\n\n${points}${caveats}`;
}

const SYSTEM_PROMPT = `You are an investment research assistant chatting about a completed company analysis.

Return a structured response that matches the schema.
Rules:
- Answer using the provided research context when possible.
- If something is not in the context, lower confidence and add caveats.
- Be concise, direct, and professional.
- This is advisory research, not personalized financial advice.
- Set tone to positive / neutral / negative based on investment implication.
- citations must reflect which context sections you used.
- followUps should be short useful next questions.`;

export async function answerChatQuestion(input: {
  company: string;
  question: string;
  history: ChatMessage[];
  state: Partial<AgentState>;
}): Promise<ChatReply> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }

  const context = buildContext(input.company, input.state);

  const prior = input.history.filter(
    (message, index, arr) =>
      !(
        index === arr.length - 1 &&
        message.role === "user" &&
        message.content === input.question
      )
  );

  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(`Research context for ${input.company}:\n\n${context}`),
    new AIMessage(
      "I have the research context. Ask any follow-up about the analysis, verdict, risks, returns, or peers."
    ),
    ...prior.slice(-8).map((message) =>
      message.role === "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content)
    ),
    new HumanMessage(input.question),
  ];

  const models = getGeminiModels();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const reply = await withRetry(() =>
        getModel(modelName).withStructuredOutput(ChatReplySchema).invoke(messages)
      );
      return ChatReplySchema.parse(reply);
    } catch (error) {
      lastError = error;
      if (!isRetryableModelError(error)) {
        throw new Error(formatGeminiError(error));
      }
    }
  }

  throw new Error(formatGeminiError(lastError));
}

export { formatReplyAsText };
