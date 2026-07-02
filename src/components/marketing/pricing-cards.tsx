import { Link } from "@tanstack/react-router";

import { PLANS, type PlanId } from "@/../convex/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BillingCycle = "monthly" | "annual";

type Tier = {
  id: Extract<PlanId, "starter" | "pro">;
  blurb: string;
  features: string[];
  popular?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "starter",
    blurb: "For getting your saves under control.",
    features: ["2,000 saved items", "All 6 sources connected", "Text & image search", "Weekly digest email"],
  },
  {
    id: "pro",
    blurb: "For power users with huge libraries.",
    features: ["Everything in Starter", "20,000 saved items", "Video & link deep search", "Priority indexing"],
    popular: true,
  },
];

export function PricingCards({ cycle = "monthly" }: { cycle?: BillingCycle }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
      {TIERS.map((tier) => {
        const plan = PLANS[tier.id];
        const price = cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
        const unit = cycle === "monthly" ? "/ month" : "/ year";
        return (
          <div
            key={tier.id}
            className={cn(
              "flex flex-col rounded-2xl bg-card p-7 ring-1 ring-foreground/10",
              tier.popular && "ring-2 ring-primary",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">{plan.name}</h3>
              {tier.popular ? (
                <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-medium tracking-[0.1em] text-primary uppercase">
                  Most popular
                </span>
              ) : null}
            </div>

            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="font-display text-5xl font-semibold tracking-tight tabular-nums">£{price}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{tier.blurb}</p>

            <hr className="my-6 border-border/70" />

            <ul className="flex flex-1 flex-col gap-3 text-sm">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  >
                    <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              variant={tier.popular ? "default" : "outline"}
              className="mt-7"
              nativeButton={false}
              render={<Link to="/signup" />}
            >
              Start free trial
            </Button>
          </div>
        );
      })}
    </div>
  );
}
