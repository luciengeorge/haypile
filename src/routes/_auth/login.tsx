import { createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "@/components/auth/auth-form";

export const Route = createFileRoute("/_auth/login")({ component: LoginPage });

function LoginPage() {
  return <AuthForm mode="signin" />;
}
