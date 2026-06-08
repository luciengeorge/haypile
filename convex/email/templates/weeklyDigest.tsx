import { Button, Link, Section, Text } from "@react-email/components";

import { brandColor, EmailHeading, Signoff } from "./_components";
import { EmailLayout } from "./_layout";

interface DigestItem {
  title: string;
  source: string;
  url: string;
  author?: string;
}

interface WeeklyDigestEmailProps {
  name?: string;
  items: DigestItem[];
  appUrl?: string;
  appName?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  x: "X",
  github: "GitHub",
  youtube: "YouTube",
  pinterest: "Pinterest",
  reddit: "Reddit",
  browser: "Chrome",
};

export default function WeeklyDigestEmail({ name, items, appUrl, appName }: WeeklyDigestEmailProps) {
  const display = name?.split(" ")[0] ?? "there";
  const base = appUrl ?? process.env.SITE_URL ?? "https://haypile.app";

  return (
    <EmailLayout preview="From your Haypile — a few saves worth a second look" appName={appName}>
      <EmailHeading>From your Haypile</EmailHeading>
      <Text style={{ color: "#1b1a18" }} className="text-base leading-6">
        {display}, a few things you saved and might want again:
      </Text>

      <Section className="my-6">
        {items.map((item, index) => (
          <Section
            key={item.url}
            style={{ borderTop: index === 0 ? "none" : "1px solid #e2dccf" }}
            className="py-3"
          >
            <Link href={item.url} style={{ color: "#1b1a18" }} className="text-base font-semibold no-underline">
              {item.title}
            </Link>
            <Text style={{ color: "#8a8d86" }} className="m-0 mt-1 text-xs">
              {SOURCE_LABELS[item.source] ?? item.source}
              {item.author ? ` · @${item.author}` : ""}
            </Text>
          </Section>
        ))}
      </Section>

      <Section className="text-center">
        <Button
          href={`${base}/app`}
          style={{ backgroundColor: brandColor(), color: "#f7f4ec" }}
          className="inline-block rounded-lg px-6 py-3 text-sm font-semibold no-underline"
        >
          Open Haypile
        </Button>
      </Section>

      <Signoff />
    </EmailLayout>
  );
}
