import { Link } from "@tanstack/react-router";

import { HaypileLockup } from "@/components/brand/haypile-lockup";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8">
        <Link to="/" aria-label="Haypile home">
          <HaypileLockup size={26} />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-xl text-center">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">404 · Not found</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            This one slipped out of the pile.
          </h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground">
            We couldn't find that page — but everything you've actually saved is still right where you left it.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link to="/" />}>
              Back to Haypile
            </Button>
            <Button size="lg" variant="ghost" nativeButton={false} render={<Link to="/app" />}>
              Search your stash
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
