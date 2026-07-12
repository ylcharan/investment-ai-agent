import { z } from "zod";

export const DecisionSchema = z.object({
  verdict: z.enum(["INVEST", "PASS"]),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  bullCase: z.array(z.string()).min(2).max(5),
  bearCase: z.array(z.string()).min(2).max(5),
  keyMetrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      assessment: z.enum(["positive", "neutral", "negative"]),
    })
  ),
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
