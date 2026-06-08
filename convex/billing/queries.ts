import { v } from "convex/values";

import { action, query } from "../_generated/server";
import { authComponent } from "../betterAuth/auth";
import { planForProductId } from "./gating";
import { polar } from "./polar";

/**
 * Returns the current authenticated user's subscription (or null).
 *
 * Use `data?.plan` to drive paywall + usage UI on the client. For server-side
 * gating, use `requirePlan` (see ./gating.ts).
 */
export const mySubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const customer = await polar.getCustomerByUserId(ctx, user._id);
    if (!customer) return { plan: "free" as const, customerId: null, subscription: null };

    const subscription = await ctx.runQuery(polar.component.lib.getCurrentSubscription, {
      userId: user._id,
    });

    return {
      plan: planForProductId(subscription?.productId),
      customerId: customer.id,
      subscription,
    };
  },
});

// Re-export Polar's hosted customer portal action. Payment method, invoices, and
// cancellation all live in the portal, so "Manage billing" just opens it.
export const { generateCustomerPortalUrl } = polar.api();

function checkoutProductId(plan: "starter" | "pro", cycle: "monthly" | "annual"): string | undefined {
  if (cycle === "annual") {
    return plan === "pro" ? process.env.POLAR_PRODUCT_PRO_ANNUAL : process.env.POLAR_PRODUCT_STARTER_ANNUAL;
  }
  return plan === "pro" ? process.env.POLAR_PRODUCT_PRO : process.env.POLAR_PRODUCT_STARTER;
}

/**
 * Action that creates a Polar checkout session for the authenticated user.
 * Must be an action — the Polar SDK uses fetch(), which queries/mutations can't.
 * Returns the checkout URL — the client redirects to it.
 */
export const createCheckout = action({
  args: {
    plan: v.union(v.literal("starter"), v.literal("pro")),
    cycle: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    successUrl: v.string(),
  },
  handler: async (ctx, { plan, cycle = "monthly", successUrl }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const productId = checkoutProductId(plan, cycle);
    if (!productId) throw new Error(`Polar product ID not configured for plan '${plan}' (${cycle}).`);

    const checkout = await polar.createCheckoutSession(ctx, {
      productIds: [productId],
      userId: user._id,
      email: user.email,
      origin: process.env.SITE_URL ?? "http://localhost:3000",
      successUrl,
    });

    return { url: checkout.url };
  },
});
