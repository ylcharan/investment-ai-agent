"use client";

import { useState } from "react";
import type { AgentState } from "@/lib/types";

interface AnalysisPanelProps {
  result: Partial<AgentState>;
}

const SECTIONS = [
  { id: "research", label: "Research", key: "researchNotes" as const },
  {
    id: "fundamentals",
    label: "Fundamentals",
    key: "fundamentalsAnalysis" as const,
  },
  { id: "risks", label: "Risks", key: "riskAssessment" as const },
];

export function AnalysisPanel({ result }: AnalysisPanelProps) {
  const [openId, setOpenId] = useState<string | null>("research");

  return (
    <section className="animate-fade-up border-t border-white/[0.06] pt-14">
      <h3 className="text-center text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
        Full analysis
      </h3>

      <div className="mt-8">
        {SECTIONS.map((section) => {
          const content = result[section.key];
          const isOpen = openId === section.id;

          return (
            <div
              key={section.id}
              className="border-b border-white/[0.04] last:border-0"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : section.id)}
                className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-white"
              >
                <span
                  className={`text-[14px] font-medium transition-colors ${
                    isOpen ? "text-white" : "text-zinc-400"
                  }`}
                >
                  {section.label}
                </span>
                <span
                  className={`text-zinc-600 transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pb-6">
                    {content ? (
                      <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-zinc-500">
                        {content}
                      </p>
                    ) : (
                      <p className="text-[13px] text-zinc-600">
                        No data for this section.
                      </p>
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
