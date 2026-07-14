import { createFileRoute, redirect } from "@tanstack/react-router";

import { AuthForm } from "@/components/auth/auth-form";
import { WAITLIST_ENABLED } from "@/lib/waitlist";

export const Route = createFileRoute("/_auth/signup")({
  beforeLoad: () => {
    if (WAITLIST_ENABLED) throw redirect({ to: "/waitlist" });
  },
  component: SignupPage,
});

function SignupPage() {
  return <AuthForm mode="signup" />;
}
