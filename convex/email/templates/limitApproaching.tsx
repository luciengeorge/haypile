import { Text } from "@react-email/components";

import { BrandButton, EmailHeading, Signoff } from "./_components";
import { EmailLayout } from "./_layout";

interface LimitEmailProps {
  name?: string;
  planName?: string;
  itemCount?: number;
  cap?: number;
  appUrl?: string;
  appName?: string;
}

export default function LimitApproachingEmail({
  name,
  planName = "Starter",
  itemCount = 0,
  cap = 2000,
  appUrl,
  appName,
}: LimitEmailProps) {
  const display = name?.split(" ")[0] ?? "there";
  const base = appUrl ?? process.env.SITE_URL ?? "https://haypile.app";

  return (
    <EmailLayout preview={`You've indexed ${itemCount.toLocaleString()} of ${cap.toLocaleString()} saves`} appName={appName}>
      <EmailHeading>You're close to your limit</EmailHeading>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        {display}, you've indexed{" "}
        <strong>
          {itemCount.toLocaleString()} of {cap.toLocaleString()}
        </strong>{" "}
        saves on {planName}. Upgrade to Pro for <strong>20,000 saves</strong> plus video &amp; link search, so nothing
        you save goes unindexed.
      </Text>
      <BrandButton href={`${base}/app/settings/billing`}>Upgrade to Pro</BrandButton>
      <Text style={{ color: "#62655e" }} className="text-sm leading-5">
        You can stay on {planName} — new saves just pause when you reach {cap.toLocaleString()}, and nothing is ever
        deleted.
      </Text>
      <Signoff />
    </EmailLayout>
  );
}
