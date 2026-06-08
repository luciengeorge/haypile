import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internalMutation, internalQuery, query } from "./_generated/server";
import { authComponent } from "./betterAuth/auth";

/** Load an item for the embedding pipeline. */
export const getForEmbed = internalQuery({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    return await ctx.db.get(itemId);
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
  },
  handler: async (ctx, { itemId, userId, source, vectors }) => {
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

    await ctx.db.patch(itemId, { embedStatus: "done", embedError: undefined });
  },
});

export const markEmbedFailed = internalMutation({
  args: { itemId: v.id("items"), error: v.string() },
  handler: async (ctx, { itemId, error }) => {
    await ctx.db.patch(itemId, { embedStatus: "failed", embedError: error });
  },
});

/**
 * Item count for the usage meter.
 * TODO: denormalize a per-user counter before scale — collect() reads every item doc
 * and will hit Convex's 16MB read cap past a few thousand items.
 */
export const usage = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const items = await ctx.db
      .query("items")
      .withIndex("by_user_saved", (q) => q.eq("userId", user._id))
      .collect();
    return { itemCount: items.length };
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
