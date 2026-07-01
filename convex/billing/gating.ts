import type { GenericQueryCtx, GenericMutationCtx, GenericActionCtx } from "convex/server";

import type { DataModel } from "../_generated/dataModel";

import { authComponent } from "../betterAuth/auth";
import { type PlanId, planFromProductId, planMeetsRequirement } from "../lib/plans";
import { polar } from "./polar";

type AnyCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel> | GenericActionCtx<DataModel>;

/**
 * Server-side plan gate. Throws if the authenticated user's plan is below `required`.
 *
 * Usage in a mutation/query/action:
 *   await requirePlan(ctx, "pro");
 *
 * Never trust client-side plan checks for security — every paid feature must call
 * this from inside its Convex function.
 */
export async function requirePlan(ctx: AnyCtx, required: PlanId): Promise<void> {
  if (required === "free") return;

  const user = await authComponent.getAuthUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const customer = await polar.getCustomerByUserId(ctx, user._id);
  const subscription = customer
    ? await ctx.runQuery(polar.component.lib.getCurrentSubscription, { userId: user._id })
    : null;

  const plan = planForProductId(subscription?.productId);
  if (!planMeetsRequirement(plan, required)) {
    throw new Error(`Requires ${required} plan. Current plan: ${plan}.`);
  }
}

/**
 * Resolve a user's plan by id, without an auth session — for background jobs like the
 * embed pipeline. If billing isn't configured (no POLAR_ACCESS_TOKEN), returns "pro"
 * so dev / self-host keeps full features instead of being silently downgraded.
 */
export async function planForUserId(ctx: AnyCtx, userId: string): Promise<PlanId> {
  if (!process.env.POLAR_ACCESS_TOKEN) return "pro";
  if (parseAdminUserIds().includes(userId)) return "pro";
  const subscription = await ctx.runQuery(polar.component.lib.getCurrentSubscription, { userId });
  return planForProductId(subscription?.productId);
}

// Comped accounts (currently = admins) get full Pro access without paying.
function parseAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export type SubStatus = "trialing" | "active" | "past_due" | "comped" | "canceled" | "none";

export type Entitlement = {
  plan: PlanId;
  status: SubStatus;
  trialEndsAt: number | null;
  hasAccess: boolean;
};

// trialing/active/past_due keep access (past_due = Polar dunning window); everything
// else (canceled, unpaid, incomplete, no sub) is locked out.
const ACCESS_STATUSES = new Set<SubStatus>(["trialing", "active", "past_due", "comped"]);

function normalizeStatus(status: string | null | undefined): SubStatus {
  if (status === "trialing" || status === "active" || status === "past_due" || status === "canceled") return status;
  return status ? "canceled" : "none";
}

/**
 * The full access picture for a user: plan, subscription status, trial end, and
 * whether they can use the app. No auth session required — safe for background jobs.
 */
export async function getEntitlement(ctx: AnyCtx, userId: string): Promise<Entitlement> {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return { plan: "pro", status: "active", trialEndsAt: null, hasAccess: true };
  }
  if (parseAdminUserIds().includes(userId)) {
    return { plan: "pro", status: "comped", trialEndsAt: null, hasAccess: true };
  }
  const subscription = await ctx.runQuery(polar.component.lib.getCurrentSubscription, { userId });
  if (!subscription) return { plan: "free", status: "none", trialEndsAt: null, hasAccess: false };
  const status = normalizeStatus(subscription.status);
  const trialEndsAt = subscription.trialEnd ? Date.parse(subscription.trialEnd) : null;
  return {
    plan: planForProductId(subscription.productId),
    status,
    trialEndsAt: Number.isNaN(trialEndsAt) ? null : trialEndsAt,
    hasAccess: ACCESS_STATUSES.has(status),
  };
}

// Resolve a plan from a Polar product ID, matching both the monthly and annual products.
export function planForProductId(productId: string | undefined): PlanId {
  return planFromProductId(productId, {
    starter: [process.env.POLAR_PRODUCT_STARTER, process.env.POLAR_PRODUCT_STARTER_ANNUAL],
    pro: [process.env.POLAR_PRODUCT_PRO, process.env.POLAR_PRODUCT_PRO_ANNUAL],
  });
}
