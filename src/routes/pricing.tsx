import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { BillingCycleToggle } from "@/components/marketing/billing-cycle-toggle";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { type BillingCycle, PricingCards } from "@/components/marketing/pricing-cards";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const FAQS = [
  {
    q: 'What counts as a "saved item"?',
    a: "Anything you've bookmarked on a connected source — a tweet, a YouTube video, a Pin, a link, a starred repo. Each one is indexed and made searchable.",
  },
  {
    q: "Do you train AI on my data?",
    a: "Never. Your saves are embedded only to power your own private search — they're never used to train models or shared with anyone.",
  },
  {
    q: "What happens if I hit my plan's limit?",
    a: "We'll let you know and pause indexing new items. Nothing is ever deleted, and you can upgrade anytime to keep going.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel in one click. You'll keep full access until the end of your billing period.",
  },
];

function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-5 pt-16 pb-20 text-center sm:px-8 lg:pt-24">
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">Pricing</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
            Simple, honest pricing.
          </h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground">
            Start with a 7-day free trial — no credit card. Keep everything you've saved, searchable forever.
          </p>

          <div className="mt-9 flex justify-center">
            <BillingCycleToggle value={cycle} onChange={setCycle} />
          </div>

          <div className="mt-12">
            <PricingCards cycle={cycle} />
          </div>
        </section>

        <section className="border-t border-border/60 bg-card">
          <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="text-center font-display text-4xl font-semibold tracking-tight text-balance sm:text-[2.75rem]">
              Questions, answered.
            </h2>
            <dl className="mt-12 flex flex-col">
              {FAQS.map((faq) => (
                <div key={faq.q} className="border-t border-border/70 py-6 first:border-t-0">
                  <dt className="font-medium">{faq.q}</dt>
                  <dd className="mt-2 leading-relaxed text-muted-foreground">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
