import type { BetterAuthOptions } from "better-auth";

export const APP_NAME = process.env.APP_NAME ?? "Haypile";

/**
 * Base auth options — runtime-agnostic config that applies to both server-side
 * server-functions and the Convex better-auth handler.
 *
 * Email handlers (sendVerificationEmail, sendResetPassword, magic link) live in
 * `convex/betterAuth/auth.ts` where `ctx` is available — they delegate to the
 * Node-runtime email action via `ctx.scheduler.runAfter(0, internal.email...)`.
 */
export const sharedAuthConfig = {
  appName: APP_NAME,
  get baseURL() {
    return process.env.SITE_URL || "http://localhost:3000";
  },
  get secret() {
    return process.env.BETTER_AUTH_SECRET;
  },
  // The app runs on a different origin than the Convex-hosted auth handler, so the
  // app origin must be trusted for CORS + OAuth redirect validation.
  get trustedOrigins() {
    return [process.env.SITE_URL || "http://localhost:3000"];
  },
  // Passwordless: sign-in is magic link + "Continue with X". No password flows.
  emailAndPassword: {
    enabled: false,
  },
  emailVerification: {
    sendVerificationEmail: async () => {
      // Overridden in convex/betterAuth/auth.ts where ctx is available.
      throw new Error("sendVerificationEmail must be overridden with a ctx-aware impl");
    },
  },
} satisfies Partial<BetterAuthOptions>;
