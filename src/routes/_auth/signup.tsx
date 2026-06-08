import { createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "@/components/auth/auth-form";

export const Route = createFileRoute("/_auth/signup")({ component: SignupPage });

function SignupPage() {
  return <AuthForm mode="signup" />;
}
