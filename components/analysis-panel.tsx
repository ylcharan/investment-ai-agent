"use client";

import { useState } from "react";
import type { AgentState } from "@/lib/types";
import {
  ratingText,
  riskOverallText,
  severityBg,
  signalBg,
  signalDot,
  signalLabel,
  signalText,
} from "@/lib/ui/signals";

interface AnalysisPanelProps {
  result: Partial<AgentState>;
}

export function AnalysisPanel({ result }: AnalysisPanelProps) {
  const [openId, setOpenId] = useState<string | null>("research");
  const research = result.research;
  const analysis = result.analysis;

  const sections = [
    {
      id: "research",
      label: "Research",
      ready: Boolean(research || result.researchNotes),
    },
    {
      id: "fundamentals",
      label: "Fundamentals",
      ready: Boolean(analysis || result.fundamentalsAnalysis),
      badge: analysis?.fundamentals.rating,
      badgeClass: analysis
        ? ratingText(analysis.fundamentals.rating)
        : undefined,
    },
    {
      id: "risks",
      label: "Risks",
      ready: Boolean(analysis || result.riskAssessment),
      badge: analysis?.risks.overall,
      badgeClass: analysis
        ? riskOverallText(analysis.risks.overall)
        : undefined,
    },
  ];

  return (
    <section className="animate-fade-up border-t border-white/[0.06] pt-14">
      <h3 className="text-center text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
        Full analysis
      </h3>

      <div className="mt-8">
        {sections.map((section) => {
          const isOpen = openId === section.id;

          return (
            <div
              key={section.id}
              className="border-b border-white/[0.04] last:border-0"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : section.id)}
                className="flex w-full items-center justify-between gap-3 py-5 text-left"
              >
                <span
                  className={`text-[14px] font-medium transition-colors ${
                    isOpen ? "text-white" : "text-zinc-400"
                  }`}
                >
                  {section.label}
                </span>
                <span className="flex items-center gap-3">
                  {section.badge && (
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wide ${section.badgeClass}`}
                    >
                      {section.badge}
                    </span>
                  )}
                  <span
                    className={`text-zinc-600 transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pb-6">
                    {!section.ready ? (
                      <p className="text-[13px] text-zinc-600">
                        No data for this section.
                      </p>
                    ) : section.id === "research" ? (
                      research ? (
                        <ResearchSection research={research} />
                      ) : (
                        <FallbackText text={result.researchNotes} />
                      )
                    ) : section.id === "fundamentals" ? (
                      analysis ? (
                        <FundamentalsSection analysis={analysis} />
                      ) : (
                        <FallbackText text={result.fundamentalsAnalysis} />
                      )
                    ) : analysis ? (
                      <RisksSection analysis={analysis} />
                    ) : (
                      <FallbackText text={result.riskAssessment} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FallbackText({ text }: { text?: string }) {
  if (!text) {
    return <p className="text-[13px] text-zinc-600">No data for this section.</p>;
  }
  return (
    <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-zinc-500">
      {text}
    </p>
  );
}

function ResearchSection({
  research,
}: {
  research: NonNullable<AgentState["research"]>;
}) {
  return (
    <div className="space-y-5">
      {research.sector && (
        <p className="text-[12px] text-zinc-500">
          Sector{" "}
          <span className="font-medium text-emerald-400/90">{research.sector}</span>
        </p>
      )}

      <p className="text-[14px] leading-[1.75] text-zinc-400">
        {research.overview}
      </p>

      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          Financials
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {research.financials.map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border px-3 py-2.5 ${signalBg(item.signal)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-zinc-500">{item.label}</span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] uppercase ${signalText(item.signal)}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${signalDot(item.signal)}`}
                  />
                  {signalLabel(item.signal)}
                </span>
              </div>
              <p className={`mt-1 text-[15px] font-medium ${signalText(item.signal)}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          Competitive position
        </p>
        <p className="text-[14px] leading-relaxed text-zinc-400">
          {research.competitivePosition}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          Recent developments
        </p>
        <ul className="space-y-2">
          {research.recentDevelopments.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-[14px] leading-relaxed text-zinc-400"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          Valuation
        </p>
        <p className="text-[14px] leading-relaxed text-zinc-400">
          {research.valuationNote}
        </p>
      </div>

      {research.dataGaps && research.dataGaps.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-400/80">
            Data gaps
          </p>
          <ul className="mt-2 space-y-1.5">
            {research.dataGaps.map((gap) => (
              <li key={gap} className="text-[13px] text-amber-200/70">
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FundamentalsSection({
  analysis,
}: {
  analysis: NonNullable<AgentState["analysis"]>;
}) {
  const f = analysis.fundamentals;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-2xl font-light ${ratingText(f.rating)}`}>
          {f.qualityScore}
          <span className="text-base text-zinc-600">/10</span>
        </span>
        <span className={`text-[13px] font-medium uppercase tracking-wide ${ratingText(f.rating)}`}>
          {f.rating}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Growth", f.growth],
          ["Profitability", f.profitability],
          ["Balance sheet", f.balanceSheet],
          ["Moat", f.moat],
          ["Management", f.management],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600">
              {label}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          Highlights
        </p>
        <ul className="space-y-2">
          {f.highlights.map((item) => (
            <li
              key={item.point}
              className={`flex gap-3 rounded-lg border px-3 py-2.5 text-[14px] ${signalBg(item.signal)}`}
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${signalDot(item.signal)}`}
              />
              <span className={signalText(item.signal)}>
                <span className="mr-2 text-[10px] uppercase opacity-70">
                  {signalLabel(item.signal)}
                </span>
                <span className="text-zinc-300">{item.point}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RisksSection({
  analysis,
}: {
  analysis: NonNullable<AgentState["analysis"]>;
}) {
  const r = analysis.risks;

  return (
    <div className="space-y-5">
      <p className={`text-[15px] font-medium ${riskOverallText(r.overall)}`}>
        Overall risk: {r.overall}
      </p>

      <div className="space-y-2">
        {r.categories.map((item) => (
          <div
            key={`${item.category}-${item.detail}`}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-medium text-zinc-200">
                {item.category}
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${severityBg(item.severity)}`}
              >
                {item.severity}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-red-400">
          Top risks
        </p>
        <ul className="mt-3 space-y-2">
          {r.topRisks.map((risk) => (
            <li
              key={risk}
              className="flex gap-2 text-[14px] leading-relaxed text-red-200/80"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-400" />
              {risk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
