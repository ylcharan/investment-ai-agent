import { runResearch, streamResearch } from "@/lib/agent/graph";
import { formatGeminiError } from "@/lib/agent/retry";
import type { AgentState } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function validateCompany(company: unknown): string | null {
  if (typeof company !== "string") return null;
  const trimmed = company.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return null;
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const company = validateCompany(body.company);
    const stream = body.stream === true;

    if (!company) {
      return Response.json(
        { error: "Please provide a valid company name (1-100 characters)." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const send = (payload: Record<string, unknown>) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            );
          };

          try {
            for await (const event of streamResearch(company)) {
              if (event.message) {
                send({ type: "status", step: event.step, message: event.message });
              }
              send({
                type: "update",
                step: event.step,
                state: event.state,
              });
            }
            send({ type: "done" });
          } catch (error) {
            send({ type: "error", message: formatGeminiError(error) });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const result: AgentState = await runResearch(company);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: formatGeminiError(error) },
      { status: 500 }
    );
  }
}
