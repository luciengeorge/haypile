import { Link } from "@tanstack/react-router";

import { HaypileLockup } from "@/components/brand/haypile-lockup";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", to: "/", hash: "how-it-works" },
      { label: "Pricing", to: "/pricing", hash: undefined },
      { label: "Sources", to: "/", hash: "sources" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", to: "/privacy", hash: undefined },
      { label: "Terms", to: "/terms", hash: undefined },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <HaypileLockup size={26} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              One search for everything you've ever saved across the internet.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {COLUMNS.map((column) => (
              <nav key={column.heading} className="flex flex-col gap-3">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
                  {column.heading}
                </p>
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    hash={link.hash}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Haypile. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="https://x.com/haypile" className="transition-colors hover:text-foreground">
              X
            </a>
            <a href="https://github.com/haypile" className="transition-colors hover:text-foreground">
              GitHub
            </a>
            <a href="mailto:hello@haypile.app" className="transition-colors hover:text-foreground">
              hello@haypile.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
