import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { parseWaitlistEmail } from "./lib/waitlist-email";
import { rateLimiter } from "./rateLimiter";

export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = parseWaitlistEmail(args.email);
    if (!email) throw new Error("Please enter a valid email address.");
    const limit = await rateLimiter.limit(ctx, "waitlist", { key: email });
    if (!limit.ok) throw new Error("You have already joined. We will be in touch.");

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) return { ok: true, alreadyJoined: true };

    const source = args.source?.trim();
    await ctx.db.insert("waitlist", {
      email,
      ...(source ? { source } : {}),
      createdAt: Date.now(),
    });

    return { ok: true, alreadyJoined: false };
  },
});
