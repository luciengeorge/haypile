import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { admin, genericOAuth, magicLink } from "better-auth/plugins";
import z from "zod";

function parseAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

import type { DataModel } from "../_generated/dataModel";

import { APP_NAME, sharedAuthConfig } from "../../src/lib/auth-config";
import { components, internal } from "../_generated/api";
import authConfig from "../auth.config";
import schema from "./schema";

export const authComponent = createClient<DataModel, typeof schema>(components.betterAuth, {
  local: { schema },
  verbose: false,
});

// Resolves the scheduler at call time. Email callbacks only run during auth
// mutations/actions (which have a scheduler); the `in` guard narrows the
// query|mutation|action union without a cast.
function getScheduler(ctx: GenericCtx<DataModel>) {
  if (!("scheduler" in ctx)) throw new Error("scheduler unavailable in this context");
  return ctx.scheduler;
}

// X (Twitter) has no standard userinfo; /2/users/me returns { data: { id, name, username } }
// with no email. We're *linking* X to an already-authenticated user, so email isn't used
// to match/create a user — we synthesize a stable placeholder to satisfy the user shape.
const xUserInfoSchema = z.object({
  data: z.object({ id: z.string(), name: z.string(), username: z.string() }),
});

// Data-source OAuth connections (X bookmarks, etc.) via better-auth genericOAuth.
// Tokens land in the `account` table; background sync reads them by userId (see convex/x.ts).
function buildGenericOAuthConfig() {
  const config = [];
  if (process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET) {
    config.push({
      providerId: "x",
      clientId: process.env.X_CLIENT_ID,
      clientSecret: process.env.X_CLIENT_SECRET,
      authorizationUrl: "https://x.com/i/oauth2/authorize",
      tokenUrl: "https://api.x.com/2/oauth2/token",
      userInfoUrl: "https://api.x.com/2/users/me",
      scopes: ["tweet.read", "users.read", "bookmark.read", "offline.access"],
      pkce: true,
      authentication: "basic" as const,
      getUserInfo: async (tokens: { accessToken?: string }) => {
        const res = await fetch("https://api.x.com/2/users/me", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (!res.ok) throw new Error(`X userinfo failed: ${res.status}`);
        const { data } = xUserInfoSchema.parse(await res.json());
        return {
          id: data.id,
          name: data.name,
          email: `${data.username}@users.x.invalid`,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    });
  }
  return config;
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    ...sharedAuthConfig,
    database: authComponent.adapter(ctx),
    socialProviders: {
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      // Apple stubbed for V2 — uncomment + add APPLE_* env vars to enable.
      // ...(process.env.APPLE_CLIENT_ID
      //   ? {
      //       apple: {
      //         clientId: process.env.APPLE_CLIENT_ID,
      //         clientSecret: process.env.APPLE_CLIENT_SECRET!,
      //         appBundleIdentifier: process.env.APPLE_BUNDLE_ID,
      //       },
      //     }
      //   : {}),
    },
    plugins: [
      convex({ authConfig }),
      magicLink({
        async sendMagicLink({ email, url }) {
          await getScheduler(ctx).runAfter(0, internal.email.send.sendEmail, {
            to: email,
            subject: `Your sign-in link for ${APP_NAME}`,
            template: "magicLink",
            props: { url, appName: APP_NAME },
          });
        },
      }),
      admin({
        adminUserIds: parseAdminUserIds(),
        impersonationSessionDuration: 60 * 60, // 1 hour
      }),
      genericOAuth({ config: buildGenericOAuthConfig() }),
    ],
    account: {
      // Lets an authenticated user attach data-source OAuth accounts (X, etc.).
      accountLinking: { enabled: true, trustedProviders: ["x"] },
    },
    emailAndPassword: {
      ...sharedAuthConfig.emailAndPassword,
      sendResetPassword: async ({ user, url }) => {
        await getScheduler(ctx).runAfter(0, internal.email.send.sendEmail, {
          to: user.email,
          subject: `Reset your ${APP_NAME} password`,
          template: "resetPassword",
          props: { url, appName: APP_NAME },
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await getScheduler(ctx).runAfter(0, internal.email.send.sendEmail, {
          to: user.email,
          subject: `Verify your email for ${APP_NAME}`,
          template: "verify",
          props: { url, appName: APP_NAME },
        });
      },
    },
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
          await getScheduler(ctx).runAfter(0, internal.email.send.sendEmail, {
            to: user.email,
            subject: `Confirm your ${APP_NAME} email change`,
            template: "changeEmail",
            props: { url, newEmail, appName: APP_NAME },
          });
        },
      },
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: async ({ user, url }) => {
          await getScheduler(ctx).runAfter(0, internal.email.send.sendEmail, {
            to: user.email,
            subject: `Confirm deletion of your ${APP_NAME} account`,
            template: "deleteAccount",
            props: { url, appName: APP_NAME },
          });
        },
        afterDelete: async (user) => {
          await getScheduler(ctx).runAfter(0, internal.email.send.sendEmail, {
            to: user.email,
            subject: `Your ${APP_NAME} account has been deleted`,
            template: "accountDeleted",
            props: { appName: APP_NAME },
          });
        },
      },
    },
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

// To regenerate the better-auth schema, temporarily add an `options` export the
// CLI can read, then run: npx @better-auth/cli generate --output ./convex/betterAuth/schema.ts
