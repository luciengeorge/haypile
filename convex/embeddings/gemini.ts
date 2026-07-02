/**
 * gemini-embedding-2 wrapper, the multimodal embedding engine.
 *
 * One model, one shared vector space for text + image + video (+ audio). A text
 * query and an image of the same concept land near each other, which is what
 * powers "search 'red car' → find the image/video of a red car".
 *
 * This module is intentionally Convex-free so it can be imported by both Convex
 * Node actions and the standalone spike script (scripts/spike-redcar.ts).
 *
 * Auth: Application Default Credentials (GOOGLE_CLOUD_PROJECT + ADC) is the primary
 * path, many GCP orgs disallow API keys via security policy. If VERTEX_API_KEY is
 * set (org permitting), it takes precedence. Local ADC: `gcloud auth application-default login`.
 *
 * Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings
 */

import { type Content, GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";

/** Standard service-account JSON fields google-auth needs (validated, not asserted). */
const ServiceAccountSchema = z.object({
  type: z.string(),
  project_id: z.string(),
  private_key: z.string(),
  client_email: z.string(),
  private_key_id: z.string().optional(),
  client_id: z.string().optional(),
  token_uri: z.string().optional(),
});

export const EMBED_MODEL = "gemini-embedding-2";

/**
 * Output vector size. 1536 fits Convex's vector index (max 4096) and is a good
 * quality/size tradeoff. gemini-embedding-2 is Matryoshka, outputs are
 * L2-normalized at non-default dims, so cosine similarity works directly.
 * MUST match the `dimensions` on the itemVectors vector index.
 */
export const EMBED_DIMS = 1536;

let client: GoogleGenAI | undefined;

export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  // gemini-embedding-2 is served on the global/us/eu endpoints only, NOT regional
  // (e.g. us-central1 returns 404). Default to global.
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? "global";

  // 1) Inline service-account JSON (the Convex prod path, env var string, no file).
  //    gemini-embedding-2 is Vertex-only and rejects plain API keys, so a service
  //    account is the credential that works on Convex's servers.
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saJson) {
    const credentials = ServiceAccountSchema.parse(JSON.parse(saJson));
    const project = process.env.GOOGLE_CLOUD_PROJECT ?? credentials.project_id;
    client = new GoogleGenAI({ vertexai: true, project, location, googleAuthOptions: { credentials } });
    return client;
  }

  // 2) Express-mode API key (only if the org allows keys AND they work for the model).
  const apiKey = process.env.VERTEX_API_KEY;
  if (apiKey) {
    client = new GoogleGenAI({ vertexai: true, apiKey });
    return client;
  }

  // 3) Application Default Credentials (local dev: `gcloud auth application-default login`,
  //    or a GOOGLE_APPLICATION_CREDENTIALS file path).
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (project) {
    client = new GoogleGenAI({ vertexai: true, project, location });
    return client;
  }

  throw new Error(
    "No Vertex credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON (Convex), or GOOGLE_CLOUD_PROJECT (+ local ADC).",
  );
}

async function embedOne(content: Content): Promise<number[]> {
  const ai = getGeminiClient();
  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: content,
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
  const parts: Part[] = [];
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
 * running ffmpeg ourselves, Gemini samples frames internally per window.
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
  if (!uri && !data) throw new Error("embedVideoSegment requires either `data` or `uri`");
  const videoMetadata = {
    startOffset: `${Math.max(0, Math.floor(startSec))}s`,
    endOffset: `${Math.ceil(endSec)}s`,
    fps,
  };
  const part: Part = uri
    ? { fileData: { fileUri: uri, mimeType }, videoMetadata }
    : { inlineData: { data, mimeType }, videoMetadata };
  return embedOne({ role: "user", parts: [part] });
}

/** Cosine similarity for two equal-length vectors (vectors are L2-normalized → dot product). */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}
