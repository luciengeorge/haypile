# Polar setup — DONE (sandbox + production)

Polar is fully wired and verified end-to-end. Pricing source of truth is `convex/lib/plans.ts`
(**Starter £6/mo, Pro £12/mo**; annual £60/£120 deferred). See `docs/pricing-caps.md`.

Sandbox checkout was verified live: Upgrade → Pro redirects to `sandbox.polar.sh/checkout/...`
showing £12/mo with the user's email prefilled.

## What was configured

Org "Lucien" (slug `lucien`), `default_presentment_currency = gbp` on both environments.
(The sandbox org was still USD despite the dashboard toggle — set it via
`PATCH /v1/organizations/{id}` `{"default_presentment_currency":"gbp"}`.)

| Item | Sandbox | Production |
| --- | --- | --- |
| Starter (£6/mo) | `c31253f6-b7f7-4db6-b92d-c173281e2cbd` | `d2dc5765-334f-451b-9ba5-95f9716cee7e` |
| Pro (£12/mo) | `d245c4d6-8b75-4af0-adc3-27eddf011dc3` | `f5d92974-7b4e-4ef8-92dc-1687b884077f` |
| Starter Annual (£60/yr) | `073ebf2d-7e43-4588-ac56-602265bc9d4d` | `2a437e86-badf-4268-a36d-0a93545950e2` |
| Pro Annual (£120/yr) | `2c108a49-8bda-4a6a-88b9-2a70908f6f4b` | `91da2c64-4349-4e5a-b652-a09154053404` |
| Webhook → `/polar/webhook` | `third-salamander-859.convex.site` | `pastel-weasel-135.convex.site` |
| `POLAR_SERVER` | `sandbox` | `production` |

Convex env set on each deployment: `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_STARTER`,
`POLAR_PRODUCT_PRO`, `POLAR_PRODUCT_STARTER_ANNUAL`, `POLAR_PRODUCT_PRO_ANNUAL`,
`POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`. Webhook events subscribed:
`subscription.created/updated`, `product.created/updated` (the `@convex-dev/polar` component
handles these; Polar fires `subscription.updated` on all lifecycle changes).

## Notes / gotchas

- `createCheckout` had to be an **action**, not a mutation — the Polar SDK uses `fetch()`,
  which Convex forbids in queries/mutations. (Fixed in `convex/billing/queries.ts`; client uses
  `useAction` in `upgrade-modal.tsx`.)
- The Polar MCP couldn't be used: its bound org isn't the GBP org, and it exposes no
  org-currency / token-mint tool. Everything was done via the REST API with the org tokens in
  `.env.local` (`POLAR_ACCESS_TOKEN` = prod, `POLAR_SANDBOX_ACCESS_TOKEN` = sandbox).
- Annual billing is wired: separate annual products per plan + a monthly/annual toggle in the
  Upgrade modal. `createCheckout({ plan, cycle })` picks the right product; `planForProductId`
  maps monthly + annual IDs back to the plan. Verified live (Pro Annual → £120/yr sandbox checkout).
- The marketing pricing-page toggle stays display-only (it links to the trial, not checkout).
