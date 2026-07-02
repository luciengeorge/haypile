import { Link } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/../convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(ms);
}

/** Full-screen takeover shown when a subscription has lapsed. Data is retained 30 days. */
export function LockedWall({ purgeAt }: { purgeAt: number | null }) {
  const openPortal = useAction(api.billing.queries.generateCustomerPortalUrl);
  const [busy, setBusy] = useState(false);

  const reactivate = async () => {
    setBusy(true);
    try {
      const { url } = await openPortal({ returnUrl: `${window.location.origin}/app` });
      window.location.href = url;
    } catch (error) {
      toast.error("Couldn't open billing", { description: error instanceof Error ? error.message : "Unknown error" });
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border bg-card px-10 py-11 shadow-[0_12px_40px_rgb(27_26_24/0.08)]">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <LockIcon />
        </span>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your Haypile is paused</h1>
          <p className="text-pretty text-muted-foreground">
            Your subscription ended. Everything you saved is safe for 30 more days — reactivate and pick up right where
            you left off.
          </p>
        </div>
        {purgeAt ? (
          <div className="flex w-full items-center gap-2.5 rounded-xl border border-[#e7d3a6] bg-[#fbf1de] px-3.5 py-2.75">
            <ClockIcon />
            <span className="text-[13px] text-[#8a6a22]">
              Data is deleted on {formatDate(purgeAt)} unless you reactivate.
            </span>
          </div>
        ) : null}
        <div className="mt-1 flex w-full flex-col items-center gap-3">
          <button
            type="button"
            onClick={reactivate}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Spinner /> : null}
            Reactivate my plan
          </button>
          <Link to="/plans" className="text-sm font-medium text-primary">
            See all plans
          </Link>
        </div>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="text-muted-foreground"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#b07e28"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M12 7v5l3 2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
