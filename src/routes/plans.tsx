import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/../convex/_generated/api";
import { type BillingCycle, PLANS, planPrice } from "@/../convex/lib/plans";
import { HaypileMark } from "@/components/brand/haypile-mark";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getSession } from "@/lib/functions/get-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plans")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: PlansPage,
});

type Plan = "starter" | "pro";

type PlanCardData = {
  id: Plan;
  features: string[];
  muted?: string[];
  recommended?: boolean;
};

const PLAN_CARDS: PlanCardData[] = [
  {
    id: "starter",
    features: ["Text & image search", "2,000 saves indexed", "All sources"],
    muted: ["Video & link search"],
  },
  {
    id: "pro",
    features: ["Everything in Starter", "Video & link search", "20,000 saves indexed", "Deep-link into video moments"],
    recommended: true,
  },
];

function PlansPage() {
  const createCheckout = useAction(api.billing.queries.createCheckout);
  const entitlement = useQuery(api.billing.subscriptions.myEntitlement);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  // Already subscribed (or the just-completed checkout synced) → the picker isn't for
  // them; forward into the app. This also self-heals the post-checkout sync lag.
  if (entitlement?.hasAccess) return <Navigate to="/app" replace />;

  const startTrial = async (plan: Plan) => {
    setLoadingPlan(plan);
    try {
      const successUrl = typeof window !== "undefined" ? `${window.location.origin}/app` : "/app";
      const { url } = await createCheckout({ plan, cycle, successUrl });
      window.location.href = url;
    } catch (error) {
      toast.error("Couldn't start checkout", { description: error instanceof Error ? error.message : "Unknown error" });
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center bg-background px-6 py-14">
      <div className="flex w-full flex-col items-center gap-4">
        <HaypileMark size={44} />
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">Start your 7-day trial</h1>
          <p className="max-w-md text-center text-pretty text-muted-foreground">
            Pick a plan to unlock Haypile. Free for 7 days — cancel anytime before it ends and you won't be charged.
          </p>
        </div>
        <CycleToggle cycle={cycle} onChange={setCycle} />
      </div>

      <div className="mt-10 grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        {PLAN_CARDS.map((card) => (
          <PlanCard
            key={card.id}
            card={card}
            price={planPrice(card.id, cycle)}
            cycle={cycle}
            loading={loadingPlan === card.id}
            disabled={loadingPlan !== null}
            onStart={() => startTrial(card.id)}
          />
        ))}
      </div>

      <p className="mt-6 max-w-md text-center text-sm text-muted-foreground">
        Card required. We remind you 3 days before your trial ends — cancel anytime before then and you won't be
        charged.
      </p>
    </div>
  );
}

function CycleToggle({ cycle, onChange }: { cycle: BillingCycle; onChange: (cycle: BillingCycle) => void }) {
  return (
    <div
      role="group"
      aria-label="Billing cycle"
      className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-secondary p-1"
    >
      <button
        type="button"
        aria-pressed={cycle === "monthly"}
        onClick={() => onChange("monthly")}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium transition-colors",
          cycle === "monthly" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={cycle === "annual"}
        onClick={() => onChange("annual")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          cycle === "annual" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Annual
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">2 months free</span>
      </button>
    </div>
  );
}

function PlanCard({
  card,
  price,
  cycle,
  loading,
  disabled,
  onStart,
}: {
  card: PlanCardData;
  price: number;
  cycle: BillingCycle;
  loading: boolean;
  disabled: boolean;
  onStart: () => void;
}) {
  const meta = PLANS[card.id];
  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 rounded-2xl bg-card p-7",
        card.recommended ? "border-2 border-primary shadow-[0_8px_24px_rgb(46_125_110/0.12)]" : "border border-border",
      )}
    >
      {card.recommended ? (
        <span className="absolute -top-3 left-7 rounded-full bg-[#c2933a] px-2.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase">
          Recommended
        </span>
      ) : null}
      <div className="flex flex-col gap-2.5">
        <span className={cn("text-[15px] font-semibold", card.recommended ? "text-primary" : "text-foreground")}>
          {meta.name}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-semibold tabular-nums">£{price}</span>
          <span className="text-[15px] text-muted-foreground">{cycle === "monthly" ? "/mo" : "/yr"}</span>
        </div>
        <span className="text-[13px] font-semibold text-primary">
          7 days free, then £{price}
          {cycle === "monthly" ? "/mo" : "/yr"}
        </span>
      </div>
      <div className="h-px bg-border" />
      <ul className="flex flex-col gap-3 text-sm">
        {card.features.map((feature) => (
          <li key={feature} className="text-foreground">
            {feature}
          </li>
        ))}
        {card.muted?.map((feature) => (
          <li key={feature} className="text-muted-foreground">
            {feature}
          </li>
        ))}
      </ul>
      <Button
        onClick={onStart}
        disabled={disabled}
        variant={card.recommended ? "default" : "outline"}
        className="mt-auto w-full"
      >
        {loading ? <Spinner /> : null}
        Start 7-day trial
      </Button>
    </div>
  );
}
