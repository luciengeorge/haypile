import { Text } from "@react-email/components";

import { BrandButton, EmailHeading, FallbackUrl, Signoff } from "./_components";
import { EmailLayout } from "./_layout";

interface MagicLinkEmailProps {
  url: string;
  appName?: string;
}

export default function MagicLinkEmail({ url, appName }: MagicLinkEmailProps) {
  const product = appName ?? process.env.APP_NAME ?? "Haypile";

  return (
    <EmailLayout preview={`Your sign-in link for ${product}`} appName={appName}>
      <EmailHeading>Sign in to {product}</EmailHeading>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        Tap the button to open your pile. For your security this link expires in 5 minutes and works only once.
      </Text>
      <BrandButton href={url}>Sign in</BrandButton>
      <FallbackUrl url={url} />
      <Text style={{ color: "#8a8d86" }} className="text-sm leading-5">
        If you didn't request this link, you can safely ignore this email.
      </Text>
      <Signoff />
    </EmailLayout>
  );
}
