import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { authComponent } from "../betterAuth/auth";
import { type PlanId, PLANS } from "../lib/plans";

const APPROACHING = 0.8;

/**
 * Nudge users toward Pro as they approach (80%) then hit (100%) their plan's item cap.
 * Called once per sync batch (not per item) so a plan lookup + email stays off the hot
 * path. De-duped via the subscriptions row: each threshold emails at most once. Pro has
 * no upgrade target, so it's skipped there.
 */
export async function checkItemLimit(
  ctx: MutationCtx,
  userId: string,
  count: number,
  cap: number,
  plan: PlanId,
): Promise<void> {
  if (plan === "pro" || cap <= 0 || count / cap < APPROACHING) return;

  const record = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  const reached = count >= cap;
  if (reached ? record?.limit100SentAt : record?.limit80SentAt) return;

  const user = await authComponent.getAnyUserById(ctx, userId);
  if (!user?.email) return;

  const planName = PLANS[plan].name;
  const now = Date.now();

  if (reached) {
    await ctx.scheduler.runAfter(0, internal.email.send.sendEmail, {
      to: user.email,
      subject: "You've reached your limit",
      template: "limitReached",
      props: { name: user.name ?? undefined, planName, cap },
    });
  } else {
    await ctx.scheduler.runAfter(0, internal.email.send.sendEmail, {
      to: user.email,
      subject: "You're close to your limit",
      template: "limitApproaching",
      props: { name: user.name ?? undefined, planName, itemCount: count, cap },
    });
  }

  // Reaching the cap backfills the 80% flag so the "approaching" email can't fire later.
  const flags = reached ? { limit100SentAt: now, limit80SentAt: record?.limit80SentAt ?? now } : { limit80SentAt: now };
  if (record) {
    await ctx.db.patch(record._id, flags);
  } else {
    await ctx.db.insert("subscriptions", { userId, ...flags });
  }
}
