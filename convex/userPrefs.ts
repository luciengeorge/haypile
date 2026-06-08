import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./betterAuth/auth";

const DEFAULTS = { weeklyDigest: true, newFromSources: true, productUpdates: false };

export const getMyPrefs = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return DEFAULTS;
    const row = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return {
      weeklyDigest: row?.weeklyDigest ?? DEFAULTS.weeklyDigest,
      newFromSources: row?.newFromSources ?? DEFAULTS.newFromSources,
      productUpdates: row?.productUpdates ?? DEFAULTS.productUpdates,
    };
  },
});

export const setMyPref = mutation({
  args: {
    key: v.union(v.literal("weeklyDigest"), v.literal("newFromSources"), v.literal("productUpdates")),
    value: v.boolean(),
  },
  handler: async (ctx, { key, value }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const row = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { [key]: value });
    } else {
      await ctx.db.insert("userPrefs", { userId: user._id, ...DEFAULTS, [key]: value });
    }
  },
});
