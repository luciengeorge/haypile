import { createFileRoute, redirect } from "@tanstack/react-router";

import { AuthForm } from "@/components/auth/auth-form";
import { WAITLIST_BYPASS_KEY, WAITLIST_ENABLED } from "@/lib/waitlist";

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (search: Record<string, unknown>): { key?: string } => ({
    key: typeof search.key === "string" ? search.key : undefined,
  }),
  // Waitlist: keep /login out of public view. Only redirect when a bypass key is configured and
  // the visitor's ?key doesn't match; new-account creation is blocked server-side regardless.
  beforeLoad: ({ search }) => {
    if (WAITLIST_ENABLED && WAITLIST_BYPASS_KEY && search.key !== WAITLIST_BYPASS_KEY) {
      throw redirect({ to: "/waitlist" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return <AuthForm mode="signin" />;
}
