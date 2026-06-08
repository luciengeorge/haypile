import { describe, expect, it } from "vitest";

import { getInitials } from "./initials";

describe("getInitials", () => {
  it("takes the first two name parts, uppercased", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });

  it("collapses extra whitespace and caps at two initials", () => {
    expect(getInitials("  john  ronald   reuel  tolkien ")).toBe("JR");
  });

  it("falls back to the email's first letter when no name", () => {
    expect(getInitials(null, "hello@haypile.app")).toBe("H");
    expect(getInitials("   ", "zoe@x.com")).toBe("Z");
  });

  it("returns '?' when nothing usable is provided", () => {
    expect(getInitials()).toBe("?");
    expect(getInitials("", "")).toBe("?");
  });
});
