import type { InvestmentDecision } from "@/lib/types";

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
      <div className="flex flex-col items-center text-center">
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${
            isInvest ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {decision.verdict}
        </span>
        <h2 className="mt-4 text-3xl font-light tracking-[-0.02em] text-white sm:text-4xl">
          {company}
        </h2>
        <p className="mt-3 text-[13px] text-zinc-500">
          {decision.confidence}% confidence
          <span className="mx-2 text-zinc-700">·</span>
          {decision.riskLevel} risk
          <span className="mx-2 text-zinc-700">·</span>
          {decision.timeHorizon}
          {elapsedMs != null && (
            <>
              <span className="mx-2 text-zinc-700">·</span>
              generated in {formatElapsed(elapsedMs)}
            </>
          )}
        </p>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-[17px] leading-[1.7] text-zinc-300">
        {decision.summary}
      </p>

      <div className="mt-14 grid gap-12 sm:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-emerald-500/80">
            Bull case
          </h3>
          <ul className="mt-5 space-y-3">
            {decision.bullCase.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[14px] leading-relaxed text-zinc-400"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500/60" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-amber-500/80">
            Bear case
          </h3>
          <ul className="mt-5 space-y-3">
            {decision.bearCase.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-[14px] leading-relaxed text-zinc-400"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-500/60" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {decision.keyMetrics.length > 0 && (
        <div className="mt-14 border-t border-white/[0.06] pt-10">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
            Key metrics
          </h3>
          <dl className="mt-6 divide-y divide-white/[0.04]">
            {decision.keyMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-baseline justify-between gap-4 py-3.5"
              >
                <dt className="text-[13px] text-zinc-500">{metric.label}</dt>
                <dd className="flex items-baseline gap-3 text-right">
                  <span className="text-[15px] font-medium text-zinc-200">
                    {metric.value}
                  </span>
                  <span
                    className={`text-[11px] capitalize ${
                      metric.assessment === "positive"
                        ? "text-emerald-500/70"
                        : metric.assessment === "negative"
                          ? "text-amber-500/70"
                          : "text-zinc-600"
                    }`}
                  >
                    {metric.assessment}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-14 border-t border-white/[0.06] pt-10">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
          Reasoning
        </h3>
        <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
          {decision.reasoning}
        </p>
      </div>
    </section>
  );
}
