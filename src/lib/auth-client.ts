import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { adminClient, genericOAuthClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// better-auth runs in Convex HTTP (*.convex.site), a different origin than the app.
// baseURL points the client at it; crossDomainClient handles the cross-origin
// session (custom cookie headers) so it works without same-site cookies.
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [convexClient(), crossDomainClient(), magicLinkClient(), adminClient(), genericOAuthClient()],
});
