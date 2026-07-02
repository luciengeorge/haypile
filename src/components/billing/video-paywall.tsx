import { useState } from "react";

import { planPrice } from "@/../convex/lib/plans";
import { UpgradeModal } from "@/components/billing/upgrade-modal";

/**
 * Promo card upselling Pro's video/deep-link search. Shown to non-Pro users on the
 * search landing; dismissible for the session ("Maybe later").
 */
export function VideoPaywall() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex max-w-md flex-col gap-5 rounded-2xl border bg-card p-7 shadow-[0_12px_40px_rgb(27_26_24/0.08)]">
      <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-xl bg-foreground">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <span className="relative flex size-11 items-center justify-center rounded-full bg-background/90">
          <LockIcon />
        </span>
        <span className="absolute bottom-3 left-3 rounded-md bg-black/35 px-2 py-0.5 text-[11px] font-semibold text-background">
          0:42 · red car turning
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary uppercase">
          Pro feature
        </span>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Search inside your videos</h2>
        <p className="text-sm text-muted-foreground">
          Jump to the exact moment in any saved video or reel. Deep-link search is included in Pro.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <UpgradeModal
          defaultPlan="pro"
          reason="Pro adds video & link search: jump to the exact moment in any saved video."
          trigger={
            <button
              type="button"
              className="rounded-lg bg-primary px-4.5 py-2.75 text-sm font-semibold text-primary-foreground"
            >
              Upgrade to Pro · £{planPrice("pro", "monthly")}/mo
            </button>
          }
        />
        <button type="button" onClick={() => setDismissed(true)} className="text-sm font-medium text-muted-foreground">
          Maybe later
        </button>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-foreground"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
