import type { ReactNode } from "react";

import { Button, Heading, Section, Text } from "@react-email/components";

/**
 * Shared email building blocks, Haypile "Mineral" brand.
 * - BRAND_COLOR, CTA/accent hex (defaults to verdigris)
 * - SUPPORT_EMAIL, reply-to / help address (falls back to RESEND_FROM_EMAIL)
 * - EMAIL_SIGNOFF, signature line, e.g. ", The Haypile team"
 */

export function brandColor(): string {
  return process.env.BRAND_COLOR ?? "#2e7d6e";
}

export function supportEmail(): string | undefined {
  return process.env.SUPPORT_EMAIL ?? process.env.RESEND_FROM_EMAIL;
}

/** Display heading in the brand serif. */
export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <Heading
      style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#1b1a18" }}
      className="mt-0 mb-4 text-2xl font-bold tracking-tight"
    >
      {children}
    </Heading>
  );
}

/** Primary CTA button (verdigris). Pass `destructive` for the brand red. */
export function BrandButton({
  href,
  children,
  destructive = false,
}: {
  href: string;
  children: ReactNode;
  destructive?: boolean;
}) {
  return (
    <Section className="my-7 text-center">
      <Button
        href={href}
        style={{ backgroundColor: destructive ? "#b23a2e" : brandColor(), color: "#f7f4ec" }}
        className="inline-block rounded-lg px-6 py-3 text-sm font-semibold no-underline"
      >
        {children}
      </Button>
    </Section>
  );
}

/** Fallback URL block shown under CTAs for clients that strip buttons. */
export function FallbackUrl({ url }: { url: string }) {
  return (
    <Text style={{ color: "#8a8d86" }} className="text-sm leading-5">
      Or paste this link into your browser:
      <br />
      <a href={url} style={{ color: "#2e7d6e", wordBreak: "break-all" }}>
        {url}
      </a>
    </Text>
  );
}

/** Security panel for sensitive emails (account deletion, email change). */
export function SecurityNotice({ action }: { action: string }) {
  const support = supportEmail();
  return (
    <Section style={{ backgroundColor: "#f2eee5", border: "1px solid #e2dccf" }} className="my-6 rounded-lg px-4 py-3">
      <Text style={{ color: "#1b1a18" }} className="m-0 text-sm font-semibold">
        Didn't request this?
      </Text>
      <Text style={{ color: "#62655e" }} className="mt-1 mb-0 text-sm leading-5">
        If you didn't {action}, you can safely ignore this email
        {support ? (
          <>
            {" "}
, or email{" "}
            <a href={`mailto:${support}`} style={{ color: "#2e7d6e" }}>
              {support}
            </a>{" "}
            if you're concerned
          </>
        ) : null}
        .
      </Text>
    </Section>
  );
}

/** Sign-off line. Renders only if EMAIL_SIGNOFF is set. */
export function Signoff() {
  const signoff = process.env.EMAIL_SIGNOFF;
  if (!signoff) return null;
  return (
    <Text style={{ color: "#62655e" }} className="mt-6 text-base leading-6">
      {signoff}
    </Text>
  );
}
