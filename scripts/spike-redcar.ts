/**
 * M0 spike: prove multimodal visual search works end-to-end.
 *
 * Hand-feeds a handful of real photos to gemini-embedding-2, embeds a few text
 * queries in the same space, and ranks images by cosine similarity. If the
 * thesis holds, "red car" ranks the red-car photo #1 even though no text/title
 * mentions a car.
 *
 * Run:
 *   1. Get a Vertex express-mode API key (see README "External setup").
 *   2. export VERTEX_API_KEY=...   (or put it in .env.local and use dotenv)
 *   3. pnpm spike
 *
 * Cost: ~8 images + a few queries ≈ a fraction of a cent.
 */

import { cosineSimilarity, embedImage, embedQuery } from "../convex/embeddings/gemini";

interface Sample {
  label: string;
  url: string;
}

// Real photos with NO descriptive text passed to the model — the match must
// come purely from visual understanding.
const SAMPLES: Sample[] = [
  { label: "red sports car", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=640&q=70" },
  { label: "blue car", url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=640&q=70" },
  { label: "golden retriever dog", url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=640&q=70" },
  { label: "tropical beach", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&q=70" },
  { label: "laptop on desk", url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=640&q=70" },
  { label: "plate of pasta", url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=640&q=70" },
  { label: "snowy mountains", url: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=640&q=70" },
  { label: "city skyline at night", url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=640&q=70" },
];

const QUERIES = ["red car", "a dog", "somewhere to go on holiday", "where I work", "food"];

async function fetchAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mimeType };
}

async function main() {
  if (!process.env.VERTEX_API_KEY && !process.env.GOOGLE_CLOUD_PROJECT) {
    console.error(
      "\n❌ No Vertex credentials.\n" +
        "   Set VERTEX_API_KEY (express mode) or GOOGLE_CLOUD_PROJECT (+ ADC).\n" +
        "   See README → External setup.\n",
    );
    process.exit(1);
  }

  console.log(`\n🔢 Embedding ${SAMPLES.length} images with gemini-embedding-2…\n`);

  const embedded: { label: string; vector: number[] }[] = [];
  for (const s of SAMPLES) {
    try {
      const { data, mimeType } = await fetchAsBase64(s.url);
      const vector = await embedImage({ data, mimeType });
      embedded.push({ label: s.label, vector });
      console.log(`  ✓ ${s.label}`);
    } catch (e) {
      console.log(`  ✗ ${s.label} — ${e instanceof Error ? e.message : e}`);
    }
  }

  if (embedded.length === 0) {
    console.error("\nNo images embedded. Aborting.\n");
    process.exit(1);
  }

  for (const query of QUERIES) {
    const qVec = await embedQuery(query);
    const ranked = embedded
      .map((e) => ({ label: e.label, score: cosineSimilarity(qVec, e.vector) }))
      .sort((a, b) => b.score - a.score);

    console.log(`\n🔎 "${query}"`);
    ranked.slice(0, 3).forEach((r, i) => {
      const bar = "█".repeat(Math.round(r.score * 40));
      console.log(`   ${i + 1}. ${r.label.padEnd(26)} ${r.score.toFixed(3)} ${bar}`);
    });
  }

  console.log("\n✅ Spike complete. If 'red car' ranked the red car #1, the thesis holds.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
