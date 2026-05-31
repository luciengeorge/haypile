import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";

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
