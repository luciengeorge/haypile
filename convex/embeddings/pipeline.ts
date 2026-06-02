"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { embedImage, embedText, embedVideoSegment } from "./gemini";

// Cost levers (tunable; per-plan gating via requirePlan() lands later).
const MAX_IMAGES = 4; // X allows ≤4 photos per tweet
const MAX_LINKS = 3; // fetch + embed at most this many links per item
const MAX_VIDEO_SEC = 60; // cap how much of a video we embed
const VIDEO_FPS = 0.25; // frames/sec sampled inside the window ($0.00079/frame)
const MAX_MEDIA_BYTES = 15_000_000; // skip media larger than this (inline embed)
const PAGE_TEXT_LIMIT = 6000; // ~fits the embedding model's input budget

type VectorRow = {
  modality: "text" | "image" | "video_segment";
  startSec?: number;
  endSec?: number;
  embedding: number[];
};

async function fetchAsBase64(url: string, maxBytes: number): Promise<{ data: string; mimeType: string } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0 || buf.length > maxBytes) return null;
  const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
  return { data: buf.toString("base64"), mimeType };
}

// Lightweight readability: title + meta/OG description + stripped body text.
function extractText(html: string): string {
  const capped = html.slice(0, 1_000_000);
  const title = capped.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
  const desc =
    capped.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "";
  const body = capped
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [title, desc, body].filter(Boolean).join(". ").slice(0, PAGE_TEXT_LIMIT);
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bookmarks/1.0; +https://github.com/luciengeorge/bookmarks)" },
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) return null;
    const text = extractText(await res.text());
    return text.length > 20 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Embed one item into the shared vector space — multimodal. A single item (e.g. a
 * tweet) fans out into many vectors: its text + each photo + each video + each
 * link's preview image and fetched page content. Each attachment is best-effort:
 * one failed image/link won't fail the whole item.
 */
export const embedItem = internalAction({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.runQuery(internal.items.getForEmbed, { itemId });
    if (!item) return;

    try {
      const vectors: VectorRow[] = [];

      // 1. Text vector: item text + each link's title/description (so a link-only
      //    tweet like "try it <t.co>" becomes findable on the link's topic).
      const linkMeta = (item.links ?? [])
        .flatMap((l: { title?: string; description?: string }) => [l.title, l.description])
        .filter(Boolean)
        .join("\n");
      const baseText = [item.title, item.text, linkMeta].filter(Boolean).join("\n\n").trim();
      if (baseText) vectors.push({ modality: "text", embedding: await embedText(baseText, item.title) });

      // 2. Attached media (X photos + videos/gifs).
      for (const m of (item.media ?? []).slice(0, MAX_IMAGES)) {
        try {
          if (m.type === "image") {
            const img = await fetchAsBase64(m.url, MAX_MEDIA_BYTES);
            if (img) vectors.push({ modality: "image", embedding: await embedImage({ ...img, contextText: item.title }) });
          } else {
            const vid = await fetchAsBase64(m.url, MAX_MEDIA_BYTES);
            if (vid) {
              const end = Math.min(m.durationSec ?? MAX_VIDEO_SEC, MAX_VIDEO_SEC);
              const embedding = await embedVideoSegment({ data: vid.data, mimeType: vid.mimeType, startSec: 0, endSec: end, fps: VIDEO_FPS });
              vectors.push({ modality: "video_segment", startSec: 0, endSec: end, embedding });
            }
          }
        } catch {
          // skip this attachment; keep the rest
        }
      }

      // 3. Links: the link's preview image + its fetched page content.
      for (const l of (item.links ?? []).slice(0, MAX_LINKS)) {
        try {
          if (l.imageUrl) {
            const img = await fetchAsBase64(l.imageUrl, MAX_MEDIA_BYTES);
            if (img) vectors.push({ modality: "image", embedding: await embedImage({ ...img, contextText: l.title }) });
          }
          const page = await fetchPageText(l.url);
          if (page) vectors.push({ modality: "text", embedding: await embedText(page, l.title) });
        } catch {
          // skip this link; keep the rest
        }
      }

      // 4. Legacy storage-backed media (non-X sources that upload to Convex storage).
      if (vectors.length === 0 && item.kind === "image" && item.mediaStorageId) {
        const blob = await ctx.storage.get(item.mediaStorageId);
        if (blob) {
          const data = Buffer.from(await blob.arrayBuffer()).toString("base64");
          const embedding = await embedImage({ data, mimeType: blob.type || "image/jpeg", contextText: item.title });
          vectors.push({ modality: "image", embedding });
        }
      }

      // 5. Fallback so every item is at least findable by its URL.
      if (vectors.length === 0) {
        vectors.push({ modality: "text", embedding: await embedText(item.url) });
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
