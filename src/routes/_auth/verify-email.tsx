import type { ReactNode } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import z from "zod";

import { Button } from "@/components/ui/button";

const VerifySearchSchema = z.object({
  status: z.enum(["pending", "success", "error"]).default("pending"),
  error: z.string().optional(),
});

export const Route = createFileRoute("/_auth/verify-email")({
  validateSearch: VerifySearchSchema,
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { status, error } = Route.useSearch();

  if (status === "success") {
    return (
      <Shell tone="primary" icon={<CheckIcon />} title="Email verified" body="You're all set. Sign in to continue.">
        <Button nativeButton={false} render={<Link to="/login" />}>
          Continue to sign in
        </Button>
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell
        tone="destructive"
        icon={<AlertIcon />}
        title="Verification failed"
        body={`${error ?? "This verification link is invalid or expired."} Request a new link from the sign-in page.`}
      >
        <Button nativeButton={false} render={<Link to="/signup" />}>
          Create an account
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link to="/login" />}>
          Sign in
        </Button>
      </Shell>
    );
  }

  return (
    <Shell
      tone="primary"
      icon={<MailIcon />}
      title="Check your inbox"
      body="We sent a verification link to your email. Click it to continue — it expires in an hour."
    >
      <Button variant="outline" nativeButton={false} render={<Link to="/login" />}>
        Back to sign in
      </Button>
    </Shell>
  );
}

function Shell({
  tone,
  icon,
  title,
  body,
  children,
}: {
  tone: "primary" | "destructive";
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <span
          className={
            tone === "primary"
              ? "flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              : "flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
          }
        >
          {icon}
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{body}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6" aria-hidden="true">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
