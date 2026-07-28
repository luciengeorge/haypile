import { v } from "convex/values";
import z from "zod";

import { internal } from "../_generated/api";
import { action, internalMutation } from "../_generated/server";
import { bumpItemCount } from "../items";

/*
Normalized JSON input:
{
  externalId?: string,
  url: string,
  kind: "article" | "image" | "video" | "repo" | "post",
  title?: string,
  text?: string,
  author?: string,
  savedAt: number,
  media?: [{ type: "image" | "video", url: string, durationSec?: number }],
  links?: [{ url: string, title?: string, description?: string, imageUrl?: string }]
}
*/

const sourceValidator = v.union(
  v.literal("x"),
  v.literal("github"),
  v.literal("youtube"),
  v.literal("pinterest"),
  v.literal("reddit"),
  v.literal("browser"),
);
const kindValidator = v.union(
  v.literal("article"),
  v.literal("image"),
  v.literal("video"),
  v.literal("repo"),
  v.literal("post"),
);
const mediaItemValidator = v.object({
  type: v.union(v.literal("image"), v.literal("video")),
  url: v.string(),
  durationSec: v.optional(v.number()),
});
const linkItemValidator = v.object({
  url: v.string(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
});
const normalizedItemValidator = v.object({
  externalId: v.optional(v.string()),
  url: v.string(),
  kind: kindValidator,
  title: v.optional(v.string()),
  text: v.optional(v.string()),
  author: v.optional(v.string()),
  savedAt: v.number(),
  media: v.optional(v.array(mediaItemValidator)),
  links: v.optional(v.array(linkItemValidator)),
});
const importedItemValidator = v.object({
  externalId: v.string(),
  url: v.string(),
  kind: kindValidator,
  title: v.optional(v.string()),
  text: v.optional(v.string()),
  author: v.optional(v.string()),
  savedAt: v.number(),
  media: v.optional(v.array(mediaItemValidator)),
  links: v.optional(v.array(linkItemValidator)),
});

const sourceSchema = z.enum(["x", "github", "youtube", "pinterest", "reddit", "browser"]);
const normalizedItemSchema = z.object({
  externalId: z.string().min(1).optional(),
  url: z.string().min(1),
  kind: z.enum(["article", "image", "video", "repo", "post"]),
  title: z.string().optional(),
  text: z.string().optional(),
  author: z.string().optional(),
  savedAt: z.number().finite(),
  media: z
    .array(
      z.object({
        type: z.enum(["image", "video"]),
        url: z.string().min(1),
        durationSec: z.number().finite().optional(),
      }),
    )
    .optional(),
  links: z
    .array(
      z.object({
        url: z.string().min(1),
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .optional(),
});
export const importItemsInputSchema = z.array(normalizedItemSchema);

type NormalizedItem = z.infer<typeof normalizedItemSchema>;
type ImportedItem = Omit<NormalizedItem, "externalId"> & { externalId: string };
type ImportResult = { total: number; inserted: number; updated: number };

export function dedupeExternalId(item: Pick<NormalizedItem, "externalId" | "url">) {
  return item.externalId ?? item.url;
}

export function normalizeImportItems(items: NormalizedItem[]) {
  return items.map((item) => {
    const normalized: ImportedItem = {
      externalId: dedupeExternalId(item),
      url: item.url,
      kind: item.kind,
      savedAt: item.savedAt,
    };
    if (item.title !== undefined) normalized.title = item.title;
    if (item.text !== undefined) normalized.text = item.text;
    if (item.author !== undefined) normalized.author = item.author;
    if (item.media !== undefined) normalized.media = item.media;
    if (item.links !== undefined) normalized.links = item.links;
    return normalized;
  });
}

function clean(value: string): string {
  return value.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}

export const importItems = action({
  args: {
    secret: v.string(),
    userId: v.string(),
    source: sourceValidator,
    items: v.array(normalizedItemValidator),
  },
  handler: async (ctx, args) => {
    const expected = process.env.IMPORT_SECRET;
    // Temporary concierge audit guard. Remove after the validation audit.
    if (!expected || args.secret !== expected) throw new Error("Unauthorized import");

    const source = sourceSchema.parse(args.source);
    const items = normalizeImportItems(importItemsInputSchema.parse(args.items));
    const result: ImportResult = await ctx.runMutation(internal.import.concierge.insertImported, {
      userId: args.userId,
      source,
      items,
    });
    return result;
  },
});

export const insertImported = internalMutation({
  args: {
    userId: v.string(),
    source: sourceValidator,
    items: v.array(importedItemValidator),
  },
  handler: async (ctx, { userId, source, items }) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;

    for (const item of items) {
      const text = item.text ? clean(item.text) : undefined;
      const title = item.title ? clean(item.title) : undefined;
      const author = item.author ? clean(item.author) : undefined;
      const media = item.media?.length ? item.media : undefined;
      const links = item.links?.length
        ? item.links.map((link) => ({
            url: link.url,
            title: link.title ? clean(link.title) : undefined,
            description: link.description ? clean(link.description) : undefined,
            imageUrl: link.imageUrl,
          }))
        : undefined;

      const existing = await ctx.db
        .query("items")
        .withIndex("by_user_source_ext", (q) =>
          q.eq("userId", userId).eq("source", source).eq("externalId", item.externalId),
        )
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { text, title, author, media, links, syncedAt: now });
        updated++;
        continue;
      }

      const itemId = await ctx.db.insert("items", {
        userId,
        source,
        externalId: item.externalId,
        kind: item.kind,
        url: item.url,
        title,
        text,
        author,
        media,
        links,
        savedAt: item.savedAt,
        syncedAt: now,
        embedStatus: "pending",
      });
      await bumpItemCount(ctx, userId, 1);
      inserted++;
      await ctx.scheduler.runAfter(0, internal.embeddings.pipeline.embedItem, { itemId });
    }

    return { total: items.length, inserted, updated };
  },
});
