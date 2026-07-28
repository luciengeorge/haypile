import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";

type ResultKind = "image" | "video" | "link";

type Result = {
  kind: ResultKind;
  title: string;
  meta: string;
  score: string;
  // Tailwind gradient stops for image thumbnails (photo stand-in per example).
  tone?: string;
};

type Example = {
  query: string;
  results: Result[];
};

// Each query carries its own matching results, ordered by the dominant modality, so the
// list swaps in step with the typewriter and shows off multimodal search across sources.
const EXAMPLES: Example[] = [
  {
    query: "the local-first sync library I starred",
    results: [
      { kind: "link", title: "electric-sql / electric", meta: "Link · github.com · saved from GitHub", score: "0.76" },
      {
        kind: "link",
        title: "Local-first software: the essay",
        meta: "Link · inkandswitch.com · saved from X",
        score: "0.66",
      },
      {
        kind: "video",
        title: "Local-first sync, explained",
        meta: "Video · 12:30 · saved from YouTube",
        score: "0.61",
      },
    ],
  },
  {
    query: "thread comparing the open LLMs",
    results: [
      { kind: "link", title: "Open-weight models, ranked", meta: "Link · x.com · saved from X", score: "0.77" },
      {
        kind: "image",
        title: "Benchmark table screenshot",
        meta: "Image · screenshot · saved from X",
        score: "0.68",
        tone: "from-[#9aa0a6] to-[#5f6368]",
      },
      {
        kind: "link",
        title: "Which local model should you run?",
        meta: "Link · simonwillison.net · saved from Reddit",
        score: "0.61",
      },
    ],
  },
  {
    query: "scandi bedroom with the low wooden bed",
    results: [
      {
        kind: "image",
        title: "Oak platform bed, linen throw",
        meta: "Image · saved from Pinterest · Jan 2026",
        score: "0.74",
        tone: "from-[#c8a06a] to-[#8a6238]",
      },
      {
        kind: "image",
        title: "Muji-style minimal bedroom",
        meta: "Image · saved from Pinterest · Nov 2025",
        score: "0.66",
        tone: "from-[#cfc8ba] to-[#8f887b]",
      },
      { kind: "video", title: "Small bedroom makeover", meta: "Video · 6:40 · saved from YouTube", score: "0.6" },
    ],
  },
  {
    query: "that miso salmon rice bowl",
    results: [
      {
        kind: "image",
        title: "Miso glazed salmon bowl",
        meta: "Image · saved from Pinterest · Dec 2025",
        score: "0.72",
        tone: "from-[#d98a5a] to-[#a85a30]",
      },
      {
        kind: "video",
        title: "15-minute salmon rice bowl",
        meta: "Video · 0:52 · saved from Instagram",
        score: "0.65",
      },
      { kind: "link", title: "Weeknight miso salmon", meta: "Link · nytimes.com · saved from X", score: "0.6" },
    ],
  },
  {
    query: "portfolio with the huge serif hero",
    results: [
      {
        kind: "image",
        title: "Editorial portfolio, oversized serif",
        meta: "Image · saved from Pinterest · Jan 2026",
        score: "0.73",
        tone: "from-[#9a958c] to-[#5f5b54]",
      },
      {
        kind: "image",
        title: "Awwwards serif landing page",
        meta: "Image · saved from X",
        score: "0.66",
        tone: "from-[#b9bec4] to-[#7a7f86]",
      },
      {
        kind: "link",
        title: "Typography that carries a whole page",
        meta: "Link · smashingmagazine.com · saved from X",
        score: "0.6",
      },
    ],
  },
  {
    query: "the git branching workflow video",
    results: [
      { kind: "video", title: "Trunk-based vs git flow", meta: "Video · 8:05 · saved from YouTube", score: "0.75" },
      {
        kind: "link",
        title: "A successful git branching model",
        meta: "Link · nvie.com · saved from GitHub",
        score: "0.64",
      },
      { kind: "link", title: "Stop rebasing (hot take)", meta: "Link · x.com · saved from X", score: "0.59" },
    ],
  },
];

const QUERIES = EXAMPLES.map((example) => example.query);

// Animated multimodal search preview: the query typewrites through EXAMPLES and the result rows
// swap to match. Shared by the marketing hero (/) and the waitlist gate (/waitlist).
export function SearchPreview({ className }: { className?: string }) {
  const { text: query, index } = useTypewriter(QUERIES);
  const results = EXAMPLES[index]?.results ?? EXAMPLES[0].results;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3.5 rounded-[20px] border border-foreground/6 bg-card p-5 shadow-2xl shadow-foreground/20",
        className,
      )}
    >
      <div className="flex h-13 shrink-0 items-center gap-3 rounded-[13px] border-[1.5px] border-primary bg-card px-4">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="size-4.5 shrink-0 text-primary"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
        <div className="flex min-w-0 grow items-center gap-px">
          <div className="min-w-0 truncate text-base/5 font-medium text-foreground">{query}</div>
          <div className="ml-0.75 h-5 w-0.5 shrink-0 animate-[caret-blink_1s_steps(1,end)_infinite] rounded-[1px] bg-primary motion-reduce:animate-none" />
        </div>
        <div className="flex shrink-0 items-center justify-center rounded-md bg-muted px-2 py-0.75">
          <div className="text-xs/4 font-medium text-muted-foreground">⌘K</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-[13px]/4 font-medium text-muted-foreground/70">12 results across 6 sources</div>
        <div className="text-[11px]/3.5 tracking-widest whitespace-nowrap text-muted-foreground/70 uppercase">
          Sorted by relevance
        </div>
      </div>

      <div
        key={index}
        className="flex w-full animate-[waitlist-swap_260ms_ease-out] flex-col gap-2.5 motion-reduce:animate-none"
      >
        {results.map((result) => (
          <div key={result.title} className="flex items-center gap-3.5 rounded-[13px] border border-foreground/7 p-3">
            <ResultThumb result={result} />
            <div className="flex min-w-0 grow basis-0 flex-col gap-0.75">
              <div className="truncate text-sm/4.5 font-semibold text-foreground">{result.title}</div>
              <div className="truncate text-xs/4 text-muted-foreground/70">{result.meta}</div>
            </div>
            <div className="flex w-13 shrink-0 flex-col items-end gap-1.25">
              <div className="text-[13px]/4 font-medium text-primary">{result.score}</div>
              <div className="text-[9px]/3 font-medium tracking-[0.08em] text-muted-foreground/70">
                {result.kind.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultThumb({ result }: { result: Result }) {
  if (result.kind === "video") {
    return (
      <div className="flex size-11.5 shrink-0 items-center justify-center rounded-[9px] bg-foreground text-primary-foreground">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  }

  if (result.kind === "link") {
    return (
      <div className="flex size-11.5 shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
          className="size-4.5"
        >
          <path d="M10 13.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" strokeLinecap="round" />
          <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn("size-11.5 shrink-0 rounded-[9px] bg-gradient-to-br", result.tone ?? "from-gold to-foreground/60")}
    />
  );
}
