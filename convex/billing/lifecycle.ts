import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { authComponent } from "../betterAuth/auth";
import { getEntitlement } from "./gating";
import { computeGraceFields, isLapsed } from "./logic";

const DAY = 86_400_000;
const WARN_DAYS = 3; // send the "data will be deleted" email this many days before purge

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(ms);
}

/**
 * Mirror a Polar subscription change into our local `subscriptions` row (called from the
 * webhook). When access ends we stamp `accessEndedAt` + `purgeAt` to start the 30-day
 * grace clock; when a subscription becomes active/trialing again we clear it (the user
 * reactivated within grace). The daily `graceTick` cron acts on those timestamps.
 */
export const syncSubscription = internalMutation({
  args: {
    userId: v.string(),
    status: v.string(),
    customerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    endedAt: v.union(v.number(), v.null()),
  },
  handler: async (ctx, { userId, status, customerId, subscriptionId, endedAt }) => {
    const row = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const grace = computeGraceFields(status, endedAt, row?.accessEndedAt ?? null, Date.now());

    let fields: {
      status: string;
      customerId?: string;
      subscriptionId?: string;
      accessEndedAt?: number;
      purgeAt?: number;
      graceEndingSentAt?: number;
    };
    if (isLapsed(status, endedAt)) {
      fields = { status, customerId, subscriptionId, accessEndedAt: grace.accessEndedAt, purgeAt: grace.purgeAt };
    } else {
      // Active/trialing/past_due → clear any grace state (setting to undefined removes the field).
      fields = {
        status,
        customerId,
        subscriptionId,
        accessEndedAt: undefined,
        purgeAt: undefined,
        graceEndingSentAt: undefined,
      };
    }

    if (row) {
      await ctx.db.patch(row._id, fields);
    } else {
      await ctx.db.insert("subscriptions", { userId, ...fields });
    }
  },
});

/**
 * Daily lifecycle sweep. For each lapsed subscription still inside its grace window:
 * warns by email `WARN_DAYS` before purge, and once `purgeAt` passes, purges the user's
 * data. Re-checks live entitlement first so a reactivated user is never warned or purged.
 */
export const graceTick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Small table (only lapsed subs + users who've hit a usage threshold); the
    // accessEndedAt guard below skips everything that isn't in a grace window.
    const rows = await ctx.db.query("subscriptions").collect();

    for (const row of rows) {
      if (!row.accessEndedAt || !row.purgeAt) continue;

      const entitlement = await getEntitlement(ctx, row.userId);
      if (entitlement.hasAccess) {
        await ctx.db.patch(row._id, { accessEndedAt: undefined, purgeAt: undefined, graceEndingSentAt: undefined });
        continue;
      }

      if (now >= row.purgeAt) {
        await ctx.scheduler.runAfter(0, internal.users.purgeUserData, { userId: row.userId });
        await ctx.db.delete(row._id);
        continue;
      }

      if (now >= row.purgeAt - WARN_DAYS * DAY && !row.graceEndingSentAt) {
        const user = await authComponent.getAnyUserById(ctx, row.userId);
        if (user?.email) {
          await ctx.scheduler.runAfter(0, internal.email.send.sendEmail, {
            to: user.email,
            subject: "Your Haypile data will be deleted soon",
            template: "graceEnding",
            props: { name: user.name ?? undefined, deleteOn: formatDate(row.purgeAt) },
          });
          await ctx.db.patch(row._id, { graceEndingSentAt: now });
        }
      }
    }
  },
});
