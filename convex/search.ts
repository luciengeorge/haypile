"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { authComponent } from "./betterAuth/auth";
import { getEntitlement } from "./billing/gating";
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
 * their parent item with the matched timestamp (see internal.searchHydrate.hydrate).
 */
export const search = action({
  args: {
    query: v.string(),
    sources: v.optional(v.array(SOURCE)),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, sources, limit }): Promise<Array<Record<string, unknown>>> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const entitlement = await getEntitlement(ctx, user._id);
    if (!entitlement.hasAccess) throw new Error("Your subscription has ended. Reactivate to search again.");

    const ok = await rateLimiter.limit(ctx, "search", { key: user._id });
    if (!ok.ok) throw new Error("Rate limit exceeded. Try again shortly.");

    const vector = await embedQuery(query);

    const results = await ctx.vectorSearch("itemVectors", "by_embedding", {
      vector,
      limit: Math.min(limit ?? 50, 200) * 3, // over-fetch; we collapse video segments
      filter: (q) => q.eq("userId", user._id),
    });

    return await ctx.runQuery(internal.searchHydrate.hydrate, {
      hits: results.map((r) => ({ id: r._id, score: r._score })),
      sources,
      limit: limit ?? 50,
    });
  },
});
