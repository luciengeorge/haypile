import { Text } from "@react-email/components";

import { BrandButton, EmailHeading, Signoff } from "./_components";
import { EmailLayout } from "./_layout";

interface LimitEmailProps {
  name?: string;
  planName?: string;
  cap?: number;
  appUrl?: string;
  appName?: string;
}

export default function LimitReachedEmail({ name, planName = "Starter", cap = 2000, appUrl, appName }: LimitEmailProps) {
  const display = name?.split(" ")[0] ?? "there";
  const base = appUrl ?? process.env.SITE_URL ?? "https://haypile.app";

  return (
    <EmailLayout preview={`You've reached your ${cap.toLocaleString()}-save limit`} appName={appName}>
      <EmailHeading>You've reached your limit</EmailHeading>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        {display}, you've indexed all <strong>{cap.toLocaleString()}</strong> of your {planName} saves, so new saves are
        paused, nothing is deleted. Upgrade to Pro for <strong>20,000 saves</strong> and keep everything indexing.
      </Text>
      <BrandButton href={`${base}/app/settings/billing`}>Upgrade to Pro</BrandButton>
      <Text style={{ color: "#62655e" }} className="text-sm leading-5">
        Your saved items stay fully searchable, only new items pause until you upgrade.
      </Text>
      <Signoff />
    </EmailLayout>
  );
}
