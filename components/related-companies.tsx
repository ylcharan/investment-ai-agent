"use client";

import type { RelatedCompany } from "@/lib/types";

interface RelatedCompaniesProps {
  sector?: string;
  companies: RelatedCompany[];
  onSelect: (company: string) => void;
  loading?: boolean;
}

export function RelatedCompanies({
  sector,
  companies,
  onSelect,
  loading = false,
}: RelatedCompaniesProps) {
  if (!companies.length) return null;

  return (
    <aside className="animate-fade-up lg:sticky lg:top-8 lg:self-start">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
          Same category
        </p>
        {sector && (
          <p className="mt-2 text-[13px] font-medium text-zinc-300">{sector}</p>
        )}
        <p className="mt-1 text-[12px] leading-relaxed text-zinc-600">
          Top 5 peers related to this company. Click to research.
        </p>

        <ol className="mt-5 space-y-2">
          {companies.slice(0, 5).map((peer, index) => (
            <li key={`${peer.name}-${peer.ticker ?? index}`}>
              <button
                type="button"
                disabled={loading}
                onClick={() => onSelect(peer.name)}
                className="group w-full rounded-xl border border-white/[0.06] bg-black/20 px-3.5 py-3 text-left transition hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-medium text-zinc-500 tabular-nums group-hover:text-emerald-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="truncate text-[14px] font-medium text-zinc-200 group-hover:text-white">
                        {peer.name}
                      </span>
                      {peer.ticker && (
                        <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                          {peer.ticker}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-500/70">
                      {peer.category}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">
                      {peer.whyRelated}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
