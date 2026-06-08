# Pricing & Cost Caps

Status: **LOCKED** (cost model run, numbers fixed). Source of truth until wired into `convex/lib/plans.ts` at implementation.

No free tier. Capped trial → **Starter** or **Pro**.

## Unit costs (Vertex, `gemini-embedding-2`)

| Modality | Price | Notes |
|---|---|---|
| Text | $0.20 / 1M tokens | ~$0.00001–0.0004 per item |
| Image | $0.00012 / image | flat |
| Video | $0.00079 / frame | frames = fps × seconds |
| Audio | $0.00016 / sec | not used at launch |

Video is the COGS driver: ~40–100× a text/image item.

## Per-item cost by modality

- Text: ~$0.00001–0.0004
- Image: ~$0.00012
- Video: **0.25 fps × ≤60s ⇒ ≤15 frames ⇒ ≤$0.012/video** (0.5 fps doubles it → use 0.25 fps default)
- Link (deep fetch → text): ~text cost, + bandwidth/time

## Plans (LOCKED)

| Plan | Items cap | Modalities | Monthly | Yearly (2mo free) |
|---|---|---|---|---|
| Trial | **1,000** | text + image only | free · **14 days** | — |
| Starter | **2,000** | text + image | £6 | £60 |
| Pro | **20,000** | text + image + **video** + **deep-link fetch** | £12 | £120 |

**Video + deep-link fetch = Pro-only.** Biggest cost lever; gated by plan rank (`requirePlan`), not a numeric limit.

## Trial (LOCKED)

- **14 days, no card.** Low funnel friction; maxed-trial COGS ≈ $0.20 so abuse is cheap.
- **1,000 items, text + image only** — video + deep-link OFF (expensive modalities never run free).
- **All 6 sources** connectable + weekly digest — full breadth so the rediscovery "aha" lands.
- **At expiry:** search locks; data + embeddings retained 30 days, then purged. Resubscribe restores.
- **On upgrade:** trial items carry over (count toward new cap); Pro triggers one-time video + deep-link backfill.
- Must be time-limited, not item-cap-only — a forever cap = a free tier, which is ruled out.

## COGS & margin

- Starter @ 2,000 (text+image): ~**$0.40** one-time COGS → ~99% margin.
- Pro @ 20,000 (mixed, video-heavy worst case): ~**$10–36** one-time → ~93% steady-state margin.
- Caps are item caps, not monthly recompute — embeds are one-time per item.

## Guardrails (anti-abuse)

1. **Trial = 14 days · 1,000 items · text+image · no card.** Video + deep-link off entirely → a trial can't touch Pro-level video COGS (~$0.20 maxed).
2. **Video frame cap**: 0.25 fps, ≤60s ⇒ ≤15 frames/video. Keep low fps.
3. **Per-account video safety cap** (~2,000 videos) even within Pro's 20,000 items.

## Implementation status

DONE:
- `convex/lib/plans.ts`: prices 6/60 + 12/120; `limits.maxItems` 1000/2000/20000, Pro `maxVideos` 2000; `allowsRichMedia`.
- Modality gating: `video_segment` + link deep-fetch are Pro-only (`allowsRichMedia` in `embeddings/pipeline.ts`, plan via `planForUserId`).
- **Item cap enforced**: `sync/adapters/*.persist` stops indexing *new* items once `itemCounts >= maxItems` (existing saves still update; resumes on upgrade). Backed by the denormalized `itemCounts` counter.

Deferred:
- Per-account video safety cap (~2,000 videos) within Pro — needs a video-segment counter.
- Trial 14-day expiry (search locks; retain 30 days then purge).
- On Pro upgrade: one-time backfill of existing video + deep-link items.
- `convex/embeddings/pipeline.ts`: per-plan frame/img/link consts (0.25 fps already enforced via MAX_VIDEO_SEC/VIDEO_FPS).
- Rename `free` plan id → `trial` in plans.ts; `limits.maxItems` 1000, `trialDays` 14, no video/link.
- Trial: skip `video_segment` + link fan-out until upgrade; enforce 14-day expiry (search locks, data retained 30 days then purge).
- On Pro upgrade: one-time backfill of existing video + deep-link items (monetized COGS spike, acceptable).

---

# Unit economics

The embedding margins above are **gross (embedding-only)**. This section adds platform, payment, and infra costs for the true blended picture.

**Assumptions:** USD/GBP 1.27 · **Polar Starter plan 5% + 50¢, +1.5% non-US cards ⇒ ~6.5% + 50¢ effective** (Early Member 4%+40¢ expired 2026-05-27) · ~5 emails/user/mo · **no persistent video storage** (bytes fetched at embed time) · Convex usage = confirmed rates below, volume pending telemetry. Verified 2026-06-03.

