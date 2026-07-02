import { createFileRoute } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import type { SubStatus } from "@/../convex/billing/gating";

import { api } from "@/../convex/_generated/api";
import { PLANS } from "@/../convex/lib/plans";
import { UsageBar } from "@/components/app/usage-bar";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BillingSearchSchema = z.object({ success: z.string().optional() });

export const Route = createFileRoute("/app/settings/billing")({
  validateSearch: BillingSearchSchema,
  component: BillingPage,
});

const STATUS: Record<SubStatus, { label: string; tone: "positive" | "warn" | "muted" }> = {
  trialing: { label: "Trial", tone: "positive" },
  active: { label: "Active", tone: "positive" },
  past_due: { label: "Past due", tone: "warn" },
  comped: { label: "Complimentary", tone: "muted" },
  canceled: { label: "Ended", tone: "muted" },
  none: { label: "Ended", tone: "muted" },
};

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(ms);
}

function subline(status: SubStatus, trialEndsAt: number | null): string | null {
  if (status === "trialing") return trialEndsAt ? `Trial ends ${formatDate(trialEndsAt)}` : "Free trial";
  if (status === "past_due") return "Payment past due — update your card to keep access";
  if (status === "comped") return "Complimentary access";
  return null;
}

function BillingPage() {
  const { success } = Route.useSearch();
  const entitlement = useQuery(api.billing.subscriptions.myEntitlement);
  const openPortal = useAction(api.billing.queries.generateCustomerPortalUrl);
  const [busy, setBusy] = useState(false);

  if (!entitlement) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Plan & billing</h1>
        <div className="h-40 animate-pulse rounded-2xl border bg-card motion-reduce:animate-none" />
      </div>
    );
  }

  const { plan, status, trialEndsAt, itemCount, cap, pct } = entitlement;
  const meta = PLANS[plan];
  const badge = STATUS[status];
  const detail = subline(status, trialEndsAt);

  const manageBilling = async () => {
    setBusy(true);
    try {
      const { url } = await openPortal({ returnUrl: `${window.location.origin}/app/settings/billing` });
      window.location.href = url;
    } catch (error) {
      toast.error("Couldn't open billing", { description: error instanceof Error ? error.message : "Unknown error" });
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Plan & billing</h1>

      {success ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          Subscription active — welcome aboard.
        </p>
      ) : null}

      <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{meta.name}</span>
            {detail ? <span className="text-sm text-muted-foreground">{detail}</span> : null}
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase",
              badge.tone === "positive" && "bg-primary/10 text-primary",
              badge.tone === "warn" && "bg-[#fbf1de] text-[#b07e28]",
              badge.tone === "muted" && "bg-muted text-muted-foreground",
            )}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Saves indexed this plan</span>
            <span className="text-muted-foreground tabular-nums">
              {itemCount.toLocaleString()} of {cap.toLocaleString()}
            </span>
          </div>
          <UsageBar percent={pct} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <UpgradeModal trigger={<Button>Change plan</Button>} defaultPlan={plan === "pro" ? "starter" : "pro"} />
          <Button variant="ghost" onClick={manageBilling} disabled={busy}>
            Manage billing
          </Button>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        Your payment method, invoices, and cancellation live in the billing portal.
      </p>
    </div>
  );
}
