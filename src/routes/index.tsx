import { createFileRoute, Link } from "@tanstack/react-router";

import { HeroSearchPreview } from "@/components/marketing/hero-search-preview";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MultimodalPreview } from "@/components/marketing/multimodal-preview";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const SOURCES = ["X", "YouTube", "Reddit", "Pinterest", "GitHub", "Chrome"];

const STEPS = [
  {
    n: "01",
    title: "Connect your accounts",
    body: "Link X, YouTube, Reddit and more in two clicks. Haypile imports everything you've already bookmarked.",
  },
  {
    n: "02",
    title: "We make it searchable",
    body: "Every save — text, image, video, link — is read and indexed by AI, including what's inside the media.",
  },
  {
    n: "03",
    title: "Search in plain words",
    body: "Ask for what you remember. Haypile finds it by meaning — not just exact keywords or tags.",
  },
];

const MODALITIES = [
  { title: "Images", body: "Objects, scenes, and even text inside screenshots.", icon: ImageGlyph },
  { title: "Video moments", body: "Jump to the exact second that matches what you asked.", icon: VideoGlyph },
  { title: "Link contents", body: "We read the page behind every link you saved.", icon: LinkGlyph },
];

function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium tracking-[0.1em] text-primary uppercase">
              <span className="size-1.5 rounded-full bg-gold" />
              Everything you've saved, in one place
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl">
              Find anything <span className="italic">you ever saved.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Haypile pulls together everything you've bookmarked across X, YouTube, Reddit, Pinterest, GitHub and your
              browser — then lets you search it all in plain language. Even what's inside your images and videos.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button size="lg" nativeButton={false} render={<Link to="/signup" />}>
                Start free trial
                <ArrowUpRight />
              </Button>
              <Button size="lg" variant="ghost" nativeButton={false} render={<Link to="/" hash="how-it-works" />}>
                <PlayCircle />
                See how it works
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">7-day free trial · no credit card · cancel anytime</p>
          </div>

          <HeroSearchPreview />
        </section>

        {/* Sources strip */}
        <section id="sources" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pb-16 sm:px-8">
          <p className="text-center text-xs font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
            Connects with the places you already save
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-medium text-foreground/80">
            {SOURCES.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-card">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">How it works</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-[2.75rem]">
              From scattered saves to total recall.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              Connect your accounts once. Haypile imports and indexes everything. Then you just ask.
            </p>

            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="border-t border-border pt-5">
                  <p className="font-display text-3xl font-semibold text-primary tabular-nums">{step.n}</p>
                  <h3 className="mt-4 font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Multimodal */}
        <section className="bg-secondary/50">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
            <MultimodalPreview />
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">Multimodal search</p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance sm:text-[2.75rem]">
                It reads your images and videos — not just the words.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                Most tools only match text. Haypile embeds the actual pixels and frames, so you can find a screenshot, a
                product in a photo, or a single moment in a video just by describing it.
              </p>
              <ul className="mt-8 flex flex-col gap-5">
                {MODALITIES.map((modality) => (
                  <li key={modality.title} className="flex gap-3.5">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <modality.icon />
                    </span>
                    <div>
                      <h3 className="text-sm font-medium">{modality.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{modality.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border/60 bg-card">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center sm:px-8">
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">Pricing</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Simple, honest pricing.
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
              Start with a 7-day free trial. No credit card required.
            </p>
            <div className="mt-12">
              <PricingCards />
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 text-center sm:px-8">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Everything you saved is waiting to be found.
            </h2>
            <p className="mt-5 text-primary-foreground/75">Connect your first source in under a minute.</p>
            <div className="mt-9 flex justify-center">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
                nativeButton={false}
                render={<Link to="/signup" />}
              >
                Start free trial
                <ArrowUpRight />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      data-icon="inline-end"
    >
      <path d="M8 16 16 8M9 8h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayCircle() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      data-icon="inline-start"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l5.5-3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ImageGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-4">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-4 3 2.5L16 11l3 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VideoGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-4">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-2.5v9L16 14z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-4">
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" strokeLinecap="round" />
      <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" strokeLinecap="round" />
    </svg>
  );
}
