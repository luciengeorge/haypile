import { Text } from "@react-email/components";

import { BrandButton, EmailHeading, FallbackUrl, Signoff } from "./_components";
import { EmailLayout } from "./_layout";

interface VerifyEmailProps {
  url: string;
  appName?: string;
}

export default function VerifyEmail({ url, appName }: VerifyEmailProps) {
  const product = appName ?? process.env.APP_NAME ?? "Haypile";

  return (
    <EmailLayout preview={`Verify your email for ${product}`} appName={appName}>
      <EmailHeading>Verify your email</EmailHeading>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        Confirm this address to keep your {product} secure. This link expires in 1 hour.
      </Text>
      <BrandButton href={url}>Verify email</BrandButton>
      <FallbackUrl url={url} />
      <Signoff />
    </EmailLayout>
  );
}
