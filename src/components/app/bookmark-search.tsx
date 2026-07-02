import { Link } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import type { SearchResult } from "@/components/app/search-result";

import { api } from "@/../convex/_generated/api";
import { SearchResults } from "@/components/app/search-results";
import { VideoPaywall } from "@/components/billing/video-paywall";
import { HaypileMark } from "@/components/brand/haypile-mark";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AnalyticsEvent, useAnalytics } from "@/lib/analytics";

const resultSchema = z.object({
  _id: z.string(),
  url: z.string(),
  source: z.string(),
  score: z.number(),
  title: z.string().optional(),
  text: z.string().optional(),
  author: z.string().optional(),
  matchModality: z.string().optional(),
  kind: z.string().optional(),
  durationSec: z.number().optional(),
  media: z.array(z.object({ type: z.string(), url: z.string(), durationSec: z.number().optional() })).optional(),
  links: z
    .array(
      z.object({
        url: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .optional(),
  thumbnailStorageId: z.string().optional(),
});

const EXAMPLES = ["income tax", "that red car", "where I work", "css grid tricks"];

export function BookmarkSearch() {
  const search = useAction(api.search.search);
  const usage = useQuery(api.items.usage);
  const entitlement = useQuery(api.billing.subscriptions.myEntitlement);
  const { capture } = useAnalytics();
  const formRef = useRef<HTMLFormElement>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("all");

  const run = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
    if (!query) return;
    setLoading(true);
    setSource("all");
    try {
      const raw = await search({ query });
      const parsed = z.array(resultSchema).parse(raw);
      setResults(parsed);
      capture(AnalyticsEvent.searchPerformed, { result_count: parsed.length });
    } catch (error) {
      toast.error("Search failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const runExample = (query: string) => {
    const form = formRef.current;
    if (!form) return;
    const input = form.elements.namedItem("query");
    if (input instanceof HTMLInputElement) {
      input.value = query;
      form.requestSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form ref={formRef} onSubmit={run} className="relative">
        <SearchGlyph />
        <Input
          name="query"
          type="search"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-label="Search everything you've saved"
          placeholder="Search everything you've saved — try “income tax”…"
          className="h-12 rounded-xl pr-28 pl-11 text-base"
        />
        <Button type="submit" disabled={loading} className="absolute inset-y-0 right-1.5 my-auto h-9">
          {loading ? <Spinner /> : "Search"}
        </Button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-6">
        {loading ? <LoadingState /> : null}
        {!loading && results && results.length === 0 ? <EmptyState /> : null}
        {!loading && results && results.length > 0 ? (
          <SearchResults results={results} selectedSource={source} onSelectSource={setSource} />
        ) : null}
      </div>

      {!loading && !results && usage?.itemCount === 0 ? <NoSavesEmpty /> : null}

      {!loading && !results && usage && usage.itemCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Try</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => runExample(example)}
              className="rounded-full border bg-card px-3 py-1 font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              {example}
            </button>
          ))}
        </div>
      ) : null}

      {!loading && !results && usage && usage.itemCount > 0 && entitlement && entitlement.plan !== "pro" ? (
        <VideoPaywall />
      ) : null}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}

function LoadingState() {
  return (
    <ul className="flex flex-col gap-2.5" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex items-center gap-4 rounded-xl border bg-card p-3">
          <span className="size-12 shrink-0 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-3.5 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <span className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <Empty className="rounded-2xl border border-dashed bg-card/40">
      <EmptyHeader>
        <EmptyMedia>
          <HaypileMark size={40} />
        </EmptyMedia>
        <EmptyTitle className="font-display font-semibold">No matches yet</EmptyTitle>
        <EmptyDescription>
          Try different phrasing, or connect more sources so there's more to dig through.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NoSavesEmpty() {
  return (
    <Empty className="rounded-2xl border border-dashed bg-card/40">
      <EmptyHeader>
        <EmptyMedia>
          <HaypileMark size={40} />
        </EmptyMedia>
        <EmptyTitle className="font-display font-semibold">Nothing to search yet</EmptyTitle>
        <EmptyDescription>
          Connect a source and Haypile indexes everything you've saved — then you can search it in plain language.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link to="/app/sources" />}>
          Connect a source
        </Button>
      </EmptyContent>
    </Empty>
  );
}
