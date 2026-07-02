import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery } from "convex/react";

import { api } from "@/../convex/_generated/api";
import { ResultGrid } from "@/components/app/result-grid";
import { HaypileMark } from "@/components/brand/haypile-mark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/library")({ component: LibraryPage });

function LibraryPage() {
  const { results, status, loadMore } = usePaginatedQuery(api.items.listItems, {}, { initialNumItems: 24 });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Library</h1>
        <p className="text-pretty text-muted-foreground">
          Everything you've saved, newest first, all of it searchable.
        </p>
      </header>

      {status === "LoadingFirstPage" ? (
        <LibrarySkeleton />
      ) : results.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <div className="flex flex-col gap-6">
          <ResultGrid results={results} />
          {status === "CanLoadMore" ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => loadMore(24)}>
                Load more
              </Button>
            </div>
          ) : null}
          {status === "LoadingMore" ? <p className="text-center text-sm text-muted-foreground">Loading…</p> : null}
        </div>
      )}
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="overflow-hidden rounded-xl border bg-card">
          <span className="block aspect-[16/10] animate-pulse bg-muted motion-reduce:animate-none" />
          <span className="flex flex-col gap-2 p-3">
            <span className="h-3.5 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <span className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed bg-card/40 px-6 py-16 text-center">
      <HaypileMark size={44} />
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-xl font-semibold tracking-tight">Your pile is empty</p>
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">
          Connect a source and Haypile starts gathering everything you've saved into one searchable place.
        </p>
      </div>
      <Button nativeButton={false} render={<Link to="/app/sources" />}>
        Connect a source
      </Button>
    </div>
  );
}
