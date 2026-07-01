import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, query } from "./_generated/server";
import { authComponent } from "./betterAuth/auth";

// Bounds the export query response (Convex's per-function read/response caps). A
// user's full X library is ~800 at most (the API cap), so this covers realistic
// sizes; `truncated` flags the rare overflow so nothing is silently dropped.
const EXPORT_ITEM_CAP = 2000;
// Items purged per scheduled batch. Kept small because deleting an item also reads
// its itemVectors, and each embedding is ~12KB — a large batch would risk the 16MB
// read cap for video-heavy accounts (up to ~15 vectors/item).
const PURGE_BATCH = 25;

/** Current user's {userId, email} or null. Used by the Polar component's getUserInfo. */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    return user ? { userId: user._id, email: user.email } : null;
  },
});

/**
 * GDPR-compliant data export (UK/EU GDPR Art. 15/20). Returns the profile, prefs,
 * counts, and saved items. Embeddings are derived data (not user-provided) and are
 * excluded. `truncated` is true if the account exceeds EXPORT_ITEM_CAP.
 */
export const exportMyData = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const items = await ctx.db
      .query("items")
      .withIndex("by_user_saved", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(EXPORT_ITEM_CAP + 1);

    const prefs = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const counts = await ctx.db
      .query("itemCounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return {
      exportedAt: new Date().toISOString(),
      truncated: items.length > EXPORT_ITEM_CAP,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user._creationTime,
      },
      preferences: prefs
        ? { weeklyDigest: prefs.weeklyDigest, newFromSources: prefs.newFromSources, productUpdates: prefs.productUpdates }
        : null,
      counts: counts ? { count: counts.count, videoCount: counts.videoCount ?? 0 } : null,
      items: items.slice(0, EXPORT_ITEM_CAP).map((item) => ({
        source: item.source,
        kind: item.kind,
        url: item.url,
        title: item.title,
        text: item.text,
        author: item.author,
        media: item.media,
        links: item.links,
        savedAt: item.savedAt,
      })),
    };
  },
});

/**
 * Purge all app-owned data for a deleted user. Scheduled from the better-auth
 * `deleteUser.afterDelete` hook (auth tables — user/sessions/accounts — are removed
 * by better-auth itself). Self-reschedules a batch at a time until the items are
 * gone, then removes the per-user singleton rows.
 */
export const purgeUserData = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_user_saved", (q) => q.eq("userId", userId))
      .take(PURGE_BATCH);

    for (const item of items) {
      const vectors = await ctx.db
        .query("itemVectors")
        .withIndex("by_item", (q) => q.eq("itemId", item._id))
        .collect();
      for (const vector of vectors) await ctx.db.delete(vector._id);
      for (const storageId of [item.thumbnailStorageId, item.mediaStorageId]) {
        // A blob may already be gone; deletion must not stall on it.
        if (storageId) await ctx.storage.delete(storageId).catch(() => undefined);
      }
      await ctx.db.delete(item._id);
    }

    if (items.length === PURGE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.users.purgeUserData, { userId });
      return;
    }

    const jobs = await ctx.db
      .query("syncJobs")
      .withIndex("by_user_source", (q) => q.eq("userId", userId))
      .collect();
    for (const job of jobs) await ctx.db.delete(job._id);

    const prefs = await ctx.db
      .query("userPrefs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (prefs) await ctx.db.delete(prefs._id);

    const counts = await ctx.db
      .query("itemCounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (counts) await ctx.db.delete(counts._id);
  },
});
