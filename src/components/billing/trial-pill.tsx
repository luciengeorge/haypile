import { useAction } from "convex/react";
import { toast } from "sonner";

import type { SubStatus } from "@/../convex/billing/gating";

import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

function label(daysLeft: number, urgent: boolean): string {
  if (!urgent) return `Trial · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
  if (daysLeft <= 0) return "Trial ends today";
  if (daysLeft === 1) return "Trial ends tomorrow";
  return `Trial ends in ${daysLeft} days`;
}

/** Sidebar-footer trial countdown. Renders only while the subscription is trialing. */
export function TrialPill({ status, trialEndsAt }: { status: SubStatus; trialEndsAt: number | null }) {
  const openPortal = useAction(api.billing.queries.generateCustomerPortalUrl);

  if (status !== "trialing" || !trialEndsAt) return null;

  const daysLeft = Math.max(0, Math.ceil((trialEndsAt - Date.now()) / DAY));
  const urgent = daysLeft <= 3;

  const manage = async () => {
    try {
      const { url } = await openPortal({ returnUrl: `${window.location.origin}/app` });
      window.location.href = url;
    } catch (error) {
      toast.error("Couldn't open billing", { description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]",
        urgent ? "border-[#e7d3a6] bg-[#fbf1de]" : "border-primary/20 bg-primary/10",
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", urgent ? "bg-[#c2933a]" : "bg-primary")} />
      <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{label(daysLeft, urgent)}</span>
      <button
        type="button"
        onClick={manage}
        className={cn("shrink-0 font-semibold", urgent ? "text-[#b07e28]" : "text-primary")}
      >
        Manage
      </button>
    </div>
  );
}
