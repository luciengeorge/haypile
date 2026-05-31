"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { embedImage, embedText, embedVideoSegment } from "./gemini";

/** Seconds per video window → one vector each. Smaller = finer recall, more vectors. */
const SEGMENT_SEC = 15;
/** Frames sampled per second inside each window (cost lever; $0.00079/frame). */
const VIDEO_FPS = 0.5;
/** Gemini caps a single video embed at 120s; chunk anything longer. */
const MAX_VIDEO_SEC = 120;

type VectorRow = {
  modality: "text" | "image" | "video_segment";
  startSec?: number;
  endSec?: number;
  embedding: number[];
};

async function storageToBase64(
  ctx: { storage: { get: (id: string) => Promise<Blob | null> } },
  storageId: string,
): Promise<{ data: string; mimeType: string }> {
  const blob = await ctx.storage.get(storageId);
  if (!blob) throw new Error(`storage object ${storageId} not found`);
  const buf = Buffer.from(await blob.arrayBuffer());
  return { data: buf.toString("base64"), mimeType: blob.type || "application/octet-stream" };
}

/**
 * Embed one item into the shared vector space.
 *
 * - article / repo / post → 1 text vector
 * - image                → 1 image vector (title used as light text context)
 * - video                → N video-segment vectors (one per 15s window)
 *
 * Dispatched by the sync framework after an item is upserted. Writes vectors via
 * internal.items.saveVectors (which also flips embedStatus → done).
 */
export const embedItem = internalAction({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.runQuery(internal.items.getForEmbed, { itemId });
    if (!item) return;

    try {
      const vectors: VectorRow[] = [];

      if (item.kind === "video") {
        // Prefer a fetchable URI (source URL or gs://); fall back to inline bytes.
        const mediaUri = item.url;
        const duration = Math.min(item.durationSec ?? SEGMENT_SEC, MAX_VIDEO_SEC);
        for (let start = 0; start < duration; start += SEGMENT_SEC) {
          const end = Math.min(start + SEGMENT_SEC, duration);
          const embedding = await embedVideoSegment({
            uri: mediaUri,
            mimeType: "video/mp4",
            startSec: start,
            endSec: end,
            fps: VIDEO_FPS,
          });
          vectors.push({ modality: "video_segment", startSec: start, endSec: end, embedding });
        }
      } else if (item.kind === "image") {
        if (!item.mediaStorageId) throw new Error("image item has no mediaStorageId");
        const { data, mimeType } = await storageToBase64(ctx, item.mediaStorageId);
        const embedding = await embedImage({ data, mimeType, contextText: item.title });
        vectors.push({ modality: "image", embedding });
      } else {
        // article / repo / post — embed the text.
        const text = [item.title, item.text].filter(Boolean).join("\n\n") || item.url;
        const embedding = await embedText(text, item.title);
        vectors.push({ modality: "text", embedding });
      }

      await ctx.runMutation(internal.items.saveVectors, {
        itemId,
        userId: item.userId,
        source: item.source,
        vectors,
      });
    } catch (error) {
      await ctx.runMutation(internal.items.markEmbedFailed, {
        itemId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
});
