#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { readFile } from "node:fs/promises";

import { api } from "../convex/_generated/api.js";

const [file, userIdArg, sourceArg] = process.argv.slice(2);
const convexUrl = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
const secret = process.env.IMPORT_SECRET;
const userId = userIdArg ?? process.env.USER_ID;
const source = sourceArg ?? process.env.SOURCE;
const batchSize = Number(process.env.IMPORT_BATCH_SIZE ?? 50);

if (!file || !convexUrl || !secret || !userId || !source) {
  throw new Error(
    "Usage: CONVEX_URL=... IMPORT_SECRET=... node scripts/concierge-import.mjs items.json <userId> <source>",
  );
}
if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("IMPORT_BATCH_SIZE must be a positive integer");

const raw = JSON.parse(await readFile(file, "utf8"));
if (!Array.isArray(raw)) throw new Error("Normalized import file must contain an array");

const client = new ConvexHttpClient(convexUrl);
let inserted = 0;
let updated = 0;

for (let start = 0; start < raw.length; start += batchSize) {
  const end = Math.min(start + batchSize, raw.length);
  const result = await client.action(api.import.concierge.importItems, {
    secret,
    userId,
    source,
    items: raw.slice(start, end),
  });
  inserted += result.inserted;
  updated += result.updated;
  console.log(`batch ${start + 1}-${end}/${raw.length}: inserted ${result.inserted}, updated ${result.updated}`);
}

console.log(`done: inserted ${inserted}, updated ${updated}, total ${raw.length}`);
