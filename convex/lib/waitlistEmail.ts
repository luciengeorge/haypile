import { z } from "zod";

const EmailSchema = z.string().trim().toLowerCase().email();

/**
 * Validate + normalize a waitlist email (trim + lowercase). Returns the normalized address,
 * or null when it isn't a valid email. Pure so it can be unit-tested without the Convex runtime.
 */
export function parseWaitlistEmail(input: string): string | null {
  const parsed = EmailSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
