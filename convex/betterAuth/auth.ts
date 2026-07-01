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

// X (Twitter) /2/users/me. With the users.email scope we request confirmed_email
// (X-verified) + profile_image_url via user.fields. Powers both "Continue with X"
// sign-in (real email + avatar) and linking X as a data source to an existing account.
const xUserInfoSchema = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    confirmed_email: z.string().optional(),
    profile_image_url: z.string().optional(),
  }),
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
        scopes: ["tweet.read", "users.read", "users.email", "bookmark.read", "offline.access"],
      pkce: true,
      authentication: "basic" as const,
        getUserInfo: async (tokens: { accessToken?: string }) => {
          const res = await fetch(
            "https://api.x.com/2/users/me?user.fields=confirmed_email,profile_image_url",
            { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
          );
          if (!res.ok) throw new Error(`X userinfo failed: ${res.status}`);
          const { data } = xUserInfoSchema.parse(await res.json());
          // confirmed_email is X-verified. Synthetic fallback only for the rare account
          // without one — magic-link can attach a real address later.
          const email = data.confirmed_email ?? `${data.username}@users.x.invalid`;
          return {
            id: data.id,
            name: data.name,
            email,
            emailVerified: Boolean(data.confirmed_email),
            image: data.profile_image_url?.replace("_normal", "_400x400"),
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
      // allowDifferentEmails: X is a data source, not an identity — its (synthetic)
      // email won't match the user's, so linking must not require an email match.
      accountLinking: { enabled: true, trustedProviders: ["x"], allowDifferentEmails: true },
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
          const scheduler = getScheduler(ctx);
          await scheduler.runAfter(0, internal.email.send.sendEmail, {
            to: user.email,
            subject: `Your ${APP_NAME} account has been deleted`,
            template: "accountDeleted",
            props: { appName: APP_NAME },
          });
          // Auth tables are removed by better-auth; purge app-owned data separately.
          await scheduler.runAfter(0, internal.users.purgeUserData, { userId: user.id });
        },
      },
    },
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

// For the `@better-auth/cli` schema generator: it only introspects static options
// (adapter + plugins), never executes a request, so there's no real ctx to pass.
// This is the one framework-prescribed cast. Regenerate after changing plugins:
//   npx @better-auth/cli generate --output ./convex/betterAuth/schema.ts -y
// oxlint-disable-next-line typescript/consistent-type-assertions
export const options = createAuthOptions({} as GenericCtx<DataModel>);
