import { createFileRoute } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { api } from "@/../convex/_generated/api";
import { getPlanLimit, PLANS, type PlanId } from "@/../convex/lib/plans";
import { UsageBar } from "@/components/app/usage-bar";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BillingSearchSchema = z.object({ success: z.string().optional() });

export const Route = createFileRoute("/app/settings/billing")({
  validateSearch: BillingSearchSchema,
  component: BillingPage,
});

function BillingPage() {
  const { success } = Route.useSearch();
  const sub = useQuery(api.billing.queries.mySubscription);
  const usage = useQuery(api.items.usage);
  const openPortal = useAction(api.billing.queries.generateCustomerPortalUrl);
  const [busy, setBusy] = useState(false);

  if (sub === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Plan & billing</h1>
        <div className="h-40 animate-pulse rounded-2xl border bg-card motion-reduce:animate-none" />
      </div>
    );
  }

  const plan: PlanId = sub?.plan ?? "free";
  const meta = PLANS[plan];
  const isPaid = plan !== "free";
  const cap = getPlanLimit(plan, "maxItems") ?? 0;
  const count = usage?.itemCount ?? 0;
  const pct = cap > 0 ? Math.min(100, Math.round((count / cap) * 100)) : 0;

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
            <span className="text-sm text-muted-foreground">
              {isPaid ? `£${meta.monthlyPrice} / month` : "14-day trial · text & image search"}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase",
              isPaid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {isPaid ? "Active" : "Trial"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Saves indexed this plan</span>
            <span className="text-muted-foreground tabular-nums">
              {count.toLocaleString()} of {cap.toLocaleString()}
            </span>
          </div>
          <UsageBar percent={pct} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isPaid ? (
            <>
              <UpgradeModal trigger={<Button>Change plan</Button>} defaultPlan={plan === "pro" ? "starter" : "pro"} />
              <Button variant="ghost" onClick={manageBilling} disabled={busy}>
                Manage billing
              </Button>
            </>
          ) : (
            <UpgradeModal trigger={<Button>Upgrade</Button>} />
          )}
        </div>
      </section>

      {isPaid ? (
        <p className="text-sm text-muted-foreground">
          Your payment method, invoices, and cancellation live in the billing portal.
        </p>
      ) : null}
    </div>
  );
}
