import { Section, Text } from "@react-email/components";

import { BrandButton, EmailHeading, Signoff } from "./_components";
import { EmailLayout } from "./_layout";

interface GraceEndingEmailProps {
  name?: string;
  deleteOn: string; // human-readable date, e.g. "5 Aug 2026"
  appUrl?: string;
  appName?: string;
}

export default function GraceEndingEmail({ name, deleteOn, appUrl, appName }: GraceEndingEmailProps) {
  const display = name?.split(" ")[0] ?? "there";
  const base = appUrl ?? process.env.SITE_URL ?? "https://haypile.app";

  return (
    <EmailLayout preview={`Your Haypile data is scheduled for deletion on ${deleteOn}`} appName={appName}>
      <EmailHeading>Your data will be deleted soon</EmailHeading>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        {display}, your Haypile subscription ended, and your saved items are scheduled for deletion on{" "}
        <strong>{deleteOn}</strong>. Reactivate before then to keep everything, searches, sources and all.
      </Text>
      <BrandButton href={`${base}/app/settings/billing`}>Reactivate my plan</BrandButton>
      <Section style={{ backgroundColor: "#f2eee5", border: "1px solid #e2dccf" }} className="my-6 rounded-lg px-4 py-3">
        <Text style={{ color: "#62655e" }} className="m-0 text-sm leading-5">
          After {deleteOn}, your indexed saves and search history are permanently removed. This can't be undone.
        </Text>
      </Section>
      <Signoff />
    </EmailLayout>
  );
}
