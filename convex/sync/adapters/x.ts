import z from "zod";

import { internal } from "../../_generated/api";
import type { SyncAdapter } from "../types";

const X_API = "https://api.x.com/2";

const bookmarksResponseSchema = z.object({
  data: z
    .array(z.object({ id: z.string(), text: z.string(), created_at: z.string().optional(), author_id: z.string().optional() }))
    .optional(),
  includes: z
    .object({ users: z.array(z.object({ id: z.string(), username: z.string() })).optional() })
    .optional(),
  meta: z.object({ next_token: z.string().optional() }).optional(),
});

const refreshResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
});

const persistItemSchema = z.object({
  externalId: z.string(),
  url: z.string(),
  text: z.string(),
  author: z.string().optional(),
  savedAt: z.number(),
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
    url.searchParams.set("tweet.fields", "created_at,author_id");
    url.searchParams.set("expansions", "author_id");
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
    const items = (body.data ?? []).map((t) => ({
      externalId: t.id,
      url: `https://x.com/i/web/status/${t.id}`,
      text: t.text,
      author: t.author_id ? usernameById.get(t.author_id) : undefined,
      savedAt: t.created_at ? Date.parse(t.created_at) : Date.now(),
    }));

    return { items, nextCursor: body.meta?.next_token, hasMore: Boolean(body.meta?.next_token) };
  },

  async persist(ctx, { userId, items }) {
    const now = Date.now();
    for (const raw of items) {
      const item = persistItemSchema.parse(raw);
      const text = clean(item.text);
      const title = [...text].slice(0, 80).join(""); // code-point slice — never splits an emoji pair
      const author = item.author ? clean(item.author) : undefined;
      const existing = await ctx.db
        .query("items")
        .withIndex("by_user_source_ext", (q) =>
          q.eq("userId", userId).eq("source", "x").eq("externalId", item.externalId),
        )
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { text, title, author, syncedAt: now });
        continue;
      }
      const itemId = await ctx.db.insert("items", {
        userId,
        source: "x",
        externalId: item.externalId,
        kind: "post",
        url: item.url,
        text,
        title,
        author,
        savedAt: item.savedAt,
        syncedAt: now,
        embedStatus: "pending",
      });
      await ctx.scheduler.runAfter(0, internal.embeddings.pipeline.embedItem, { itemId });
    }
  },
};
