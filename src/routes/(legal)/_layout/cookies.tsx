import { createFileRoute } from "@tanstack/react-router";

import { seo } from "@/lib/seo";

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Haypile";
const LAST_UPDATED = "2026-07-01";

export const Route = createFileRoute("/(legal)/_layout/cookies")({
  head: () =>
    seo({
      title: "Cookie Policy · Haypile",
      description: "The cookies and local storage Haypile uses, and why.",
      path: "/cookies",
    }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <article className="prose max-w-none dark:prose-invert">
      <h1>Cookie Policy</h1>
      <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      <p>{APP_NAME} uses a small number of cookies and similar local storage. Here's what and why.</p>

      <h2>Essential</h2>
      <ul>
        <li>
          <code>better-auth.session_token</code> — keeps you signed in. Required for the app to work.
        </li>
      </ul>

      <h2>Analytics</h2>
      <p>
        We use PostHog to understand how the app is used so we can improve it. PostHog sets cookies to recognize
        returning sessions. This data is not sold or used for advertising.
      </p>

      <h2>Marketing</h2>
      <p>We do not use marketing or advertising cookies.</p>
    </article>
  );
}
