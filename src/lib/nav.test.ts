import { describe, expect, it } from "vitest";

import { isNavActive } from "./nav";

describe("isNavActive", () => {
  it("exact items match only their own path", () => {
    expect(isNavActive("/app", "/app", true)).toBe(true);
    expect(isNavActive("/app", "/app/library", true)).toBe(false);
  });

  it("non-exact items match their path and nested routes", () => {
    expect(isNavActive("/app/settings", "/app/settings")).toBe(true);
    expect(isNavActive("/app/settings", "/app/settings/billing")).toBe(true);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(isNavActive("/app/source", "/app/sources")).toBe(false);
    expect(isNavActive("/app/library", "/app/sources")).toBe(false);
  });
});
