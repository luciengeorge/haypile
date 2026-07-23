import { describe, expect, it } from "vitest";

import { dedupeExternalId, importItemsInputSchema, normalizeImportItems } from "./concierge";

describe("concierge import helpers", () => {
  it("accepts normalized item input", () => {
    const parsed = importItemsInputSchema.parse([
      {
        url: "https://example.com/pin",
        kind: "image",
        title: "Saved image",
        savedAt: 1_721_000_000_000,
        media: [{ type: "image", url: "https://example.com/image.jpg" }],
        links: [{ url: "https://example.com", title: "Example" }],
      },
    ]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.kind).toBe("image");
  });

  it("derives a stable dedupe key from the url when externalId is absent", () => {
    expect(dedupeExternalId({ url: "https://example.com/save" })).toBe("https://example.com/save");
    expect(dedupeExternalId({ externalId: "pin-123", url: "https://example.com/save" })).toBe("pin-123");
    expect(
      normalizeImportItems([{ url: "https://example.com/save", kind: "article", savedAt: 1 }])[0]?.externalId,
    ).toBe("https://example.com/save");
  });
});
