import { v } from "convex/values";

import { internalQuery } from "./_generated/server";

const SOURCE = v.union(
  v.literal("x"),
  v.literal("github"),
  v.literal("youtube"),
  v.literal("pinterest"),
  v.literal("reddit"),
  v.literal("browser"),
);

/**
 * Hydrate vector hits → items, collapsing multiple video segments to one item.
 *
 * Lives in its own (V8) module because `search.ts` is a "use node" action file,
 * and Convex only allows actions in Node modules. Queries must be V8.
 */
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
        best.set(key, { score: hit.score, modality: vec.modality, startSec: vec.startSec, endSec: vec.endSec });
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
