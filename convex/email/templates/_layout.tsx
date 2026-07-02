import type { ReactNode } from "react";

import { Body, Container, Head, Hr, Html, Link, Preview, Section, Tailwind, Text } from "@react-email/components";

import { supportEmail } from "./_components";

interface EmailLayoutProps {
  preview: string;
  appName?: string;
  children: ReactNode;
}

/**
 * Shared layout for all transactional emails, Haypile "Mineral" brand (bone paper,
 * ink, verdigris). Email-safe HTML via React Email's Tailwind wrapper; brand colors
 * are set as inline styles for reliable rendering across Gmail/Outlook/etc.
 */
export function EmailLayout({ preview, appName, children }: EmailLayoutProps) {
  const name = appName ?? process.env.APP_NAME ?? "Haypile";
  const support = supportEmail();

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body style={{ backgroundColor: "#f2eee5" }} className="m-0 p-0 font-sans">
          <Container
            style={{ backgroundColor: "#faf8f2", border: "1px solid #e2dccf" }}
            className="mx-auto my-10 w-full max-w-[544px] rounded-2xl px-8 py-10"
          >
            <Section className="mb-8">
              <Text
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#1b1a18" }}
                className="m-0 text-xl font-bold tracking-tight"
              >
                Haypile
              </Text>
            </Section>

            {children}

            <Hr style={{ borderColor: "#e2dccf" }} className="my-8" />

            <Section>
              <Text style={{ color: "#8a8d86" }} className="m-0 text-xs leading-5">
                You received this email because you have an account with {name}.
                {support ? (
                  <>
                    {" "}
                    Questions? Reach us at{" "}
                    <Link href={`mailto:${support}`} style={{ color: "#2e7d6e" }}>
                      {support}
                    </Link>
                    .
                  </>
                ) : null}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
