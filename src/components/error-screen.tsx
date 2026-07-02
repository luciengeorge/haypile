import { Link } from "@tanstack/react-router";

import { HaypileLockup } from "@/components/brand/haypile-lockup";
import { Button } from "@/components/ui/button";

/**
 * Branded fallback for uncaught route/query errors. Wired as the router's
 * `defaultErrorComponent`, so a thrown query (or any render error) shows this
 * instead of the raw dev error screen. `reset` retries the errored boundary.
 */
export function ErrorScreen({ reset }: { reset?: () => void }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8">
        <Link to="/" aria-label="Haypile home">
          <HaypileLockup size={26} />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-xl text-center">
          <p className="text-xs font-medium tracking-[0.14em] text-gold uppercase">Something went wrong</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Something came loose in the pile.
          </h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground">
            An unexpected error tripped us up. Everything you've saved is safe. Try again, and if it keeps happening,
            let us know.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => (reset ? reset() : window.location.reload())}>
              <RetryIcon />
              Try again
            </Button>
            <Button size="lg" variant="ghost" nativeButton={false} render={<Link to="/" />}>
              Back to Haypile
            </Button>
          </div>
        </div>
      </main>

      <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-16 flex flex-col items-end gap-3">
        <div className="h-9 w-72 rounded-l-full bg-secondary/70" />
        <div className="h-9 w-52 rounded-l-full bg-secondary/50" />
      </div>
    </div>
  );
}

function RetryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-icon="inline-start"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
