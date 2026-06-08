import z from "zod";

import { internal } from "../../_generated/api";
import { planForUserId } from "../../billing/gating";
import { bumpItemCount, getItemCount } from "../../items";
import { getPlanLimit } from "../../lib/plans";
import type { SyncAdapter } from "../types";

const X_API = "https://api.x.com/2";

const mediaSchema = z.object({
  media_key: z.string(),
  type: z.string(), // photo | video | animated_gif
  url: z.string().optional(), // photos
  preview_image_url: z.string().optional(),
  duration_ms: z.number().optional(),
  variants: z
    .array(z.object({ bit_rate: z.number().optional(), content_type: z.string(), url: z.string() }))
    .optional(),
});

const urlEntitySchema = z.object({
  expanded_url: z.string().optional(),
  unwound_url: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.object({ url: z.string() })).optional(),
});

const tweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string().optional(),
  author_id: z.string().optional(),
  attachments: z.object({ media_keys: z.array(z.string()).optional() }).optional(),
  entities: z.object({ urls: z.array(urlEntitySchema).optional() }).optional(),
});

const bookmarksResponseSchema = z.object({
  data: z.array(tweetSchema).optional(),
  includes: z
    .object({
      users: z.array(z.object({ id: z.string(), username: z.string() })).optional(),
      media: z.array(mediaSchema).optional(),
    })
    .optional(),
  meta: z.object({ next_token: z.string().optional() }).optional(),
});

const refreshResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
});

const mediaItemSchema = z.object({
  type: z.enum(["image", "video", "gif"]),
  url: z.string(),
  durationSec: z.number().optional(),
});
const linkItemSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});
const persistItemSchema = z.object({
  externalId: z.string(),
  url: z.string(),
  text: z.string(),
  author: z.string().optional(),
  savedAt: z.number(),
  media: z.array(mediaItemSchema).optional(),
  links: z.array(linkItemSchema).optional(),
});

