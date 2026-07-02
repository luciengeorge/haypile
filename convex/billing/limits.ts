import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import { authComponent } from "../betterAuth/auth";
import { type PlanId, PLANS } from "../lib/plans";
import { APPROACHING, decideLimitEmail } from "./logic";

/**
 * Nudge users toward Pro as they approach (80%) then hit (100%) their plan's item cap.
 * Called once per sync batch (not per item) so a plan lookup + email stays off the hot
 * path. De-duped via the subscriptions row: each threshold emails at most once. Pro has
 * no upgrade target, so it's skipped there. The which-email/which-flags decision lives
 * in `decideLimitEmail` (pure, tested); here we do the DB + email IO.
 */
export async function checkItemLimit(
  ctx: MutationCtx,
  userId: string,
  count: number,
  cap: number,
  plan: PlanId,
): Promise<void> {
  // Cheap early-exit before touching the DB; decideLimitEmail re-checks authoritatively.
  if (plan === "pro" || cap <= 0 || count / cap < APPROACHING) return;

  const record = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  const decision = decideLimitEmail(
    count,
    cap,
    plan,
    { limit80SentAt: record?.limit80SentAt, limit100SentAt: record?.limit100SentAt },
    Date.now(),
  );
  if (!decision.email) return;

  const user = await authComponent.getAnyUserById(ctx, userId);
  if (!user?.email) return;

  const planName = PLANS[plan].name;
  if (decision.email === "limitReached") {
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

  if (record) {
    await ctx.db.patch(record._id, decision.flags);
  } else {
    await ctx.db.insert("subscriptions", { userId, ...decision.flags });
  }
}
