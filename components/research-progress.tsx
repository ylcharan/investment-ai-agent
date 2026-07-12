"use client";

const STEPS = ["research", "analyze", "verdict"];

interface ResearchProgressProps {
  currentStep: string | null;
  stepLabels: Record<string, string>;
  statusMessage?: string | null;
  loading: boolean;
}

export function ResearchProgress({
  currentStep,
  stepLabels,
  statusMessage,
  loading,
}: ResearchProgressProps) {
  const activeIndex = currentStep
    ? Math.min(Math.max(STEPS.indexOf(currentStep), 0), STEPS.length - 1)
    : 0;

  const subProgress = statusMessage ? 0.35 : 0.15;
  const progress = loading
    ? ((activeIndex + subProgress) / STEPS.length) * 100
    : 100;

  const label =
    statusMessage ??
    (currentStep && currentStep !== "complete"
      ? stepLabels[currentStep]
      : loading
        ? "Processing"
        : "Complete");

  return (
    <div className="mt-14 animate-fade-up">
      <div className="flex items-center justify-between gap-4 text-[12px] text-zinc-500">
        <span className="truncate">{label}</span>
        {loading && (
          <span className="shrink-0 tabular-nums text-zinc-600">
            {Math.min(Math.round(progress), 99)}%
          </span>
        )}
      </div>

      <div className="relative mt-3 h-px w-full overflow-hidden bg-white/[0.06]">
        <div
          className="h-full bg-emerald-500/80 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 99)}%` }}
        />
        {loading && (
          <div className="absolute inset-0 animate-pulse bg-emerald-400/20" />
        )}
      </div>

      <div className="mt-4 flex justify-between">
        {STEPS.map((step, index) => {
          const isActive = index === activeIndex && loading;
          const isDone = index < activeIndex;

          return (
            <span
              key={step}
              className={`text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                isDone
                  ? "text-zinc-400"
                  : isActive
                    ? "text-emerald-400/90"
                    : "text-zinc-700"
              }`}
            >
              {step}
            </span>
          );
        })}
      </div>
    </div>
  );
}
