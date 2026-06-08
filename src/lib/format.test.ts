import { describe, expect, it } from "vitest";

import { formatDuration, formatRelativeTime } from "./format";

describe("formatRelativeTime", () => {
  const now = 1_000_000_000_000;

  it("formats seconds", () => {
    expect(formatRelativeTime(now - 5_000, now)).toBe("5s ago");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe("5m ago");
  });

  it("formats hours", () => {
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe("3h ago");
  });

  it("formats days", () => {
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe("2d ago");
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds with padding", () => {
    expect(formatDuration(258)).toBe("4:18");
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(5)).toBe("0:05");
  });

  it("adds hours past 60 minutes", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });
});
