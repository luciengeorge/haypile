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
  const subscription = await ctx.runQuery(polar.component.lib.getCurrentSubscription, { userId });
  return planForProductId(subscription?.productId);
}

// Resolve a plan from a Polar product ID, matching both the monthly and annual products.
export function planForProductId(productId: string | undefined): PlanId {
  return planFromProductId(productId, {
    starter: [process.env.POLAR_PRODUCT_STARTER, process.env.POLAR_PRODUCT_STARTER_ANNUAL],
    pro: [process.env.POLAR_PRODUCT_PRO, process.env.POLAR_PRODUCT_PRO_ANNUAL],
  });
}
