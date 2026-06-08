export function MultimodalPreview() {
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
        <span className="flex-1 text-sm text-foreground">comfy mid-century reading chair</span>
      </div>

      <div className="relative mt-3 aspect-[5/3] overflow-hidden rounded-xl bg-gradient-to-br from-gold/80 via-gold/50 to-gold/25">
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-medium text-background backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            className="size-3.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" strokeLinecap="round" />
          </svg>
          Matched inside this image
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 px-1.5 pt-3 pb-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Tan leather lounge chair</p>
          <p className="truncate text-xs text-muted-foreground">Image · saved from Pinterest · no caption, no tags</p>
        </div>
        <span className="text-sm font-medium text-primary tabular-nums">0.71</span>
      </div>
    </div>
  );
}
