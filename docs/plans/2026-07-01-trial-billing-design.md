# Trial, limits & billing lifecycle — implementation plan

Status: approved (design mockups in Paper `01KT68ED4RQJFKN9E2ZCSR22PV`). Model B.

## Model
Card-required, Polar-native 7-day trial. At signup: passwordless auth → **plan picker**
(Starter/Pro, monthly/annual, Pro highlighted) → Polar checkout with a 7-day trial (card
captured) → auto-bills unless cancelled. **No free tier.** Polar owns the trial clock,
conversion, dunning, cancellation, and the trial-ending reminder email (3 days before —
verified in Polar docs). We build only the app-specific pieces below.

## Access states (from `myEntitlement`)
- `trialing` | `active` → full access, per-plan caps.
- no sub / `canceled` / `past_due` (lapsed) → **locked wall**; access-ended data retention.
- Admins (`ADMIN_USER_IDS`) + no `POLAR_ACCESS_TOKEN` (self-host/dev) → treated as `pro`.

## Data — `subscriptions` table (app snapshot; component is source of truth)
`userId`, `customerId`, `subscriptionId`, `status`, `accessEndedAt`, `purgeAt`,
`limit80SentAt`, `limit100SentAt`, `graceEndingSentAt`. Indexes `by_user`, `by_customer`.

## Backend
- `createCheckout`: add `trialInterval:"day"`, `trialIntervalCount:7` (all plans/cycles).
- `myEntitlement` query: `{ plan, status, trialEnd, itemCount, cap, pct }` from the synced
  Polar sub + `itemCounts` + this table.
- Server gate: `search` + sync scheduling refuse unless `trialing`/`active`.
- Polar webhook (already registered): upsert the `subscriptions` snapshot on
  subscription.created/updated; on lapse (status not trialing/active) set `accessEndedAt` +
  schedule grace email (`runAt` +27d) and purge (`runAt` +30d) via `ctx.scheduler`;
  re-check status at fire time (skip if reactivated).
- Purge reuses `users.purgeUserData`.
- Limit emails fire from the sync adapter when count crosses 80% / 100% of cap
  (guarded by `limit80SentAt` / `limit100SentAt`; reset on plan change).
- `compTrial` internal mutation (dev/admin): grant a long trial / mark active.

## Emails (React Email, Mineral, white `#FBFAF7`) — ours only
`limit80`, `limit100`, `graceEnding`. (Polar sends trial + billing emails.)

## Frontend
- Signup gate: after auth, if not `trialing`/`active` → redirect to plan picker; block app.
- Plan picker route (Starter/Pro, monthly/annual, Pro highlighted) → checkout-with-trial.
- Global limit banner (80/100) + trial pill (days left, urgent ≤3d) + locked wall + wire
  the unused `Paywall` on video for non-Pro.
- `plans.ts`: `free` now means "no active sub / locked".

## Verify
convex dev --once · lint · typecheck · tests · trial checkout on Polar **sandbox** (dev) ·
cancel → grace → purge path · then PR.
