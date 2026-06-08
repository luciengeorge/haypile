import {
  cardKind,
  type CardKind,
  hostname,
  type SearchResult,
  thumbnailUrl,
  videoDuration,
} from "@/components/app/search-result";
import { formatDuration } from "@/lib/format";
import { sourceLabel } from "@/lib/sources";
import { cn } from "@/lib/utils";

const BADGE: Record<CardKind, string> = { image: "Image", video: "Video", link: "Link", post: "Post" };

export function ResultCard({ result }: { result: SearchResult }) {
  const kind = cardKind(result);
  // Posts show their text in the preview, so the footer skips a (duplicate) title.
  const title = kind === "post" ? null : result.title || hostname(result.url);

  return (
    <li>
      <a
        href={result.url}
        target="_blank"
        rel="noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
      >
        <MediaPreview result={result} kind={kind} />
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          {title ? <p className="line-clamp-2 leading-snug font-medium text-pretty">{title}</p> : null}
          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <span className="truncate text-xs text-muted-foreground">
              {sourceLabel(result.source)}
              {result.author ? ` · @${result.author}` : ""}
            </span>
            {typeof result.score === "number" ? (
              <span className="shrink-0 text-sm font-medium text-primary tabular-nums">{result.score.toFixed(2)}</span>
            ) : null}
          </div>
        </div>
      </a>
    </li>
  );
}

function MediaPreview({ result, kind }: { result: SearchResult; kind: CardKind }) {
  const thumb = thumbnailUrl(result, kind);
  const duration = videoDuration(result);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      {kind === "post" ? (
        <p className="line-clamp-4 size-full bg-secondary px-3.5 pt-9 pb-3.5 text-sm leading-snug text-secondary-foreground">
          {result.text}
        </p>
      ) : thumb ? (
        <img
          src={thumb}
          alt={result.title ?? ""}
          width={400}
          height={250}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className={cn("size-full", kind === "video" ? "bg-foreground" : "bg-gradient-to-br from-muted to-secondary")}
        />
      )}

      {kind === "video" ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </span>
      ) : null}
      {kind === "link" && !thumb ? (
        <span className="absolute inset-0 flex items-center justify-center text-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="size-7"
            aria-hidden="true"
          >
            <path
              d="M10 13.5 14 9.5M9 7.5l1.2-1.2a3.5 3.5 0 0 1 5 5L13 12.3M15 16.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L11 11.7"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ) : null}

      <span className="absolute top-2 left-2 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-foreground uppercase backdrop-blur">
        {BADGE[kind]}
      </span>
      {kind === "video" && duration ? (
        <span className="absolute right-2 bottom-2 rounded bg-foreground/85 px-1.5 py-0.5 text-[10px] font-medium text-background tabular-nums">
          {formatDuration(duration)}
        </span>
      ) : null}
    </div>
  );
}
