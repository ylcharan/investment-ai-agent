"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentState, ChatReply } from "@/lib/types";
import type { ChatMessage } from "@/lib/agent/chat";
import { signalBg, signalDot, signalLabel, signalText } from "@/lib/ui/signals";

interface ResearchChatProps {
  company: string;
  state: Partial<AgentState>;
}

const SUGGESTIONS = [
  "Why this verdict?",
  "What are the biggest risks?",
  "Explain the 3Y return outlook",
  "How do peers compare?",
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ResearchChat({ company, state }: ResearchChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, [company]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          question: trimmed,
          history: nextHistory.map(({ id, role, content }) => ({
            id,
            role,
            content,
          })),
          state: {
            researchNotes: state.researchNotes,
            fundamentalsAnalysis: state.fundamentalsAnalysis,
            riskAssessment: state.riskAssessment,
            decision: state.decision,
            research: state.research,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Chat request failed");
      }

      const reply = data.reply as ChatReply | undefined;

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: String(data.answer ?? reply?.answer ?? ""),
          reply,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="animate-fade-up">
      <div className="liquid-glass rounded-3xl">
        <div className="relative z-10 border-b border-white/10 px-4 py-3 sm:px-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-400">
            Ask about this research
          </p>
          <p className="mt-1 text-[12px] text-zinc-500">
            Follow-up chat grounded in the {company} analysis
          </p>
        </div>

        <div className="relative z-10 max-h-[480px] space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.length === 0 && !loading && (
            <div className="space-y-4">
              <p className="text-center text-[13px] text-zinc-400">
                Ask anything about the verdict, risks, returns, or peers.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendQuestion(suggestion)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] text-zinc-300 backdrop-blur-md transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[94%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed sm:max-w-[85%] ${
                  message.role === "user"
                    ? "liquid-glass-user text-zinc-900"
                    : "liquid-glass-bubble text-zinc-100"
                }`}
              >
                <p className="relative z-10 mb-1 text-[10px] uppercase tracking-[0.18em] opacity-50">
                  {message.role === "user" ? "You" : "Analyst"}
                </p>

                {message.role === "assistant" && message.reply ? (
                  <StructuredReply
                    reply={message.reply}
                    onFollowUp={sendQuestion}
                    disabled={loading}
                  />
                ) : (
                  <p className="relative z-10 whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="liquid-glass-bubble rounded-2xl px-4 py-3 text-[13px] text-zinc-300">
                <span className="relative z-10 inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-emerald-300" />
                  Thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="relative z-10 border-t border-red-400/20 bg-red-500/10 px-4 py-2 text-[12px] text-red-200 backdrop-blur-md">
            {error}
          </p>
        )}

        <form
          className="relative z-10 flex items-center gap-2 border-t border-white/10 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
            placeholder={`Ask about ${company}…`}
            className="liquid-glass-input min-w-0 flex-1 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-zinc-500 focus:border-white/25 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-xl border border-white/30 bg-white/90 px-4 py-2.5 text-[12px] font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

function StructuredReply({
  reply,
  onFollowUp,
  disabled,
}: {
  reply: ChatReply;
  onFollowUp: (question: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="relative z-10 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${signalBg(reply.tone)} ${signalText(reply.tone)}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${signalDot(reply.tone)}`}
          />
          {signalLabel(reply.tone)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-400">
          {reply.confidence}% confidence
        </span>
      </div>

      <p className="whitespace-pre-wrap text-zinc-100">{reply.answer}</p>

      <ul className="space-y-1.5">
        {reply.keyPoints.map((point) => (
          <li
            key={point}
            className="flex gap-2 text-[13px] leading-relaxed text-zinc-300"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${signalDot(reply.tone)}`}
            />
            {point}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5">
        {reply.citations.map((citation) => (
          <span
            key={citation}
            className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500"
          >
            {citation}
          </span>
        ))}
      </div>

      {reply.caveats && reply.caveats.length > 0 && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300">
            Caveats
          </p>
          <ul className="mt-1.5 space-y-1">
            {reply.caveats.map((caveat) => (
              <li key={caveat} className="text-[12px] text-amber-100/80">
                {caveat}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reply.followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {reply.followUps.map((followUp) => (
            <button
              key={followUp}
              type="button"
              disabled={disabled}
              onClick={() => onFollowUp(followUp)}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-200 disabled:opacity-40"
            >
              {followUp}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
