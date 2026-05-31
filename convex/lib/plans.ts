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
export const PLANS = {
  free: {
    name: "Free",
    description: "Try the product, no credit card required.",
    priceId: { polar: null, stripe: null },
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      // Add per-plan caps here, used by requirePlan() / usage meters.
      // Example: maxItems: 100, maxSearchesPerDay: 30,
    } as Record<string, number>,
  },
  starter: {
    name: "Starter",
    description: "For individuals shipping side projects.",
    priceId: {
      polar: process.env.POLAR_PRODUCT_STARTER ?? null,
      stripe: process.env.STRIPE_PRICE_STARTER ?? null,
    },
    monthlyPrice: 4,
    yearlyPrice: 36,
    limits: {} as Record<string, number>,
  },
  pro: {
    name: "Pro",
    description: "For power users.",
    priceId: {
      polar: process.env.POLAR_PRODUCT_PRO ?? null,
      stripe: process.env.STRIPE_PRICE_PRO ?? null,
    },
    monthlyPrice: 9,
    yearlyPrice: 72,
    limits: {} as Record<string, number>,
  },
} as const;

export type PlanId = keyof typeof PLANS;

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
