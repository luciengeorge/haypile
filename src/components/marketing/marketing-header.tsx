import { Link } from "@tanstack/react-router";

import { HaypileLockup } from "@/components/brand/haypile-lockup";
import { MarketingAccountMenu } from "@/components/marketing/marketing-account-menu";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { WAITLIST_ENABLED } from "@/lib/waitlist";

type NavItem = {
  label: string;
  to: "/" | "/pricing";
  hash?: "how-it-works" | "sources";
};

const NAV: NavItem[] = [
  { label: "Features", to: "/", hash: "how-it-works" },
  { label: "Pricing", to: "/pricing", hash: undefined },
  { label: "Sources", to: "/", hash: "sources" },
];

const START_CTA_TO = WAITLIST_ENABLED ? "/waitlist" : "/signup";
const START_CTA_LABEL = WAITLIST_ENABLED ? "Join the waitlist" : "Start free trial";

export function MarketingHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

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
          {user ? null : (
            <Link to="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <MarketingAccountMenu user={user} />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                nativeButton={false}
                render={<Link to="/login" />}
              >
                Sign in
              </Button>
              <Button size="sm" nativeButton={false} render={<Link to={START_CTA_TO} />}>
                {START_CTA_LABEL}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
