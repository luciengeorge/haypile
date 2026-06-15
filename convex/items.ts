import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, internalQuery, type MutationCtx, query } from "./_generated/server";
import { authComponent } from "./betterAuth/auth";

/**
 * Adjust a user's denormalized item count. Call with +1 on item insert (and -1 on
 * delete, once a delete path exists). Runs in the same transaction as the write,
 * so the counter can never drift from the actual rows.
 */
export async function bumpItemCount(ctx: MutationCtx, userId: string, delta: number): Promise<void> {
  const row = await ctx.db
    .query("itemCounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (row) {
    await ctx.db.patch(row._id, { count: Math.max(0, row.count + delta) });
  } else {
    await ctx.db.insert("itemCounts", { userId, count: Math.max(0, delta) });
  }
}

/** Current saved-item count for a user (O(1), from the denormalized counter). */
export async function getItemCount(ctx: MutationCtx, userId: string): Promise<number> {
  const row = await ctx.db
    .query("itemCounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  return row?.count ?? 0;
}

/**
 * Adjust a user's denormalized video count — the COGS-critical Pro cap. Applied as a
 * delta from the embed pipeline (idempotent: re-embedding the same item nets 0).
 */
export async function bumpVideoCount(ctx: MutationCtx, userId: string, delta: number): Promise<void> {
  if (delta === 0) return;
  const row = await ctx.db
    .query("itemCounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (row) {
    await ctx.db.patch(row._id, { videoCount: Math.max(0, (row.videoCount ?? 0) + delta) });
  } else {
    await ctx.db.insert("itemCounts", { userId, count: 0, videoCount: Math.max(0, delta) });
  }
}

/** Load an item for the embedding pipeline. */
export const getForEmbed = internalQuery({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    return await ctx.db.get(itemId);
  },
});

/** Current video count for a user — the embed pipeline reads this to enforce the Pro video cap. */
export const videoUsage = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("itemCounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return row?.videoCount ?? 0;
  },
});

const vectorInput = v.object({
  modality: v.union(v.literal("text"), v.literal("image"), v.literal("video_segment")),
  startSec: v.optional(v.number()),
  endSec: v.optional(v.number()),
  embedding: v.array(v.float64()),
});

/**
 * Replace an item's vectors and mark it embedded. Idempotent: clears any
 * existing vectors first so retries don't duplicate.
 */
export const saveVectors = internalMutation({
  args: {
    itemId: v.id("items"),
    userId: v.string(),
    source: v.string(),
    vectors: v.array(vectorInput),
    videosEmbedded: v.optional(v.number()),
  },
  handler: async (ctx, { itemId, userId, source, vectors, videosEmbedded = 0 }) => {
    const existing = await ctx.db
      .query("itemVectors")
      .withIndex("by_item", (q) => q.eq("itemId", itemId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);

    for (const vec of vectors) {
      await ctx.db.insert("itemVectors", {
        userId,
        itemId,
        source,
        modality: vec.modality,
        startSec: vec.startSec,
        endSec: vec.endSec,
        embedding: vec.embedding,
      });
    }

    // Update the per-user video counter by the delta vs the last embed (idempotent on retry).
    const item = await ctx.db.get(itemId);
    await ctx.db.patch(itemId, { embedStatus: "done", embedError: undefined, videosEmbedded });
    await bumpVideoCount(ctx, userId, videosEmbedded - (item?.videosEmbedded ?? 0));
  },
});

export const markEmbedFailed = internalMutation({
  args: { itemId: v.id("items"), error: v.string() },
  handler: async (ctx, { itemId, error }) => {
    await ctx.db.patch(itemId, { embedStatus: "failed", embedError: error });
  },
});

/** Item count for the usage meter — reads the denormalized counter (O(1)). */
export const usage = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const row = await ctx.db
      .query("itemCounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return { itemCount: row?.count ?? 0 };
  },
});

/**
 * One-time backfill: recompute every user's itemCounts from the items table.
 * Safe to re-run (idempotent). Paginates so it never trips the 16MB read cap.
 */
export const backfillItemCounts = internalMutation({
  args: { cursor: v.optional(v.string()), counts: v.optional(v.record(v.string(), v.number())) },
  handler: async (ctx, { cursor, counts = {} }) => {
    const page = await ctx.db.query("items").paginate({ cursor: cursor ?? null, numItems: 500 });
    const tally: Record<string, number> = { ...counts };
    for (const item of page.page) tally[item.userId] = (tally[item.userId] ?? 0) + 1;

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.items.backfillItemCounts, { cursor: page.continueCursor, counts: tally });
      return { done: false };
    }

    for (const [userId, count] of Object.entries(tally)) {
      const row = await ctx.db
        .query("itemCounts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (row) await ctx.db.patch(row._id, { count });
      else await ctx.db.insert("itemCounts", { userId, count });
    }
    return { done: true, users: Object.keys(tally).length };
  },
});

// Paginated "all saves" for the Library, newest-first. Returns only the fields the
// card grid renders (keeps the page payload well under Convex's read limit).
export const listItems = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const result = await ctx.db
      .query("items")
      .withIndex("by_user_saved", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts);

    return {
      ...result,
      page: result.page.map((item) => ({
        _id: item._id,
        url: item.url,
        source: item.source,
        title: item.title,
        text: item.text,
        author: item.author,
        kind: item.kind,
        durationSec: item.durationSec,
        media: item.media,
        links: item.links,
        thumbnailStorageId: item.thumbnailStorageId,
      })),
    };
  },
});
