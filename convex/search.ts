"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { authComponent } from "./betterAuth/auth";
import { embedQuery } from "./embeddings/gemini";
import { rateLimiter } from "./rateLimiter";

const SOURCE = v.union(
  v.literal("x"),
  v.literal("github"),
  v.literal("youtube"),
  v.literal("pinterest"),
  v.literal("reddit"),
  v.literal("browser"),
);

/**
 * Multimodal search. Embeds the text query into the shared gemini-embedding-2
 * space and runs Convex vector search over itemVectors. Text query retrieves
 * matching text, image, AND video-segment vectors. Video hits collapse back to
 * their parent item with the matched timestamp for deep-linking.
 */
export const search = action({
  args: {
    query: v.string(),
    sources: v.optional(v.array(SOURCE)),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, sources, limit }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const ok = await rateLimiter.limit(ctx, "search", { key: user._id });
    if (!ok.ok) throw new Error("Rate limit exceeded. Try again shortly.");

    const vector = await embedQuery(query);

    const results = await ctx.vectorSearch("itemVectors", "by_embedding", {
      vector,
      limit: Math.min(limit ?? 50, 200) * 3, // over-fetch; we collapse video segments
      filter: (q) => q.eq("userId", user._id),
    });

    return await ctx.runQuery(internal.search.hydrate, {
      hits: results.map((r) => ({ id: r._id, score: r._score })),
      sources,
      limit: limit ?? 50,
    });
  },
});

/** Hydrate vector hits → items, collapsing multiple video segments to one item. */
export const hydrate = internalQuery({
  args: {
    hits: v.array(v.object({ id: v.id("itemVectors"), score: v.number() })),
    sources: v.optional(v.array(SOURCE)),
    limit: v.number(),
  },
  handler: async (ctx, { hits, sources, limit }) => {
    const sourceSet = sources && sources.length ? new Set(sources) : null;

    // itemId → best hit (max score + matched segment).
    const best = new Map<string, { score: number; modality: string; startSec?: number; endSec?: number }>();

    for (const hit of hits) {
      const vec = await ctx.db.get(hit.id);
      if (!vec) continue;
      const key = vec.itemId as unknown as string;
      const prev = best.get(key);
      if (!prev || hit.score > prev.score) {
        best.set(key, {
          score: hit.score,
          modality: vec.modality,
          startSec: vec.startSec,
          endSec: vec.endSec,
        });
      }
    }

    const ranked = [...best.entries()].sort((a, b) => b[1].score - a[1].score);

    const out: Array<Record<string, unknown>> = [];
    for (const [itemId, meta] of ranked) {
      if (out.length >= limit) break;
      const item = await ctx.db.get(itemId as never);
      if (!item) continue;
      if (sourceSet && !sourceSet.has((item as { source: string }).source as never)) continue;
      out.push({
        ...item,
        score: meta.score,
        matchModality: meta.modality,
        matchStartSec: meta.startSec,
        matchEndSec: meta.endSec,
      });
    }
    return out;
  },
});