## Cost taxonomy

1. **Fixed** — platform subscriptions, flat regardless of users (amortize as you grow).
2. **Per-transaction** — Polar fee, hits every charge.
3. **Per-user variable** — embedding (one-time/item), Convex usage (storage + calls).

## 1. Fixed platform costs (monthly)

| Service | Cost | Notes |
|---|---|---|
| Vercel Pro | ~$20 | + bandwidth/invocation overages |
| Convex Pro | ~$25 | base; usage overages are per-user variable |
| Resend | $0 → $20 | free 3k/mo but **100/day cap** → digest burst forces Pro (~$20) at ~100 users |
| Domain | ~$1.5 | annual amortized |
| **Baseline** | **~$46 early / ~$66 scaling** | |

## 2. Payment fees (Polar — 5% + 50¢, +1.5% non-US ⇒ ~6.5% + 50¢ effective)

Early Member (4%+40¢) expired 2026-05-27; a new org starts on **Starter: 5% + 50¢**. UK product ⇒ most cards non-US (+1.5%). US cards ~1.5pt cheaper than shown.

| Plan · billing | Price (USD) | Fee (eff.) | % of price |
|---|---|---|---|
| Starter · monthly | $7.62 | $1.00 | **13.1%** |
| Starter · annual | $76.20 | $5.45 | **7.2%** |
| Pro · monthly | $15.24 | $1.49 | **9.8%** |
| Pro · annual | $152.40 | $10.41 | **6.8%** |

**Lever:** annual = 1 txn/yr vs 12, saving ~6 pts (Starter) / ~3 pts (Pro). The fixed 50¢ punishes cheap monthly subs (13% on £6/mo) — push annual hard.
**Future:** Polar Pro plan ($20/mo → 3.8%+40¢) only pays off past ~$1,379/mo sales; stay on Starter rate until then.

## 3. Per-user variable

- **Embedding (one-time, amortize over lifetime):**
  - Starter full 2k: ~$0.40 once → <0.5%/mo. Trivial.
  - Pro full 20k (video-heavy): $10–36 once → **year-1 $0.83–3.00/mo (5–20% of revenue)**; steady-state (only new items) ~$0.20/mo.
- **Convex usage (rates confirmed):** Pro $25 base includes 25M fn-calls, 50GB DB, **1GB search storage** (then $0.50/GB), 50k query-GBs. Vectors live in *search storage*: 20k items ≈ 0.24GB/Pro user → overage starts ~4 maxed Pro users; 100 maxed ≈ 24GB ≈ $12/mo ≈ **~$0.12/Pro user/mo**. Search-query volume stays inside the 50k-query-GB quota at hundreds of users.
- **GCS:** $0 at launch (no stored video). If large-clip upload path added later: ~$0.02/GB/mo + egress.

## Blended margin (annual billing, mix 70% Starter / 30% Pro)

Avg revenue ≈ **$8.26/user/mo**. Avg variable (payment ~$0.58 + steady embedding ~$0.08 + Convex ~$0.13) ≈ **$0.79/user/mo** → contribution **~90%** before fixed costs.

After amortizing ~$65/mo fixed:

| Paying users | Fixed/user | Net margin |
|---|---|---|
| 50 | $1.30 | **~75%** |
| 500 | $0.13 | **~89%** |
| 5,000 | $0.013 | **~90%** |

**Break-even on fixed costs: ~9 paying users.**

## Caveats / reality checks

- **Year 1 is worse than the table.** Embedding unamortized + early users bill monthly (13% Polar drag) → expect ~70–80% blended early, climbing to ~90% as you scale + shift annual.
- Worst case = a Pro user maxing 20k video items, monthly, month 1: embedding $10–36 + payment $1.49 can exceed one month's $15.24. **Exactly what trial-defers-video + the per-account video cap protect against.**
- Convex at scale is the one cost that could surprise — re-price once search volume is real.
- Support/your time not costed here.

## Confirmed (2026-06-03)
- **Polar:** Starter 5% + 50¢, +1.5% non-US; Early Member 4%+40¢ retired 2026-05-27. Pro-plan breakeven ~$1,379/mo sales.
- **Resend:** free 3k/mo + 100/day; Pro $20 = 50k/mo. Daily cap → Pro at ~100 users.
- **Convex:** Pro $25 + overages (search storage $0.50/GB, fn-calls $2/M, DB $0.20/GB).
- **GCS:** standard ~$0.02/GB/mo + $0.12/GB egress — no video stored at launch ⇒ ~$0.

## Still open
- Emails/user/mo (5 assumed) — refine once digest cadence final.
- Convex search-query volume per active user — re-price on real telemetry.
- Pricing call: keep £6 monthly (13% Polar drag) or push annual-only / nudge price?
