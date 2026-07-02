import { Text } from "@react-email/components";

import { EmailHeading, Signoff } from "./_components";
import { EmailLayout } from "./_layout";

interface WelcomeEmailProps {
  name?: string;
  appName?: string;
}

export default function WelcomeEmail({ name, appName }: WelcomeEmailProps) {
  const display = name?.split(" ")[0] ?? "there";
  const product = appName ?? process.env.APP_NAME ?? "Haypile";

  return (
    <EmailLayout preview={`Welcome to ${product}`} appName={appName}>
      <EmailHeading>Welcome, {display}</EmailHeading>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        {product} gathers everything you've saved across the internet into one pile, and brings it back to life
        through search in plain language, the moment you need it.
      </Text>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        Three things to start with:
      </Text>
      <Text style={{ color: "#62655e" }} className="my-2 ml-1 text-base leading-7">
        • Connect a source so Haypile can start gathering
        <br />• Search the way you'd describe it, “that red car”, “income tax”
        <br />• Watch for your Monday “From your Haypile” digest
      </Text>
      <Signoff />
    </EmailLayout>
  );
}
