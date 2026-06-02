import { v } from "convex/values";
import z from "zod";

import { internalMutation, internalQuery, query } from "./_generated/server";
import { authComponent, createAuthOptions } from "./betterAuth/auth";

// better-auth stores OAuth tokens plaintext (encryptOAuthTokens is off) in its
// `account` table. Background sync has no session, so we read/refresh the row
// directly by userId via the component adapter. accessTokenExpiresAt may come back
// as ms, an ISO string, or a Date depending on the adapter path — normalize to ms.
const accountSchema = z.object({
  accountId: z.string(), // the provider's user id (X numeric id) — used in API paths
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  accessTokenExpiresAt: z.union([z.number(), z.string(), z.date()]).nullish(),
});

function toMs(value: number | string | Date | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

// Provider IDs of OAuth data-source accounts linked to the current user (e.g. ["x"]).
// Used by the UI to show "Connected" before any sync job exists. Returns [] when
// unauthenticated rather than throwing, so it never crashes the page.
export const connectedSources = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) return [];
    const adapter = authComponent.adapter(ctx)(createAuthOptions(ctx));
    const accounts = await adapter.findMany({
      model: "account",
      where: [{ field: "userId", value: user._id }],
    });
    return z
      .array(z.object({ providerId: z.string() }))
      .parse(accounts)
      .map((account) => account.providerId);
  },
});

export const getProviderToken = internalQuery({
  args: { userId: v.string(), providerId: v.string() },
  handler: async (ctx, { userId, providerId }) => {
    const adapter = authComponent.adapter(ctx)(createAuthOptions(ctx));
    const account = await adapter.findOne({
      model: "account",
      where: [
        { field: "userId", value: userId },
        { field: "providerId", value: providerId },
      ],
    });
    if (!account) return null;
    const parsed = accountSchema.parse(account);
    return {
      accountId: parsed.accountId,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      expiresAt: toMs(parsed.accessTokenExpiresAt),
    };
  },
});

export const updateProviderToken = internalMutation({
  args: {
    userId: v.string(),
    providerId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { userId, providerId, accessToken, refreshToken, expiresAt }) => {
    const adapter = authComponent.adapter(ctx)(createAuthOptions(ctx));
    await adapter.update({
      model: "account",
      where: [
        { field: "userId", value: userId },
        { field: "providerId", value: providerId },
      ],
      update: { accessToken, refreshToken, accessTokenExpiresAt: new Date(expiresAt), updatedAt: new Date() },
    });
  },
});
