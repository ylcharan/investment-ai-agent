import { z } from "zod";

export const SignalSchema = z.enum(["positive", "neutral", "negative"]);
export type Signal = z.infer<typeof SignalSchema>;

export const ResearchBriefSchema = z.object({
  overview: z.string().describe("2-3 sentence business overview"),
  financials: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        signal: SignalSchema,
      })
    )
    .min(2)
    .max(6),
  competitivePosition: z.string(),
  recentDevelopments: z.array(z.string()).min(1).max(5),
  valuationNote: z.string(),
  dataGaps: z.array(z.string()).max(4).optional(),
});

export type ResearchBrief = z.infer<typeof ResearchBriefSchema>;

export const AnalysisSchema = z.object({
  fundamentals: z.object({
    qualityScore: z.number().min(1).max(10),
    rating: z.enum(["Strong", "Adequate", "Weak"]),
    growth: z.string(),
    profitability: z.string(),
    balanceSheet: z.string(),
    moat: z.string(),
    management: z.string(),
    highlights: z
      .array(
        z.object({
          point: z.string(),
          signal: SignalSchema,
        })
      )
      .min(2)
      .max(5),
  }),
  risks: z.object({
    overall: z.enum(["Low", "Medium", "High"]),
    categories: z
      .array(
        z.object({
          category: z.string(),
          detail: z.string(),
          severity: z.enum(["low", "medium", "high"]),
        })
      )
      .min(2)
      .max(6),
    topRisks: z.array(z.string()).min(2).max(3),
  }),
});

export type AnalysisReport = z.infer<typeof AnalysisSchema>;

export const DecisionSchema = z.object({
  verdict: z.enum(["INVEST", "PASS"]),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  bullCase: z.array(z.string()).min(2).max(5),
  bearCase: z.array(z.string()).min(2).max(5),
  keyMetrics: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        assessment: SignalSchema,
      })
    )
    .min(3)
    .max(6),
  reasoning: z.string(),
  timeHorizon: z.enum(["short-term", "medium-term", "long-term"]),
  riskLevel: z.enum(["low", "medium", "high"]),
});

export type InvestmentDecision = z.infer<typeof DecisionSchema>;

export type ResearchStep =
  | "research"
  | "analyze"
  | "verdict"
  | "complete"
  | "error";

export interface AgentState {
  company: string;
  research: ResearchBrief | null;
  analysis: AnalysisReport | null;
  /** Legacy string fields kept for display fallback / streaming compatibility */
  researchNotes: string;
  fundamentalsAnalysis: string;
  riskAssessment: string;
  decision: InvestmentDecision | null;
  currentStep: ResearchStep;
  error?: string;
}

export interface StreamEvent {
  type: "step" | "partial" | "complete" | "error";
  step?: ResearchStep;
  message?: string;
  data?: Partial<AgentState>;
}
