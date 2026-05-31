/**
 * gemini-embedding-2 wrapper — the multimodal embedding engine.
 *
 * One model, one shared vector space for text + image + video (+ audio). A text
 * query and an image of the same concept land near each other, which is what
 * powers "search 'red car' → find the image/video of a red car".
 *
 * This module is intentionally Convex-free so it can be imported by both Convex
 * Node actions and the standalone spike script (scripts/spike-redcar.ts).
 *
 * Auth: Vertex AI "express mode" API key (VERTEX_API_KEY) is the simplest path.
 * Falls back to ADC / service account (GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION)
 * when no key is present.
 *
 * Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings
 */

import { GoogleGenAI } from "@google/genai";

export const EMBED_MODEL = "gemini-embedding-2";

/**
 * Output vector size. 1536 fits Convex's vector index (max 4096) and is a good
 * quality/size tradeoff. gemini-embedding-2 is Matryoshka — outputs are
 * L2-normalized at non-default dims, so cosine similarity works directly.
 * MUST match the `dimensions` on the itemVectors vector index.
 */
export const EMBED_DIMS = 1536;

let client: GoogleGenAI | undefined;

export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.VERTEX_API_KEY;
  if (apiKey) {
    // Express mode: plain API key, no service-account JSON.
    client = new GoogleGenAI({ vertexai: true, apiKey });
    return client;
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
  if (project) {
    // ADC / service account fallback (GOOGLE_APPLICATION_CREDENTIALS).
    client = new GoogleGenAI({ vertexai: true, project, location });
    return client;
  }

  throw new Error(
    "No Vertex credentials. Set VERTEX_API_KEY (express mode) or GOOGLE_CLOUD_PROJECT (+ ADC) in the environment.",
  );
}

async function embedOne(contents: unknown): Promise<number[]> {
  const ai = getGeminiClient();
  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    // The SDK's ContentListUnion is permissive; we pass a single content object.
    contents: contents as never,
    config: { outputDimensionality: EMBED_DIMS },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("gemini-embedding-2 returned no embedding values");
  }
  return values;
}

/**
 * Embed a stored/article/post item's text.
 *
 * For text-to-text retrieval, gemini-embedding-2 benefits from task instructions
 * embedded in the prompt (it ignores the legacy taskType field). We format
 * documents as `title: ... | text: ...`. Cross-modal (text query → image) doesn't
 * need this, but it's harmless and improves text↔text recall.
 */
export async function embedText(text: string, title?: string): Promise<number[]> {
  const doc = `title: ${title ?? "none"} | text: ${text}`;
  return embedOne({ role: "user", parts: [{ text: doc }] });
}

/**
 * Embed a search query. Formatted as a retrieval query so it aligns with how
 * documents were embedded. Works cross-modally: this text vector retrieves
 * matching image + video-segment vectors too.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const q = `task: search result | query: ${query}`;
  return embedOne({ role: "user", parts: [{ text: q }] });
}

interface ImageInput {
  /** Base64 (no data: prefix) OR a gs:// / https:// URI. */
  data?: string;
  uri?: string;
  mimeType: string;
  /** Optional surrounding text (e.g. tweet caption) to enrich the image vector. */
  contextText?: string;
}

/** Embed a single image into the shared space. */
export async function embedImage({ data, uri, mimeType, contextText }: ImageInput): Promise<number[]> {
  const parts: Record<string, unknown>[] = [];
  if (contextText) parts.push({ text: contextText });
  if (uri) {
    parts.push({ fileData: { fileUri: uri, mimeType } });
  } else if (data) {
    parts.push({ inlineData: { data, mimeType } });
  } else {
    throw new Error("embedImage requires either `data` or `uri`");
  }
  return embedOne({ role: "user", parts });
}

interface VideoSegmentInput {
  /** Base64 (no data: prefix) OR a gs:// / https:// URI to the video. */
  data?: string;
  uri?: string;
  mimeType: string;
  startSec: number;
  endSec: number;
  /**
   * Frames per second sampled within the window. Lower = cheaper (billed per
   * frame at $0.00079). 0.25–0.5 keeps cost sane with minimal recall loss for
   * object queries. Valid range (0, 24].
   */
  fps?: number;
}

/**
 * Embed ONE time-window of a video → one vector tagged with [startSec, endSec).
 * Call repeatedly across windows (e.g. 15s segments) to get multi-vector
 * granularity so a brief "red car" moment is findable + deep-linkable, without
 * running ffmpeg ourselves — Gemini samples frames internally per window.
 *
 * Limits: 1 video/call, ≤120s (no audio) / ≤80s (with audio). Chunk longer videos.
 */
export async function embedVideoSegment({
  data,
  uri,
  mimeType,
  startSec,
  endSec,
  fps = 0.5,
}: VideoSegmentInput): Promise<number[]> {
  const videoMetadata = {
    startOffset: `${Math.max(0, Math.floor(startSec))}s`,
    endOffset: `${Math.ceil(endSec)}s`,
    fps,
  };
  const media = uri ? { fileData: { fileUri: uri, mimeType } } : { inlineData: { data, mimeType } };
  if (!uri && !data) throw new Error("embedVideoSegment requires either `data` or `uri`");
  return embedOne({ role: "user", parts: [{ ...media, videoMetadata }] });
}

/** Cosine similarity for two equal-length vectors (vectors are L2-normalized → dot product). */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}
