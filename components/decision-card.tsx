import type { InvestmentDecision } from "@/lib/types";
import {
  signalBg,
  signalDot,
  signalLabel,
  signalText,
  severityBg,
} from "@/lib/ui/signals";

interface DecisionCardProps {
  company: string;
  decision: InvestmentDecision;
  elapsedMs?: number | null;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

export function DecisionCard({
  company,
  decision,
  elapsedMs,
}: DecisionCardProps) {
  const isInvest = decision.verdict === "INVEST";

  return (
    <section className="animate-fade-up">
      <div
        className={`rounded-2xl border px-6 py-8 text-center sm:px-8 ${
          isInvest
            ? "border-emerald-500/30 bg-emerald-500/[0.07]"
            : "border-red-500/30 bg-red-500/[0.07]"
        }`}
      >
        <span
          className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.28em] ${
            isInvest
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-red-500/40 bg-red-500/15 text-red-300"
          }`}
        >
          {decision.verdict}
        </span>

        <h2 className="mt-5 text-3xl font-light tracking-[-0.02em] text-white sm:text-4xl">
          {company}
        </h2>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[12px]">
          <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-zinc-300">
            <span
              className={
                decision.confidence >= 70
                  ? "text-emerald-400"
                  : decision.confidence >= 45
                    ? "text-amber-400"
                    : "text-red-400"
              }
            >
              {decision.confidence}%
            </span>{" "}
            confidence
          </span>
          <span
            className={`rounded-full border px-3 py-1 capitalize ${severityBg(decision.riskLevel)}`}
          >
            {decision.riskLevel} risk
          </span>
          <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-zinc-400">
            {decision.timeHorizon}
          </span>
          {elapsedMs != null && (
            <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-zinc-500">
              {formatElapsed(elapsedMs)}
            </span>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-[1.7] text-zinc-300">
          {decision.summary}
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-emerald-400">
            Bull case
          </h3>
          <ul className="mt-4 space-y-3">
            {decision.bullCase.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[14px] leading-relaxed text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-5">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-red-400">
            Bear case
          </h3>
          <ul className="mt-4 space-y-3">
            {decision.bearCase.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[14px] leading-relaxed text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {decision.keyMetrics.length > 0 && (
        <div className="mt-10">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
            Key metrics
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {decision.keyMetrics.map((metric) => (
              <div
                key={metric.label}
                className={`rounded-xl border px-4 py-3 ${signalBg(metric.assessment)}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-zinc-500">{metric.label}</p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide ${signalText(metric.assessment)}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${signalDot(metric.assessment)}`}
                    />
                    {signalLabel(metric.assessment)}
                  </span>
                </div>
                <p
                  className={`mt-1.5 text-[16px] font-medium ${signalText(metric.assessment)}`}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
          Reasoning
        </h3>
        <p className="mt-3 text-[15px] leading-[1.75] text-zinc-400">
          {decision.reasoning}
        </p>
      </div>
    </section>
  );
}
