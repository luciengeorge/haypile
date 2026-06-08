import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/../convex/_generated/api";
import { type BillingCycle, PLANS, planPrice } from "@/../convex/lib/plans";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Plan = "starter" | "pro";

const PLAN_DETAILS: Record<Plan, { name: string; features: string[] }> = {
  starter: {
    name: PLANS.starter.name,
    features: ["2,000 saves", "Text & image search", "All your sources"],
  },
  pro: {
    name: PLANS.pro.name,
    features: ["20,000 saves", "Adds video & link search", "Priority support"],
  },
};

const CYCLES: { value: BillingCycle; label: string; note?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual", note: "2 months free" },
];

type UpgradeModalProps = {
  trigger?: React.ReactElement;
  defaultPlan?: Plan;
  reason?: string;
};

export function UpgradeModal({ trigger, defaultPlan = "pro", reason }: UpgradeModalProps) {
  const createCheckout = useAction(api.billing.queries.createCheckout);
  const [selected, setSelected] = useState<Plan>(defaultPlan);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const successUrl =
        typeof window !== "undefined" ? `${window.location.origin}/app/settings/billing?success=1` : "/";
      const result = await createCheckout({ plan: selected, cycle, successUrl });
      window.location.href = result.url;
    } catch (e) {
      toast.error("Checkout failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button>Upgrade</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>{reason ?? "Choose a plan to unlock everything."}</DialogDescription>
        </DialogHeader>
        <div role="group" aria-label="Billing cycle" className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-1">
            {CYCLES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={cycle === option.value}
                onClick={() => setCycle(option.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  cycle === option.value
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
                {option.note ? <span className="text-primary">{option.note}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(PLAN_DETAILS) as Plan[]).map((plan) => {
            const detail = PLAN_DETAILS[plan];
            const isSelected = selected === plan;
            return (
              <button
                type="button"
                key={plan}
                onClick={() => setSelected(plan)}
                className={cn(
                  "flex flex-col gap-2 rounded-md border p-4 text-left transition-colors",
                  isSelected ? "border-foreground bg-muted/40" : "hover:border-muted-foreground/50",
                )}
              >
                <span className="text-sm font-semibold">{detail.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  £{planPrice(plan, cycle)} {cycle === "monthly" ? "/ month" : "/ year"}
                </span>
                <ul className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                  {detail.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade} disabled={isLoading}>
            {isLoading ? <Spinner /> : null}
            {isLoading ? "Redirecting" : `Upgrade to ${PLAN_DETAILS[selected].name}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
