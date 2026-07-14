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
    query: "crispy chili oil eggs",
    results: [
      {
        kind: "image",
        title: "Chili oil eggs, jammy yolk",
        meta: "Image · saved from Pinterest · Feb 2026",
        score: "0.69",
        tone: "from-[#c88f5a] to-[#9c6634]",
      },
      { kind: "video", title: "60-second chili oil eggs", meta: "Video · 0:48 · saved from Instagram", score: "0.66" },
      {
        kind: "link",
        title: "The chili crisp taste test",
        meta: "Link · seriouseats.com · saved from X",
        score: "0.63",
      },
    ],
  },
  {
    query: "mid-century walnut credenza",
    results: [
      {
        kind: "image",
        title: "Walnut credenza, tapered legs",
        meta: "Image · saved from Pinterest · Nov 2025",
        score: "0.72",
        tone: "from-[#a9773f] to-[#6f4a24]",
      },
      { kind: "video", title: "Restoring a 1960s credenza", meta: "Video · 7:20 · saved from YouTube", score: "0.64" },
      {
        kind: "link",
        title: "Where to buy real mid-century",
        meta: "Link · apartmenttherapy.com · saved from X",
        score: "0.61",
      },
    ],
  },
  {
    query: "that reel about cold plunge benefits",
    results: [
      {
        kind: "video",
        title: "Cold plunge, my first 30 days",
        meta: "Video · 2:14 · saved from Instagram",
        score: "0.74",
      },
      {
        kind: "image",
        title: "Backyard ice bath setup",
        meta: "Image · saved from Pinterest · Dec 2025",
        score: "0.65",
        tone: "from-[#7fa8c9] to-[#3f6b90]",
      },
      {
        kind: "link",
        title: "Does cold exposure actually work?",
        meta: "Link · hubermanlab.com · saved from Reddit",
        score: "0.6",
      },
    ],
  },
  {
    query: "the wifi password screenshot",
    results: [
      {
        kind: "image",
        title: "Back-of-router password",
        meta: "Image · screenshot · saved from Photos",
        score: "0.78",
        tone: "from-[#9aa0a6] to-[#5f6368]",
      },
      {
        kind: "image",
        title: "Airbnb wifi note",
        meta: "Image · screenshot · saved from browser",
        score: "0.7",
        tone: "from-[#8c8f95] to-[#585b60]",
      },
      {
        kind: "link",
        title: "How to find your wifi password",
        meta: "Link · nordvpn.com · saved from X",
        score: "0.58",
      },
    ],
  },
  {
    query: "brutalist house with the spiral staircase",
    results: [
      {
        kind: "image",
        title: "Concrete villa, béton brut",
        meta: "Image · saved from Pinterest · Jan 2026",
        score: "0.75",
        tone: "from-[#b9b4ab] to-[#7d786f]",
      },
      { kind: "video", title: "Brutalist architecture tour", meta: "Video · 5:02 · saved from YouTube", score: "0.67" },
      { kind: "link", title: "Brutalism's 2026 revival", meta: "Link · dezeen.com · saved from X", score: "0.62" },
    ],
  },
  {
    query: "thread on getting your first 100 users",
    results: [
      { kind: "link", title: "How I got my first 100 users", meta: "Link · x.com · saved from X", score: "0.77" },
      { kind: "video", title: "0 to 100 users, a breakdown", meta: "Video · 9:30 · saved from YouTube", score: "0.66" },
      {
        kind: "link",
        title: "The cold-start playbook",
        meta: "Link · lennysnewsletter.com · saved from X",
        score: "0.61",
      },
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
