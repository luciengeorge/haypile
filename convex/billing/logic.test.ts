import { describe, expect, it } from "vitest";

import { computeGraceFields, decideLimitEmail, isLapsed, normalizeStatus, resolveEntitlement } from "./logic";

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

describe("resolveEntitlement", () => {
  it("grants full access when Polar is not configured (dev / self-host)", () => {
    expect(resolveEntitlement({ hasToken: false, isAdmin: false, plan: "free", subscription: null })).toEqual({
      plan: "pro",
      status: "active",
      trialEndsAt: null,
      hasAccess: true,
    });
  });

  it("comps admins without a subscription", () => {
    expect(resolveEntitlement({ hasToken: true, isAdmin: true, plan: "free", subscription: null })).toEqual({
      plan: "pro",
      status: "comped",
      trialEndsAt: null,
      hasAccess: true,
    });
  });

  it("locks out when there is no subscription", () => {
    expect(resolveEntitlement({ hasToken: true, isAdmin: false, plan: "free", subscription: null })).toEqual({
      plan: "free",
      status: "none",
      trialEndsAt: null,
      hasAccess: false,
    });
  });

  it("grants access while trialing and parses the trial end", () => {
    const e = resolveEntitlement({
      hasToken: true,
      isAdmin: false,
      plan: "pro",
      subscription: { status: "trialing", trialEnd: "2026-07-09T00:00:00Z" },
    });
    expect(e.status).toBe("trialing");
    expect(e.hasAccess).toBe(true);
    expect(e.plan).toBe("pro");
    expect(e.trialEndsAt).toBe(Date.parse("2026-07-09T00:00:00Z"));
  });

  it("keeps access for active and past_due", () => {
    for (const status of ["active", "past_due"] as const) {
      expect(
        resolveEntitlement({ hasToken: true, isAdmin: false, plan: "starter", subscription: { status } }).hasAccess,
      ).toBe(true);
    }
  });

  it("locks out canceled and unknown statuses", () => {
    expect(
      resolveEntitlement({ hasToken: true, isAdmin: false, plan: "starter", subscription: { status: "canceled" } })
        .hasAccess,
    ).toBe(false);
    const unknown = resolveEntitlement({
      hasToken: true,
      isAdmin: false,
      plan: "starter",
      subscription: { status: "incomplete_expired" },
    });
    expect(unknown.status).toBe("canceled");
    expect(unknown.hasAccess).toBe(false);
  });

  it("returns null trialEndsAt for missing or invalid dates", () => {
    expect(
      resolveEntitlement({ hasToken: true, isAdmin: false, plan: "pro", subscription: { status: "active" } })
        .trialEndsAt,
    ).toBeNull();
    expect(
      resolveEntitlement({
        hasToken: true,
        isAdmin: false,
        plan: "pro",
        subscription: { status: "active", trialEnd: "not-a-date" },
      }).trialEndsAt,
    ).toBeNull();
  });
});

describe("normalizeStatus", () => {
  it("passes known statuses through", () => {
    for (const status of ["trialing", "active", "past_due", "canceled"] as const) {
      expect(normalizeStatus(status)).toBe(status);
    }
  });

  it("maps empty/nullish to none and anything else to canceled", () => {
    expect(normalizeStatus(null)).toBe("none");
    expect(normalizeStatus(undefined)).toBe("none");
    expect(normalizeStatus("")).toBe("none");
    expect(normalizeStatus("unpaid")).toBe("canceled");
    expect(normalizeStatus("incomplete")).toBe("canceled");
  });
});

describe("decideLimitEmail", () => {
  it("does nothing below 80%", () => {
    expect(decideLimitEmail(1599, 2000, "starter", {}, NOW).email).toBeNull();
  });

  it("skips Pro entirely (no upgrade target)", () => {
    expect(decideLimitEmail(20000, 20000, "pro", {}, NOW).email).toBeNull();
  });

  it("skips when the cap is zero", () => {
    expect(decideLimitEmail(0, 0, "starter", {}, NOW).email).toBeNull();
  });

  it("sends approaching at 80% and sets the 80 flag", () => {
    const decision = decideLimitEmail(1600, 2000, "starter", {}, NOW);
    expect(decision.email).toBe("limitApproaching");
    expect(decision.flags).toEqual({ limit80SentAt: NOW });
  });

  it("does not resend approaching once the 80 flag is set", () => {
    expect(decideLimitEmail(1700, 2000, "starter", { limit80SentAt: 1 }, NOW).email).toBeNull();
  });

  it("sends reached at 100% and backfills the 80 flag", () => {
    const decision = decideLimitEmail(2000, 2000, "starter", {}, NOW);
    expect(decision.email).toBe("limitReached");
    expect(decision.flags).toEqual({ limit100SentAt: NOW, limit80SentAt: NOW });
  });

  it("preserves an existing 80 flag when reaching 100%", () => {
    const decision = decideLimitEmail(2100, 2000, "starter", { limit80SentAt: 42 }, NOW);
    expect(decision.flags).toEqual({ limit100SentAt: NOW, limit80SentAt: 42 });
  });

  it("does not resend reached once the 100 flag is set", () => {
    expect(decideLimitEmail(2000, 2000, "starter", { limit100SentAt: 1 }, NOW).email).toBeNull();
  });
});

describe("isLapsed", () => {
  it("is true when access ended, was canceled, or is unpaid", () => {
    expect(isLapsed("active", 123)).toBe(true);
    expect(isLapsed("canceled", null)).toBe(true);
    expect(isLapsed("unpaid", null)).toBe(true);
  });

  it("is false for live statuses with no end date", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      expect(isLapsed(status, null)).toBe(false);
    }
  });
});

describe("computeGraceFields", () => {
  it("clears the grace clock while access is live", () => {
    expect(computeGraceFields("active", null, null, NOW)).toEqual({ accessEndedAt: undefined, purgeAt: undefined });
  });

  it("stamps accessEndedAt + a 30-day purgeAt from the end date on lapse", () => {
    const ended = NOW - DAY;
    expect(computeGraceFields("canceled", ended, null, NOW)).toEqual({
      accessEndedAt: ended,
      purgeAt: ended + 30 * DAY,
    });
  });

  it("falls back to now when there is no end date", () => {
    expect(computeGraceFields("canceled", null, null, NOW)).toEqual({ accessEndedAt: NOW, purgeAt: NOW + 30 * DAY });
  });

  it("preserves an existing accessEndedAt so the clock doesn't restart", () => {
    const existing = NOW - 5 * DAY;
    expect(computeGraceFields("canceled", NOW, existing, NOW)).toEqual({
      accessEndedAt: existing,
      purgeAt: existing + 30 * DAY,
    });
  });
});
