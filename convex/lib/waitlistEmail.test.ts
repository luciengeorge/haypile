import { describe, expect, it } from "vitest";

import { parseWaitlistEmail } from "./waitlistEmail";

describe("parseWaitlistEmail", () => {
  it("normalizes a valid email (trim + lowercase)", () => {
    expect(parseWaitlistEmail("  Lucien@Haypile.APP ")).toBe("lucien@haypile.app");
  });

  it("accepts a plain lowercase email unchanged", () => {
    expect(parseWaitlistEmail("hey@example.com")).toBe("hey@example.com");
  });

  it("rejects input without an @", () => {
    expect(parseWaitlistEmail("not-an-email")).toBeNull();
  });

  it("rejects input missing a domain", () => {
    expect(parseWaitlistEmail("foo@")).toBeNull();
  });

  it("rejects an empty or whitespace-only string", () => {
    expect(parseWaitlistEmail("")).toBeNull();
    expect(parseWaitlistEmail("   ")).toBeNull();
  });
});
