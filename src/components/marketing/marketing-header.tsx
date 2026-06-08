import { Link } from "@tanstack/react-router";

import { HaypileLockup } from "@/components/brand/haypile-lockup";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Features", to: "/", hash: "how-it-works" },
  { label: "Pricing", to: "/pricing", hash: undefined },
  { label: "Sources", to: "/", hash: "sources" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" aria-label="Haypile home">
          <HaypileLockup size={26} />
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV.map((item) => (
            <Link key={item.label} to={item.to} hash={item.hash} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <Link to="/login" className="transition-colors hover:text-foreground">
            Log in
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="md:hidden" nativeButton={false} render={<Link to="/login" />}>
            Log in
          </Button>
          <Button size="sm" nativeButton={false} render={<Link to="/signup" />}>
            Start free trial
          </Button>
        </div>
      </div>
    </header>
  );
}
