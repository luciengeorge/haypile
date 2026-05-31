import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { UpgradeModal } from "./upgrade-modal";

interface PaywallProps {
  title?: string;
  description?: string;
  reason?: string;
  trigger?: ReactNode;
}

/**
 * Inline paywall card. Drop this in place of any feature you want to gate.
 * Pair with a server-side `requirePlan(ctx, "pro")` for security — the paywall
 * is presentation only.
 */
export function Paywall({
  title = "Upgrade to unlock",
  description = "This feature is included in Starter and Pro plans.",
  reason,
  trigger,
}: PaywallProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <UpgradeModal trigger={trigger} reason={reason} />
      </CardContent>
    </Card>
  );
}
