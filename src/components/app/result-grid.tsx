import type { SearchResult } from "@/components/app/search-result";

import { ResultCard } from "@/components/app/result-card";

export function ResultGrid({ results }: { results: SearchResult[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((result) => (
        <ResultCard key={result._id} result={result} />
      ))}
    </ul>
  );
}
