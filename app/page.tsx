"use client";

import { useState } from "react";
import type { AgentState, InvestmentDecision } from "@/lib/types";
import { CompanyForm } from "@/components/company-form";
import { ResearchProgress } from "@/components/research-progress";
import { DecisionCard } from "@/components/decision-card";
import { AnalysisPanel } from "@/components/analysis-panel";
import { RelatedCompanies } from "@/components/related-companies";
import { ResearchChat } from "@/components/research-chat";

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
  const isActive = loading || hasResults || Boolean(currentStep);
  const showProgress = loading || (currentStep && !hasResults);
  const relatedCompanies = result?.research?.relatedCompanies ?? [];
  const sector = result?.research?.sector;
  const showPeers = relatedCompanies.length > 0;

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
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-white/2 blur-[100px]" />
      </div>

      <div
        className={`relative mx-auto flex min-h-full w-full flex-col px-5 sm:px-8 ${
          isActive ? "py-6 sm:py-8" : "py-16 sm:py-24"
        } ${hasResults && showPeers ? "max-w-6xl" : "max-w-3xl"}`}
      >
        {isActive ? (
          <div className="sticky top-0 z-20 -mx-5 mb-8 border-b border-white/[0.06] bg-[#050505]/90 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  if (loading) return;
                  setCompany("");
                  setResult(null);
                  setCurrentStep(null);
                  setError(null);
                  setStatusMessage(null);
                  setElapsedMs(null);
                }}
                className="text-left text-[13px] font-medium tracking-tight text-zinc-400 transition hover:text-white"
              >
                Investment Research
              </button>
              <div className="w-full sm:max-w-md">
                <CompanyForm
                  onSubmit={handleResearch}
                  loading={loading}
                  compact
                  defaultValue={company}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        {showProgress && (
          <div className={showPeers ? "mx-auto w-full max-w-3xl" : ""}>
            <ResearchProgress
              currentStep={currentStep}
              stepLabels={STEP_LABELS}
              statusMessage={statusMessage}
              loading={loading}
            />
          </div>
        )}

        {error && (
          <p className="mt-8 text-center text-sm text-red-400/90">{error}</p>
        )}

        {hasResults && result?.decision && (
          <div
            className={`${showProgress ? "mt-10" : "mt-2"} ${
              showPeers
                ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start xl:grid-cols-[minmax(0,1fr)_300px]"
                : ""
            }`}
          >
            <div className="min-w-0 space-y-16">
              <ResearchChat company={company} state={result} />
              <DecisionCard
                company={company}
                decision={result.decision as InvestmentDecision}
                elapsedMs={elapsedMs}
              />
              <AnalysisPanel result={result} />
            </div>

            {showPeers && (
              <RelatedCompanies
                sector={sector}
                companies={relatedCompanies}
                onSelect={handleResearch}
                loading={loading}
              />
            )}
          </div>
        )}

        {!hasResults && showPeers && (
          <div className="mx-auto mt-10 w-full max-w-md">
            <RelatedCompanies
              sector={sector}
              companies={relatedCompanies}
              onSelect={handleResearch}
              loading={loading}
            />
          </div>
        )}

        {!isActive && !error && (
          <p className="mt-20 text-center text-[13px] text-zinc-600">
            Research · Analysis · Verdict
          </p>
        )}
      </div>
    </div>
  );
}
