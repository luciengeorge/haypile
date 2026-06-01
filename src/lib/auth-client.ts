import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { adminClient, genericOAuthClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// better-auth runs in Convex HTTP (*.convex.site), not the app origin — so the
// client needs an absolute baseURL or SSR/server calls hit a relative URL and fail.
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [convexClient(), magicLinkClient(), adminClient(), genericOAuthClient()],
});
