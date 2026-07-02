import type { PlanId } from "@/../convex/lib/plans";

import { PLANS } from "@/../convex/lib/plans";
import { UpgradeModal } from "@/components/billing/upgrade-modal";

type Props = { plan: PlanId; itemCount: number; cap: number; pct: number };

/**
 * App-wide usage banner. Warns at 80% of the plan cap, then flips to a "reached"
 * state at 100% (indexing paused). Only shown to non-Pro plans — Pro is the upgrade
 * target, so there's nothing to nudge toward.
 */
export function LimitBanner({ plan, itemCount, cap, pct }: Props) {
  if (plan === "pro" || cap === 0 || pct < 80) return null;

  const planName = PLANS[plan].name;

  if (pct >= 100) {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-foreground px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-background">You've reached your {cap.toLocaleString()}-save limit</span>
          <span className="text-[13px] text-background/70">
            New saves are paused. Nothing is deleted. Upgrade to keep indexing.
          </span>
        </div>
        <UpgradeModal
          defaultPlan="pro"
          reason="You've hit your Starter limit. Pro indexes 20,000 saves and adds video & link search."
          trigger={
            <button
              type="button"
              className="shrink-0 rounded-lg bg-[#c2933a] px-4 py-2 text-[13px] font-bold text-foreground"
            >
              Upgrade to Pro
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#ead9b4] bg-[#fbf3e2] px-5 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground">
          You've indexed {itemCount.toLocaleString()} of {cap.toLocaleString()} saves
        </span>
        <span className="text-[13px] text-muted-foreground">
          Close to your {planName} limit. Upgrade to Pro for 20,000 saves + video search.
        </span>
      </div>
      <UpgradeModal
        defaultPlan="pro"
        reason={`You're close to your ${planName} limit. Pro indexes 20,000 saves and adds video & link search.`}
        trigger={
          <button
            type="button"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
          >
            Upgrade to Pro
          </button>
        }
      />
    </div>
  );
}
