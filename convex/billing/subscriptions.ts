import { query } from "../_generated/server";
import { authComponent } from "../betterAuth/auth";
import { getPlanLimit } from "../lib/plans";
import { getEntitlement } from "./gating";

/**
 * Everything the client needs to render trial / limit / lock UI: plan, subscription
 * status, trial end, and usage against the plan cap. Returns null when unauthenticated.
 */
export const myEntitlement = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const entitlement = await getEntitlement(ctx, user._id);
    const counts = await ctx.db
      .query("itemCounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const itemCount = counts?.count ?? 0;
    const cap = getPlanLimit(entitlement.plan, "maxItems") ?? 0;
    const pct = cap > 0 ? Math.min(100, Math.round((itemCount / cap) * 100)) : 0;

    // purgeAt (set by the Polar webhook on cancellation) drives the locked-wall
    // deletion date; null until a subscription is actually cancelled.
    const record = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return { ...entitlement, itemCount, cap, pct, purgeAt: record?.purgeAt ?? null };
  },
});
