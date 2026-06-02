import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * App schema. Auth tables live in the betterAuth component (convex/betterAuth/schema.ts).
 *
 * Core model:
 * - items: one row per saved thing (a tweet, a starred repo, a pin, a video…)
 * - itemVectors: one row per embedding. Text/image items → 1 vector. Videos →
 *   N vectors (one per time-window) so a brief visual moment is findable.
 * - syncJobs: background-sync state (from the template's sync framework).
 *
 * Search runs over itemVectors via Convex's native vector index. See
 * convex/embeddings/gemini.ts (EMBED_DIMS must match `dimensions` below).
 */

export const SOURCES = ["x", "github", "youtube", "pinterest", "reddit", "browser"] as const;

export default defineSchema({
  items: defineTable({
    userId: v.string(),
    source: v.union(
      v.literal("x"),
      v.literal("github"),
      v.literal("youtube"),
      v.literal("pinterest"),
      v.literal("reddit"),
      v.literal("browser"),
    ),
    externalId: v.string(), // dedupe key within (userId, source)
    kind: v.union(v.literal("article"), v.literal("image"), v.literal("video"), v.literal("repo"), v.literal("post")),
    url: v.string(),
    title: v.optional(v.string()),
    text: v.optional(v.string()), // caption / description / article body
    author: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    durationSec: v.optional(v.number()), // for videos
    // Multimodal attachments captured from the source (e.g. X photos/videos + links).
    // The embed pipeline fans these out into one itemVectors row each.
    media: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("video"), v.literal("gif")),
          url: v.string(),
          durationSec: v.optional(v.number()),
        }),
      ),
    ),
    links: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.optional(v.string()),
          description: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
        }),
      ),
    ),
    savedAt: v.number(), // when the user saved it on the source platform
    syncedAt: v.number(),
    embedStatus: v.union(v.literal("pending"), v.literal("done"), v.literal("failed")),
    embedError: v.optional(v.string()),
  })
    .index("by_user_source_ext", ["userId", "source", "externalId"])
    .index("by_user_saved", ["userId", "savedAt"])
    .index("by_embed_status", ["embedStatus"]),

  itemVectors: defineTable({
    userId: v.string(),
    itemId: v.id("items"),
    source: v.string(), // denormalized for filtered vector search
    modality: v.union(v.literal("text"), v.literal("image"), v.literal("video_segment")),
    startSec: v.optional(v.number()), // video segment start (deep-link)
    endSec: v.optional(v.number()),
    embedding: v.array(v.float64()),
  })
    .index("by_item", ["itemId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId", "source", "modality"],
    }),

  /**
   * Background sync job state. See convex/sync/README.md.
   * One row per (userId, source). Status drives the dispatcher.
   */
  syncJobs: defineTable({
    userId: v.string(),
    source: v.string(),
    status: v.union(v.literal("idle"), v.literal("running"), v.literal("failed"), v.literal("disabled")),
    cursor: v.optional(v.string()),
    nextRunAt: v.number(),
    lastRunAt: v.optional(v.number()),
    lastSuccessAt: v.optional(v.number()),
    attempts: v.number(),
    error: v.optional(v.string()),
  })
    .index("by_user_source", ["userId", "source"])
    .index("by_status_next_run", ["status", "nextRunAt"]),
});
