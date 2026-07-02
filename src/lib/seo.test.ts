import { describe, expect, it } from "vitest";

import { seo, SITE_URL } from "./seo";

// Narrow a meta descriptor to a { name, content } shape for assertions.
function robots(meta: ReturnType<typeof seo>["meta"]): string | undefined {
  const tag = meta.find((m) => (m as { name?: string }).name === "robots") as { content?: string } | undefined;
  return tag?.content;
}

describe("seo", () => {
  it("builds title, description, OG, Twitter, and canonical for an indexable page", () => {
    const { meta, links } = seo({ title: "Pricing · Haypile", description: "Plans and pricing.", path: "/pricing" });
    expect(meta).toContainEqual({ title: "Pricing · Haypile" });
    expect(meta).toContainEqual({ name: "description", content: "Plans and pricing." });
    expect(meta).toContainEqual({ property: "og:title", content: "Pricing · Haypile" });
    expect(meta).toContainEqual({ property: "og:description", content: "Plans and pricing." });
    expect(meta).toContainEqual({ property: "og:url", content: `${SITE_URL}/pricing` });
    expect(meta).toContainEqual({ name: "twitter:title", content: "Pricing · Haypile" });
    expect(meta).toContainEqual({ name: "twitter:description", content: "Plans and pricing." });
    expect(links).toContainEqual({ rel: "canonical", href: `${SITE_URL}/pricing` });
  });

  it("does not set a robots tag for indexable pages (root default applies)", () => {
    expect(robots(seo({ title: "t", description: "d", path: "/" }).meta)).toBeUndefined();
  });

  it("marks noindex pages noindex and omits the canonical", () => {
    const { meta, links } = seo({ title: "App", description: "d", path: "/app", noindex: true });
    expect(robots(meta)).toBe("noindex, follow");
    expect(links).toEqual([]);
  });

  it("roots canonical and og:url at the site origin + path", () => {
    const { meta, links } = seo({ title: "t", description: "d", path: "/privacy" });
    expect(links).toContainEqual({ rel: "canonical", href: `${SITE_URL}/privacy` });
    expect(meta).toContainEqual({ property: "og:url", content: `${SITE_URL}/privacy` });
  });
});