// X rotates refresh tokens on use (offline.access), so the new refresh_token must
// be persisted. Confidential clients authenticate the token endpoint with Basic auth.
async function refreshXToken(refreshToken: string) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("X_CLIENT_ID / X_CLIENT_SECRET not set");
  const res = await fetch(`${X_API}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`X token refresh failed: ${res.status}`);
  const json = refreshResponseSchema.parse(await res.json());
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

// Convex (and JSON) reject strings with lone UTF-16 surrogates; tweets sometimes
// contain them (or a naive slice splits an emoji pair). Strip lone surrogates.
function clean(value: string): string {
  return value.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}

type XMedia = z.infer<typeof mediaSchema>;
function bestVideoUrl(m: XMedia): string | undefined {
  const mp4s = (m.variants ?? []).filter((v) => v.content_type === "video/mp4");
  if (mp4s.length === 0) return undefined;
  return mp4s.sort((a, b) => (b.bit_rate ?? 0) - (a.bit_rate ?? 0))[0]?.url;
}

// Skip X's own t.co media/quote-tweet links — only keep real external links.
const X_INTERNAL = /^https?:\/\/(www\.)?(x\.com|twitter\.com|pic\.x\.com|pic\.twitter\.com)/i;

export const xAdapter: SyncAdapter = {
  name: "x",
  intervalMs: 30 * 60 * 1000,

  async sync(ctx, { userId, cursor }) {
    const tok = await ctx.runQuery(internal.x.getProviderToken, { userId, providerId: "x" });
    if (!tok?.accessToken) throw new Error("X not connected");

    let accessToken = tok.accessToken;
    if (tok.refreshToken && tok.expiresAt && tok.expiresAt - Date.now() < 60_000) {
      const refreshed = await refreshXToken(tok.refreshToken);
      await ctx.runMutation(internal.x.updateProviderToken, { userId, providerId: "x", ...refreshed });
      accessToken = refreshed.accessToken;
    }

    const url = new URL(`${X_API}/users/${tok.accountId}/bookmarks`);
    url.searchParams.set("max_results", "100");
    url.searchParams.set("tweet.fields", "created_at,author_id,entities");
    url.searchParams.set("expansions", "author_id,attachments.media_keys");
    url.searchParams.set("media.fields", "url,preview_image_url,type,variants,duration_ms");
    url.searchParams.set("user.fields", "username");
    if (cursor) url.searchParams.set("pagination_token", cursor);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 401) throw new Error("X token revoked — reconnect");
      // 402/403: the bookmarks endpoint isn't included on the app's X API access tier.
      if (res.status === 402 || res.status === 403) {
        throw new Error(`X bookmarks require a paid X API tier (Basic+) — your app's plan doesn't allow it. ${detail.slice(0, 200)}`);
      }
      if (res.status === 429) throw new Error("X rate limited — try again later");
      throw new Error(`X bookmarks failed: ${res.status} ${detail.slice(0, 200)}`);
    }

    const body = bookmarksResponseSchema.parse(await res.json());
    const usernameById = new Map((body.includes?.users ?? []).map((u) => [u.id, u.username]));
    const mediaByKey = new Map((body.includes?.media ?? []).map((m) => [m.media_key, m]));

    const items = (body.data ?? []).map((t) => {
      const media: z.infer<typeof mediaItemSchema>[] = [];
      for (const key of t.attachments?.media_keys ?? []) {
        const m = mediaByKey.get(key);
        if (!m) continue;
        if (m.type === "photo" && m.url) {
          media.push({ type: "image", url: m.url });
        } else if (m.type === "video" || m.type === "animated_gif") {
          const videoUrl = bestVideoUrl(m);
          if (videoUrl) {
            media.push({ type: m.type === "video" ? "video" : "gif", url: videoUrl, durationSec: m.duration_ms ? m.duration_ms / 1000 : undefined });
          }
        }
      }

      const links: z.infer<typeof linkItemSchema>[] = [];
      const seen = new Set<string>();
      for (const u of t.entities?.urls ?? []) {
        const real = u.unwound_url ?? u.expanded_url;
        if (!real || X_INTERNAL.test(real) || seen.has(real)) continue;
        seen.add(real);
        links.push({ url: real, title: u.title, description: u.description, imageUrl: u.images?.[0]?.url });
      }

      return {
        externalId: t.id,
        url: `https://x.com/i/web/status/${t.id}`,
        text: t.text,
        author: t.author_id ? usernameById.get(t.author_id) : undefined,
        savedAt: t.created_at ? Date.parse(t.created_at) : Date.now(),
        media,
        links,
      };
    });

    return { items, nextCursor: body.meta?.next_token, hasMore: Boolean(body.meta?.next_token) };
  },

  async persist(ctx, { userId, items }) {
    const now = Date.now();
    // Plan item cap: once at the cap we still update existing saves, but stop
    // indexing *new* ones (the pricing promise: "pause indexing new items,
    // nothing is ever deleted"). Resumes automatically when the user upgrades.
    const cap = getPlanLimit(await planForUserId(ctx, userId), "maxItems");
    let count = await getItemCount(ctx, userId);
    for (const raw of items) {
      const item = persistItemSchema.parse(raw);
      const text = clean(item.text);
      const title = [...text].slice(0, 80).join(""); // code-point slice — never splits an emoji pair
      const author = item.author ? clean(item.author) : undefined;
      const media = item.media?.length ? item.media : undefined;
      const links = item.links?.length
        ? item.links.map((l) => ({
            url: l.url,
            title: l.title ? clean(l.title) : undefined,
            description: l.description ? clean(l.description) : undefined,
            imageUrl: l.imageUrl,
          }))
        : undefined;

      const existing = await ctx.db
        .query("items")
        .withIndex("by_user_source_ext", (q) =>
          q.eq("userId", userId).eq("source", "x").eq("externalId", item.externalId),
        )
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { text, title, author, media, links, syncedAt: now });
        continue;
      }
      if (cap !== undefined && count >= cap) continue;
      const itemId = await ctx.db.insert("items", {
        userId,
        source: "x",
        externalId: item.externalId,
        kind: "post",
        url: item.url,
        text,
        title,
        author,
        media,
        links,
        savedAt: item.savedAt,
        syncedAt: now,
        embedStatus: "pending",
      });
      await bumpItemCount(ctx, userId, 1);
      count++;
      await ctx.scheduler.runAfter(0, internal.embeddings.pipeline.embedItem, { itemId });
    }
  },
};
