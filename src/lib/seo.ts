const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Haypile";

type SeoInput = {
  /** Full document title, e.g. "Pricing · Haypile". */
  title: string;
  description: string;
  /** Route path from the site root, e.g. "/pricing" (drives canonical + og:url). */
  path: string;
  /** Private/thin pages (app, auth, checkout) → noindex + no canonical. */
  noindex?: boolean;
};

/**
 * Per-route head tags: title, description, Open Graph, Twitter, canonical, robots.
 * Global tags (charset, icons, og:image, twitter:card, default title) stay in the root
 * route. Canonical/og:url are per-page here — the root deliberately sets neither, so
 * every page gets its own instead of all claiming the homepage.
 */
export function seo({ title, description, path, noindex }: SeoInput) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
    ],
    links: noindex ? [] : [{ rel: "canonical", href: url }],
  };
}

export { APP_NAME, SITE_URL };
