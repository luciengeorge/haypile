import * as Sentry from "@sentry/tanstackstart-react";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { getEntitlement } from "../billing/gating";
import { rateLimiter } from "../rateLimiter";
import { getAdapter } from "./registry";
import { defaultIntervalMs } from "./state";

const MAX_PAGES_PER_RUN = 10;
// Locked-out users are re-checked slowly instead of every dispatcher tick, so sync
// resumes on its own within a few hours of reactivation without hot-looping meanwhile.
const LAPSED_RECHECK_MS = 6 * 60 * 60 * 1000;

/**
 * Run one sync job to completion (or until the page cap is hit).
 *
 * Fetched by the dispatcher every 5 minutes. Each job is scheduled in its own
 * `ctx.scheduler.runAfter(0, ...)` so a failure here doesn't cascade to others.
 *
 * Per-run loop:
 *   1. Check rate limit. If limited, reschedule for `retryAfter` and exit.
 *   2. Call adapter.sync() to fetch one page.
 *   3. Call internal.sync.state.persistPage to write items + cursor atomically.
 *   4. Repeat up to MAX_PAGES_PER_RUN times or until hasMore=false.
 *   5. Mark success (resets attempts, sets nextRunAt = now + intervalMs).
 *
 * Failures bubble out as `markFailed` (exponential backoff).
 */
export const runJob = internalAction({
  args: { jobId: v.id("syncJobs") },
  handler: async (ctx, { jobId }) => {
    return await Sentry.startSpan({ name: "sync.runJob" }, async () => {
      const job = await ctx.runQuery(internal.sync.state.getJob, { jobId });
      if (!job || job.status !== "running") return;

      // No active subscription (lapsed/canceled) → stop ingesting new items until
      // the user reactivates. Cursor is preserved, so sync picks up where it left off.
      const entitlement = await getEntitlement(ctx, job.userId);
      if (!entitlement.hasAccess) {
        await ctx.runMutation(internal.sync.state.markSuccess, { jobId, intervalMs: LAPSED_RECHECK_MS });
        return;
      }

      let adapter;
      try {
        adapter = getAdapter(job.source);
      } catch (error) {
        await ctx.runMutation(internal.sync.state.markFailed, {
          jobId,
          error: error instanceof Error ? error.message : "Unknown adapter",
        });
        return;
      }

      // Per-user rate limit so one user can't hammer all of our API budgets.
      const limit = await rateLimiter.limit(ctx, "syncSource", { key: job.userId });
      if (!limit.ok) {
        await ctx.runMutation(internal.sync.state.markFailed, {
          jobId,
          error: `Rate limited, retry in ${Math.ceil((limit.retryAfter ?? 60_000) / 1000)}s`,
        });
        return;
      }

      try {
        let cursor = job.cursor;
        let hasMore = true;

        for (let i = 0; i < MAX_PAGES_PER_RUN && hasMore; i++) {
          const page = await adapter.sync(ctx, { userId: job.userId, cursor });

          await ctx.runMutation(internal.sync.state.persistPage, {
            jobId,
            source: job.source,
            userId: job.userId,
            items: page.items,
            nextCursor: page.nextCursor,
          });

          cursor = page.nextCursor;
          hasMore = page.hasMore;
        }

        await ctx.runMutation(internal.sync.state.markSuccess, {
          jobId,
          // If still has more pages, run again shortly to catch up. Otherwise wait full interval.
          intervalMs: hasMore ? 5_000 : (adapter.intervalMs ?? defaultIntervalMs),
        });
      } catch (error) {
        await ctx.runMutation(internal.sync.state.markFailed, {
          jobId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  },
});
