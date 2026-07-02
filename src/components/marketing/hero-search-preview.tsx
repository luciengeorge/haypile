type Row = {
  title: string;
  meta: string;
  score: string;
  tag: string;
  kind: "image" | "video" | "link";
};

const ROWS: Row[] = [
  {
    title: "Self-employment tax — Schedule C deductions",
    meta: "Image · saved from Pinterest · Apr 2026",
    score: "0.69",
    tag: "Image",
    kind: "image",
  },
  {
    title: "How freelancers file quarterly taxes",
    meta: "Video · 4:12 · saved from YouTube",
    score: "0.66",
    tag: "Video",
    kind: "video",
  },
  {
    title: "Income tax brackets for 2026, explained",
    meta: "Link · nerdwallet.com · saved from X",
    score: "0.63",
    tag: "Link",
    kind: "link",
  },
];

export function HeroSearchPreview() {
  return (
    <div className="w-full rounded-2xl bg-card p-3 shadow-xl ring-1 shadow-foreground/5 ring-foreground/10">
      <div className="flex items-center gap-2.5 rounded-xl bg-background px-3.5 py-3 ring-1 ring-foreground/10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-sm text-foreground">income tax</span>
        <kbd className="rounded-md bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">⌘K</kbd>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1.5 py-3 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">12 results</span> · across 6 sources
        </span>
        <span className="tracking-[0.1em] uppercase">Sorted by relevance</span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {ROWS.map((row) => (
          <li key={row.title} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">
            <Thumb kind={row.kind} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.title}</p>
              <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-medium text-primary tabular-nums">{row.score}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
                {row.tag}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Thumb({ kind }: { kind: Row["kind"] }) {
  if (kind === "image") {
    return <div className="size-11 shrink-0 rounded-lg bg-gradient-to-br from-gold/80 to-gold/30" />;
  }
  if (kind === "video") {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className="size-4"
      >
        <path d="M10 13.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" strokeLinecap="round" />
        <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" strokeLinecap="round" />
      </svg>
    </div>
  );
}
