import {
  answerChatQuestion,
  formatReplyAsText,
  type ChatMessage,
} from "@/lib/agent/chat";
import { formatGeminiError } from "@/lib/agent/retry";
import { ChatReplySchema, type AgentState } from "@/lib/types";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const ChatRequestSchema = z.object({
  company: z.string().trim().min(1).max(100),
  question: z.string().trim().min(1).max(1000),
  history: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  state: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid chat request.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { company, question, history, state } = parsed.data;

    const reply = await answerChatQuestion({
      company,
      question,
      history: history as ChatMessage[],
      state: state as Partial<AgentState>,
    });

    const validated = ChatReplySchema.parse(reply);

    return Response.json({
      answer: formatReplyAsText(validated),
      reply: validated,
    });
  } catch (error) {
    return Response.json(
      { error: formatGeminiError(error) },
      { status: 500 }
    );
  }
}
