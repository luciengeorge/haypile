import { describe, expect, it } from "vitest";

import { allowsRichMedia, planFromProductId, planPrice } from "./plans";

const IDS = { starter: ["s_month", "s_year"], pro: ["p_month", "p_year"] };

describe("planFromProductId", () => {
  it("maps monthly + annual product ids to their plan", () => {
    expect(planFromProductId("s_month", IDS)).toBe("starter");
    expect(planFromProductId("s_year", IDS)).toBe("starter");
    expect(planFromProductId("p_month", IDS)).toBe("pro");
    expect(planFromProductId("p_year", IDS)).toBe("pro");
  });

  it("falls back to free for unknown or missing ids", () => {
    expect(planFromProductId(undefined, IDS)).toBe("free");
    expect(planFromProductId("nope", IDS)).toBe("free");
  });

  it("never matches an unset (undefined) env id", () => {
    expect(planFromProductId("p_month", { starter: [undefined], pro: [undefined] })).toBe("free");
  });
});

describe("planPrice", () => {
  it("returns monthly vs yearly price per plan", () => {
    expect(planPrice("starter", "monthly")).toBe(6);
    expect(planPrice("starter", "annual")).toBe(60);
    expect(planPrice("pro", "monthly")).toBe(12);
    expect(planPrice("pro", "annual")).toBe(120);
  });
});

describe("allowsRichMedia", () => {
  it("is Pro-only", () => {
    expect(allowsRichMedia("pro")).toBe(true);
    expect(allowsRichMedia("starter")).toBe(false);
    expect(allowsRichMedia("free")).toBe(false);
  });
});
