import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./betterAuth/auth";
import { polar } from "./billing/polar";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

// Map a Polar subscription webhook back to our Convex userId. The component links
// customers by externalId = userId and mirrors it into subscription metadata.
function subscriptionUserId(data: { metadata?: Record<string, unknown>; customer?: { externalId?: string | null } }) {
  const fromMeta = data.metadata?.userId;
  const id = typeof fromMeta === "string" ? fromMeta : data.customer?.externalId;
  return id ?? null;
}

// Polar webhooks (subscription.created/updated/canceled, product.created/updated, etc.)
// Configure the webhook URL in dash.polar.sh → Settings → Webhooks:
//   https://<your-deployment>.convex.site/polar/webhook
// The component syncs subscription status itself; our callbacks maintain the local
// `subscriptions` row (grace/purge clock + usage-email flags).
polar.registerRoutes(http, {
  path: "/polar/webhook",
  onSubscriptionCreated: async (ctx, event) => {
    const userId = subscriptionUserId(event.data);
    if (!userId) return;
    await ctx.runMutation(internal.billing.lifecycle.syncSubscription, {
      userId,
      status: event.data.status,
      customerId: event.data.customerId,
      subscriptionId: event.data.id,
      endedAt: event.data.endedAt ? event.data.endedAt.getTime() : null,
    });
  },
  onSubscriptionUpdated: async (ctx, event) => {
    const userId = subscriptionUserId(event.data);
    if (!userId) return;
    await ctx.runMutation(internal.billing.lifecycle.syncSubscription, {
      userId,
      status: event.data.status,
      customerId: event.data.customerId,
      subscriptionId: event.data.id,
      endedAt: event.data.endedAt ? event.data.endedAt.getTime() : null,
    });
  },
});

export default http;
