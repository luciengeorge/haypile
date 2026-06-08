/**
 * Pricing plan definitions.
 *
 * `priceId` keys map your internal plan names to the IDs your billing provider uses.
 * Polar product IDs and Stripe price IDs are both opaque strings — set them via env
 * vars or hard-code per environment.
 *
 * Add `limits` per plan to drive feature gates (e.g. max bookmarks, max searches/day,
 * max sources connected). Use `getPlanLimit(plan, "feature")` to read at runtime.
 */
export type PlanId = "free" | "starter" | "pro";

type Plan = {
  name: string;
  description: string;
  priceId: { polar: string | null; stripe: string | null };
  monthlyPrice: number;
  yearlyPrice: number;
  // Per-plan caps for requirePlan() / usage meters, e.g. { maxItems: 10000, maxVideos: 300 }.
  limits: Record<string, number>;
};

// Prices in GBP. Caps are item caps (one-time embed per item). Video + deep-link
// embedding is Pro-only (gated in requirePlan/pipeline, not a numeric limit).
// See docs/pricing-caps.md for the full locked model.
export const PLANS: Record<PlanId, Plan> = {
  free: {
    name: "Trial",
    description: "14 days to dig through everything you've saved.",
    priceId: { polar: null, stripe: null },
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { maxItems: 1000 },
  },
  starter: {
    name: "Starter",
    description: "Text & image search across all your sources.",
    priceId: {
      polar: process.env.POLAR_PRODUCT_STARTER ?? null,
      stripe: process.env.STRIPE_PRICE_STARTER ?? null,
    },
    monthlyPrice: 6,
    yearlyPrice: 60,
    limits: { maxItems: 2000 },
  },
  pro: {
    name: "Pro",
    description: "Everything — including video & link search.",
    priceId: {
      polar: process.env.POLAR_PRODUCT_PRO ?? null,
      stripe: process.env.STRIPE_PRICE_PRO ?? null,
    },
    monthlyPrice: 12,
    yearlyPrice: 120,
    limits: { maxItems: 20000, maxVideos: 2000 },
  },
};

export const PLAN_HIERARCHY: PlanId[] = ["free", "starter", "pro"];

export function planRank(plan: PlanId): number {
  return PLAN_HIERARCHY.indexOf(plan);
}

export function planMeetsRequirement(userPlan: PlanId, required: PlanId): boolean {
  return planRank(userPlan) >= planRank(required);
}

export function getPlanLimit(plan: PlanId, key: string): number | undefined {
  return PLANS[plan].limits[key];
}

// Video + deep-link embedding are the COGS driver, so they're Pro-only.
// Trial + Starter get text + image. See docs/pricing-caps.md.
export function allowsRichMedia(plan: PlanId): boolean {
  return plan === "pro";
}
