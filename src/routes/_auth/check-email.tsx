import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/check-email")({
  validateSearch: z.object({ email: z.string().optional() }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const { email } = Route.useSearch();
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const result = await authClient.signIn.magicLink({ email, callbackURL: "/app" });
      if (result.error) throw new Error(result.error.message);
      setSent(true);
    } catch (error) {
      toast.error("Couldn't resend the link", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailIcon />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="text-muted-foreground">
            We sent a sign-in link
            {email ? (
              <>
                {" "}
                to <span className="font-medium text-foreground">{email}</span>
              </>
            ) : null}
            . It expires in a few minutes and works once.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {email ? (
          <Button variant="outline" onClick={resend} disabled={resending || sent}>
            {resending ? <Spinner /> : null}
            {sent ? "Link sent again" : "Resend link"}
          </Button>
        ) : null}
        <Button variant="ghost" nativeButton={false} render={<Link to="/login" />}>
          Back to sign in
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Wrong address or no email after a minute? Check spam, or head back and try again.
      </p>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
