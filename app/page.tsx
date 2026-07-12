"use client";

import { useState } from "react";
import type { AgentState, InvestmentDecision } from "@/lib/types";
import { CompanyForm } from "@/components/company-form";
import { ResearchProgress } from "@/components/research-progress";
import { DecisionCard } from "@/components/decision-card";
import { AnalysisPanel } from "@/components/analysis-panel";

const STEP_LABELS: Record<string, string> = {
  research: "Gathering market intelligence",
  analyze: "Analyzing fundamentals & risks",
  verdict: "Forming investment verdict",
  complete: "Research complete",
};

export default function Home() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [result, setResult] = useState<Partial<AgentState> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const hasResults = Boolean(result?.decision);
  const showProgress = loading || (currentStep && !hasResults);

  async function handleResearch(companyName: string) {
    setCompany(companyName);
    setLoading(true);
    setError(null);
    setResult(null);
    setStatusMessage(null);
    setElapsedMs(null);
    setCurrentStep("research");

    const startedAt = performance.now();

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: companyName, stream: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Research request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === "error") {
            throw new Error(payload.message);
          }

          if (payload.type === "status") {
            setCurrentStep(payload.step);
            setStatusMessage(payload.message);
          }

          if (payload.type === "update") {
            setCurrentStep(payload.step);
            setResult(payload.state);
          }
        }
      }

      setElapsedMs(Math.round(performance.now() - startedAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setCurrentStep((step) => step ?? "complete");
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#050505] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-white/[0.02] blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 py-16 sm:px-8 sm:py-24">
        <header className="animate-fade-up text-center">
          <h1 className="text-[2.5rem] font-light leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl">
            Investment Research
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-zinc-500">
            Enter a company. Get a clear invest or pass verdict with full
            reasoning.
          </p>
        </header>

        <div className="animate-fade-up-delay mt-12 sm:mt-16">
          <CompanyForm onSubmit={handleResearch} loading={loading} />
        </div>

        {showProgress && (
          <ResearchProgress
            currentStep={currentStep}
            stepLabels={STEP_LABELS}
            statusMessage={statusMessage}
            loading={loading}
          />
        )}

        {error && (
          <p className="mt-8 text-center text-sm text-red-400/90">{error}</p>
        )}

        {hasResults && result?.decision && (
          <div className="mt-16 space-y-16 sm:mt-20">
            <DecisionCard
              company={company}
              decision={result.decision as InvestmentDecision}
              elapsedMs={elapsedMs}
            />
            <AnalysisPanel result={result} />
          </div>
        )}

        {!loading && !result && !error && (
          <p className="mt-20 text-center text-[13px] text-zinc-600">
            Research · Analysis · Verdict
          </p>
        )}
      </div>
    </div>
  );
}
