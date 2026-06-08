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
| Starter product (£6/mo) | `c31253f6-b7f7-4db6-b92d-c173281e2cbd` | `d2dc5765-334f-451b-9ba5-95f9716cee7e` |
| Pro product (£12/mo) | `d245c4d6-8b75-4af0-adc3-27eddf011dc3` | `f5d92974-7b4e-4ef8-92dc-1687b884077f` |
| Webhook → `/polar/webhook` | `third-salamander-859.convex.site` | `pastel-weasel-135.convex.site` |
| `POLAR_SERVER` | `sandbox` | `production` |

Convex env set on each deployment: `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_STARTER`,
`POLAR_PRODUCT_PRO`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`. Webhook events subscribed:
`subscription.created/updated`, `product.created/updated` (the `@convex-dev/polar` component
handles these; Polar fires `subscription.updated` on all lifecycle changes).

## Notes / gotchas

- `createCheckout` had to be an **action**, not a mutation — the Polar SDK uses `fetch()`,
  which Convex forbids in queries/mutations. (Fixed in `convex/billing/queries.ts`; client uses
  `useAction` in `upgrade-modal.tsx`.)
- The Polar MCP couldn't be used: its bound org isn't the GBP org, and it exposes no
  org-currency / token-mint tool. Everything was done via the REST API with the org tokens in
  `.env.local` (`POLAR_ACCESS_TOKEN` = prod, `POLAR_SANDBOX_ACCESS_TOKEN` = sandbox).
- Annual prices (£60/£120) need a second product per plan + the monthly/annual toggle wired to
  them — deferred. The marketing pricing toggle is display-only.
