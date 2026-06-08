import type { BillingCycle } from "@/components/marketing/pricing-cards";

import { cn } from "@/lib/utils";

const OPTIONS: { value: BillingCycle; label: string; note?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual", note: "2 months free" },
];

export function BillingCycleToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Billing cycle"
      className="inline-flex items-center gap-1 rounded-full bg-secondary p-1"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.note ? <span className="text-xs font-medium text-primary">{option.note}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
