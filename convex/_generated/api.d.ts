/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as billing_gating from "../billing/gating.js";
import type * as billing_index from "../billing/index.js";
import type * as billing_lifecycle from "../billing/lifecycle.js";
import type * as billing_limits from "../billing/limits.js";
import type * as billing_polar from "../billing/polar.js";
import type * as billing_queries from "../billing/queries.js";
import type * as billing_stripe from "../billing/stripe.js";
import type * as billing_subscriptions from "../billing/subscriptions.js";
import type * as billing_types from "../billing/types.js";
import type * as crons from "../crons.js";
import type * as email_send from "../email/send.js";
import type * as email_templates__components from "../email/templates/_components.js";
import type * as email_templates__layout from "../email/templates/_layout.js";
import type * as email_templates_accountDeleted from "../email/templates/accountDeleted.js";
import type * as email_templates_changeEmail from "../email/templates/changeEmail.js";
import type * as email_templates_deleteAccount from "../email/templates/deleteAccount.js";
import type * as email_templates_graceEnding from "../email/templates/graceEnding.js";
import type * as email_templates_limitApproaching from "../email/templates/limitApproaching.js";
import type * as email_templates_limitReached from "../email/templates/limitReached.js";
import type * as email_templates_magicLink from "../email/templates/magicLink.js";
import type * as email_templates_resetPassword from "../email/templates/resetPassword.js";
import type * as email_templates_verify from "../email/templates/verify.js";
import type * as email_templates_weeklyDigest from "../email/templates/weeklyDigest.js";
import type * as email_templates_welcome from "../email/templates/welcome.js";
import type * as embeddings_gemini from "../embeddings/gemini.js";
import type * as embeddings_pipeline from "../embeddings/pipeline.js";
import type * as http from "../http.js";
import type * as items from "../items.js";
import type * as lib_plans from "../lib/plans.js";
import type * as lib_webhook from "../lib/webhook.js";
import type * as rag from "../rag.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as search from "../search.js";
import type * as searchHydrate from "../searchHydrate.js";
import type * as storage from "../storage.js";
import type * as sync_adapters_x from "../sync/adapters/x.js";
import type * as sync_dispatcher from "../sync/dispatcher.js";
import type * as sync_registry from "../sync/registry.js";
import type * as sync_run from "../sync/run.js";
import type * as sync_state from "../sync/state.js";
import type * as sync_types from "../sync/types.js";
import type * as userPrefs from "../userPrefs.js";
import type * as users from "../users.js";
import type * as x from "../x.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "billing/gating": typeof billing_gating;
  "billing/index": typeof billing_index;
  "billing/lifecycle": typeof billing_lifecycle;
  "billing/limits": typeof billing_limits;
  "billing/polar": typeof billing_polar;
  "billing/queries": typeof billing_queries;
  "billing/stripe": typeof billing_stripe;
  "billing/subscriptions": typeof billing_subscriptions;
  "billing/types": typeof billing_types;
  crons: typeof crons;
  "email/send": typeof email_send;
  "email/templates/_components": typeof email_templates__components;
  "email/templates/_layout": typeof email_templates__layout;
  "email/templates/accountDeleted": typeof email_templates_accountDeleted;
  "email/templates/changeEmail": typeof email_templates_changeEmail;
  "email/templates/deleteAccount": typeof email_templates_deleteAccount;
  "email/templates/graceEnding": typeof email_templates_graceEnding;
  "email/templates/limitApproaching": typeof email_templates_limitApproaching;
  "email/templates/limitReached": typeof email_templates_limitReached;
  "email/templates/magicLink": typeof email_templates_magicLink;
  "email/templates/resetPassword": typeof email_templates_resetPassword;
  "email/templates/verify": typeof email_templates_verify;
  "email/templates/weeklyDigest": typeof email_templates_weeklyDigest;
  "email/templates/welcome": typeof email_templates_welcome;
  "embeddings/gemini": typeof embeddings_gemini;
  "embeddings/pipeline": typeof embeddings_pipeline;
  http: typeof http;
  items: typeof items;
  "lib/plans": typeof lib_plans;
  "lib/webhook": typeof lib_webhook;
  rag: typeof rag;
  rateLimiter: typeof rateLimiter;
  search: typeof search;
  searchHydrate: typeof searchHydrate;
  storage: typeof storage;
  "sync/adapters/x": typeof sync_adapters_x;
  "sync/dispatcher": typeof sync_dispatcher;
  "sync/registry": typeof sync_registry;
  "sync/run": typeof sync_run;
  "sync/state": typeof sync_state;
  "sync/types": typeof sync_types;
  userPrefs: typeof userPrefs;
  users: typeof users;
  x: typeof x;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  actionCache: import("@convex-dev/action-cache/_generated/component.js").ComponentApi<"actionCache">;
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  polar: import("@convex-dev/polar/_generated/component.js").ComponentApi<"polar">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
