import { SearchPreview } from "@/components/search-preview";

// The waitlist gate's teaser: the shared SearchPreview plus a small caption.
export function WaitlistTeaserCard() {
  return (
    <div className="flex w-full max-w-[37.5rem] flex-col gap-3.5">
      <SearchPreview />
      <div className="flex w-full items-center justify-center gap-2 pt-0.5">
        <div className="size-1.25 shrink-0 rounded-full bg-gold" />
        <div className="text-[13px]/4 tracking-[0.04em] text-muted-foreground">
          A glimpse of what you are waiting for
        </div>
      </div>
    </div>
  );
}
