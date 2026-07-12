"use client";

interface CompanyFormProps {
  onSubmit: (company: string) => void;
  loading: boolean;
  compact?: boolean;
  defaultValue?: string;
}

const SUGGESTIONS = ["Apple", "Tesla", "NVIDIA", "Reliance", "Infosys"];

export function CompanyForm({
  onSubmit,
  loading,
  compact = false,
  defaultValue = "",
}: CompanyFormProps) {
  return (
    <form
      className="w-full"
      key={defaultValue}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const company = String(formData.get("company") ?? "").trim();
        if (company) onSubmit(company);
      }}
    >
      <div className="group relative">
        {!compact && (
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
        )}
        <div
          className={`relative flex items-center gap-2 border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-colors focus-within:border-white/[0.14] focus-within:bg-white/[0.05] ${
            compact
              ? "rounded-xl p-1"
              : "rounded-2xl p-1.5"
          }`}
        >
          <input
            id="company"
            name="company"
            type="text"
            required
            disabled={loading}
            defaultValue={defaultValue}
            placeholder={compact ? "Search company…" : "Company name"}
            className={`min-w-0 flex-1 bg-transparent text-white placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 ${
              compact
                ? "px-3 py-2 text-[13px]"
                : "px-4 py-3.5 text-[15px]"
            }`}
          />
          <button
            type="submit"
            disabled={loading}
            className={`shrink-0 bg-white font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 ${
              compact
                ? "rounded-lg px-3.5 py-2 text-[12px]"
                : "rounded-xl px-5 py-3 text-[13px]"
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className={`animate-spin rounded-full border-2 border-black/20 border-t-black ${
                    compact ? "h-3 w-3" : "h-3.5 w-3.5"
                  }`}
                />
                {compact ? "…" : "Analyzing"}
              </span>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
      </div>

      {!compact && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          {SUGGESTIONS.map((name, i) => (
            <span key={name} className="inline-flex items-center">
              {i > 0 && <span className="mr-1 text-zinc-700">·</span>}
              <button
                type="button"
                disabled={loading}
                onClick={() => onSubmit(name)}
                className="px-1 py-0.5 text-[13px] text-zinc-500 transition hover:text-zinc-300 disabled:opacity-40"
              >
                {name}
              </button>
            </span>
          ))}
        </div>
      )}
    </form>
  );
}
