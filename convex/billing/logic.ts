import type { PlanId } from "../lib/plans";

/**
 * Pure billing decision logic — no Convex/ctx/env dependencies, so it's directly
 * unit-testable. The Convex functions (gating/limits/lifecycle) do the IO (fetch
 * subscription, send email, write rows) and delegate every decision here.
 */

export type SubStatus = "trialing" | "active" | "past_due" | "comped" | "canceled" | "none";

export type Entitlement = {
  plan: PlanId;
  status: SubStatus;
  trialEndsAt: number | null;
  hasAccess: boolean;
};

const DAY = 86_400_000;
const GRACE_DAYS = 30;
export const APPROACHING = 0.8;

// trialing/active/past_due keep access (past_due = Polar dunning window); comped is an
// internal grant. Everything else (canceled, unpaid, none) is locked out.
export const ACCESS_STATUSES = new Set<SubStatus>(["trialing", "active", "past_due", "comped"]);

export function normalizeStatus(status: string | null | undefined): SubStatus {
  if (status === "trialing" || status === "active" || status === "past_due" || status === "canceled") return status;
  return status ? "canceled" : "none";
}

function parseTrialEnd(trialEnd: string | null | undefined): number | null {
  if (!trialEnd) return null;
  const ms = Date.parse(trialEnd);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Resolve the access picture from a fetched subscription plus environment flags.
 * `hasToken=false` (no Polar configured) → full dev access; admins are comped.
 */
export function resolveEntitlement(input: {
  hasToken: boolean;
  isAdmin: boolean;
  plan: PlanId;
  subscription: { status?: string | null; trialEnd?: string | null } | null;
}): Entitlement {
  if (!input.hasToken) return { plan: "pro", status: "active", trialEndsAt: null, hasAccess: true };
  if (input.isAdmin) return { plan: "pro", status: "comped", trialEndsAt: null, hasAccess: true };
  if (!input.subscription) return { plan: "free", status: "none", trialEndsAt: null, hasAccess: false };

  const status = normalizeStatus(input.subscription.status);
  return {
    plan: input.plan,
    status,
    trialEndsAt: parseTrialEnd(input.subscription.trialEnd),
    hasAccess: ACCESS_STATUSES.has(status),
  };
}

export type LimitEmail = "limitApproaching" | "limitReached" | null;

/**
 * Decide which usage-limit email to send and which de-dupe flags to persist. Returns
 * `email: null` when nothing should send (Pro, under 80%, or already sent).
 */
export function decideLimitEmail(
  count: number,
  cap: number,
  plan: PlanId,
  sent: { limit80SentAt?: number | null; limit100SentAt?: number | null },
  now: number,
): { email: LimitEmail; flags: { limit80SentAt?: number; limit100SentAt?: number } } {
  if (plan === "pro" || cap <= 0 || count / cap < APPROACHING) return { email: null, flags: {} };

  if (count >= cap) {
    if (sent.limit100SentAt) return { email: null, flags: {} };
    // Reaching the cap backfills the 80% flag so "approaching" can't fire afterwards.
    return { email: "limitReached", flags: { limit100SentAt: now, limit80SentAt: sent.limit80SentAt ?? now } };
  }

  if (sent.limit80SentAt) return { email: null, flags: {} };
  return { email: "limitApproaching", flags: { limit80SentAt: now } };
}

/** A subscription has lapsed (access ended) when Polar reports it ended/canceled/unpaid. */
export function isLapsed(status: string, endedAt: number | null): boolean {
  return endedAt !== null || status === "canceled" || status === "unpaid";
}

/**
 * The 30-day grace-clock fields to write for a subscription change. Lapsed → stamp
 * accessEndedAt (once) + purgeAt; active again → both cleared.
 */
export function computeGraceFields(
  status: string,
  endedAt: number | null,
  existingAccessEndedAt: number | null | undefined,
  now: number,
): { accessEndedAt: number | undefined; purgeAt: number | undefined } {
  if (!isLapsed(status, endedAt)) return { accessEndedAt: undefined, purgeAt: undefined };
  const accessEndedAt = existingAccessEndedAt ?? endedAt ?? now;
  return { accessEndedAt, purgeAt: accessEndedAt + GRACE_DAYS * DAY };
}
