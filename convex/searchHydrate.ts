import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalQuery } from "./_generated/server";

const SOURCE = v.union(
  v.literal("x"),
  v.literal("github"),
  v.literal("youtube"),
  v.literal("pinterest"),
  v.literal("reddit"),
  v.literal("browser"),
);

type Match = { score: number; modality: string; startSec?: number; endSec?: number };

/**
 * Hydrate vector hits → items, collapsing multiple video segments to one item.
 * In its own (V8) module because search.ts is a "use node" action file.
 */
export const hydrate = internalQuery({
  args: {
    hits: v.array(v.object({ id: v.id("itemVectors"), score: v.number() })),
    sources: v.optional(v.array(SOURCE)),
    limit: v.number(),
  },
  handler: async (ctx, { hits, sources, limit }) => {
    const sourceSet = sources && sources.length ? new Set(sources) : null;

    const best = new Map<Id<"items">, Match>();
    for (const hit of hits) {
      const vec = await ctx.db.get(hit.id);
      if (!vec) continue;
      const prev = best.get(vec.itemId);
      if (!prev || hit.score > prev.score) {
        best.set(vec.itemId, { score: hit.score, modality: vec.modality, startSec: vec.startSec, endSec: vec.endSec });
      }
    }

    const ranked = [...best.entries()].sort((a, b) => b[1].score - a[1].score);

    const out = [];
    for (const [itemId, meta] of ranked) {
      if (out.length >= limit) break;
      const item = await ctx.db.get(itemId);
      if (!item) continue;
      if (sourceSet && !sourceSet.has(item.source)) continue;
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
