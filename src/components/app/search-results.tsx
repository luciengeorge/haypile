import type { SearchResult } from "@/components/app/search-result";

import { ResultGrid } from "@/components/app/result-grid";
import { filterBySource, presentSources } from "@/lib/sources";
import { cn } from "@/lib/utils";

export function SearchResults({
  results,
  selectedSource,
  onSelectSource,
}: {
  results: SearchResult[];
  selectedSource: string;
  onSelectSource: (source: string) => void;
}) {
  const pills = presentSources(results);
  const filtered = filterBySource(results, selectedSource);

  return (
    <section aria-label="Search results" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {results.length} {results.length === 1 ? "result" : "results"}{" "}
          <span className="font-normal text-muted-foreground">
            · across {pills.length} {pills.length === 1 ? "source" : "sources"}
          </span>
        </p>
        <span className="text-xs tracking-wide text-muted-foreground uppercase">Sorted by relevance</span>
      </div>

      {pills.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <SourcePill label="All sources" active={selectedSource === "all"} onClick={() => onSelectSource("all")} />
          {pills.map((source) => (
            <SourcePill
              key={source.id}
              label={source.label}
              active={selectedSource === source.id}
              onClick={() => onSelectSource(source.id)}
            />
          ))}
        </div>
      ) : null}

      <ResultGrid results={filtered} />
    </section>
  );
}

function SourcePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
