import { createFileRoute } from "@tanstack/react-router";

import { seo } from "@/lib/seo";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Haypile";
const CONTACT_EMAIL = "privacy@luciengeorge.com";
const LAST_UPDATED = "2026-07-01";

export const Route = createFileRoute("/(legal)/_layout/privacy")({
  head: () =>
    seo({
      title: "Privacy Policy · Haypile",
      description: "How Haypile collects, uses and protects your personal data. Operated from the United Kingdom.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="prose max-w-none dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <h2>Who we are</h2>
      <p>
        {APP_NAME} is a search layer over the things you've saved across the internet, operated from the United Kingdom.
        We are the data controller for the personal data described here. For any privacy request, contact{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We process personal data under UK GDPR and, where
        applicable, EU GDPR.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your name and email. Sign-in is passwordless (a one-time magic link, or
          "Continue with X"), so we never store a password.
        </li>
        <li>
          <strong>Saved content:</strong> the items you've saved on sources you connect (for example your X bookmarks),
          their text, media, links, and timestamps, which we index so you can search them.
        </li>
        <li>
          <strong>Connection tokens:</strong> OAuth access/refresh tokens for the sources you connect, used only to sync
          your saves on your behalf.
        </li>
        <li>
          <strong>Usage data:</strong> product analytics about how the app is used (via PostHog) and error diagnostics
          (via Sentry).
        </li>
        <li>
          <strong>Billing data:</strong> your subscription status. Card details are handled by our payment provider,
          Polar, acting as Merchant of Record; we never see or store your card.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        To provide the service (sync and search your saved content), to authenticate you, to process subscriptions, to
        keep the service secure and reliable, and to communicate with you about your account. Search embeddings are
        generated with Google Vertex AI. We do not sell your personal data, and we do not use your saved content to
        train models.
      </p>

      <h2>Sub-processors</h2>
      <p>We share data only with providers that help us run {APP_NAME}:</p>
      <ul>
        <li>Convex, application database and hosting</li>
        <li>Vercel, web hosting</li>
        <li>Google Vertex AI, generating search embeddings</li>
        <li>Polar, payments (Merchant of Record)</li>
        <li>Resend, transactional email</li>
        <li>PostHog, product analytics</li>
        <li>Sentry, error monitoring</li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep your data while your account is active. When you delete your account, your saved items, embeddings, sync
        state, and preferences are permanently removed. Backups cycle out on a rolling basis.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>
          <strong>Access / portability</strong>, download your data via Settings → Danger zone → Export.
        </li>
        <li>
          <strong>Erasure</strong>, delete your account (and all saved data) via Settings → Danger zone.
        </li>
        <li>
          <strong>Rectification</strong>, update your name and email via Settings → Profile.
        </li>
        <li>You may also object to or restrict processing, and complain to the UK ICO (or your local authority).</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </article>
  );
}
