import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const resultSchema = z.object({
  _id: z.string(),
  url: z.string(),
  source: z.string(),
  score: z.number(),
  title: z.string().optional(),
  text: z.string().optional(),
  author: z.string().optional(),
  matchModality: z.string().optional(),
});
type Result = z.infer<typeof resultSchema>;

export function BookmarkSearch() {
  const search = useAction(api.search.search);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const raw = await search({ query });
      setResults(z.array(resultSchema).parse(raw));
    } catch (err) {
      toast.error("Search failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={run} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything you've saved — e.g. “red car”, “where I work”"
          aria-label="Search bookmarks"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner /> : "Search"}
        </Button>
      </form>

      {results && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matches. Try a different phrasing, or sync more sources.</p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {results?.map((r) => (
          <li key={r._id}>
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted"
            >
              <span className="line-clamp-2 text-sm">{r.title || r.text || r.url}</span>
              <span className="text-xs text-muted-foreground">
                {r.source}
                {r.author ? ` · @${r.author}` : ""}
                {r.matchModality && r.matchModality !== "text" ? ` · ${r.matchModality} match` : ""}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
