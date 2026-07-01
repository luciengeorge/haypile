import { createFileRoute } from "@tanstack/react-router";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Haypile";
const CONTACT_EMAIL = "support@luciengeorge.com";
const LAST_UPDATED = "2026-07-01";

export const Route = createFileRoute("/(legal)/_layout/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="prose max-w-none dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <h2>The service</h2>
      <p>
        {APP_NAME} indexes the content you've saved on sources you connect and lets you search it, including a
        multimodal search over images and video. Using the service means you accept these Terms.
      </p>

      <h2>Your account</h2>
      <p>
        You must be at least 16 and provide an accurate email. Sign-in is passwordless; keep access to your email
        secure, as anyone with it can sign in. You're responsible for activity under your account.
      </p>

      <h2>Connected sources</h2>
      <p>
        You may connect third-party accounts (such as X) so we can sync your own saved items on your behalf. You must
        have the right to access that content and must comply with each source's own terms. We access only your saves
        and only to provide the service.
      </p>

      <h2>Subscriptions and billing</h2>
      <p>
        Paid plans are billed in GBP via Polar, our Merchant of Record. Subscriptions auto-renew each period until
        canceled. Cancel any time in Settings → Billing; access continues until the end of the paid period. Refunds are
        handled by Polar in line with its policies and applicable law. Prices may change with notice; changes apply from
        your next renewal.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don't misuse the service: no unlawful content, no attempts to breach security or access others' data, and no
        reselling the service without permission.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Your saved content remains yours. The {APP_NAME} software, brand, and design remain ours. You grant us the
        limited rights needed to store, index, and display your content back to you.
      </p>

      <h2>Disclaimer and liability</h2>
      <p>
        The service is provided "as is", without warranties, to the fullest extent permitted by law. We aren't liable
        for indirect or consequential losses, and our total liability is limited to the amount you paid us in the prior
        twelve months. Nothing here excludes liability that can't be excluded by law.
      </p>

      <h2>Termination</h2>
      <p>
        You can delete your account at any time in Settings → Danger zone. We may suspend or terminate accounts that
        breach these Terms.
      </p>

      <h2>Governing law</h2>
      <p>These Terms are governed by the laws of England and Wales.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </article>
  );
}
