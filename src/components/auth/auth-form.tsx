import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { AnalyticsEvent, useAnalytics } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";
import { MagicLinkFormSchema } from "@/lib/schemas/auth";

const CALLBACK_URL = "/app";

type Mode = "signin" | "signup";

const COPY: Record<
  Mode,
  { title: string; subtitle: string; altText: string; altLabel: string; altTo: "/login" | "/signup" }
> = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to your Haypile.",
    altText: "New to Haypile?",
    altLabel: "Create an account",
    altTo: "/signup",
  },
  signup: {
    title: "Start your Haypile",
    subtitle: "Everything you've saved, finally findable.",
    altText: "Already have an account?",
    altLabel: "Sign in",
    altTo: "/login",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const navigate = useNavigate();
  const { capture } = useAnalytics();
  const [xLoading, setXLoading] = useState(false);

  const continueWithX = async () => {
    setXLoading(true);
    capture(AnalyticsEvent.userLoginSubmitted, { login_method: "x" });
    try {
      await authClient.signIn.oauth2({ providerId: "x", callbackURL: CALLBACK_URL });
    } catch (error) {
      capture(AnalyticsEvent.userLoginFailed, {
        login_method: "x",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Couldn't continue with X", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setXLoading(false);
    }
  };

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: MagicLinkFormSchema,
      onSubmitAsync: async ({ value: { email } }) => {
        capture(AnalyticsEvent.userLoginSubmitted, { login_method: "magic_link" });
        try {
          const result = await authClient.signIn.magicLink({ email, callbackURL: CALLBACK_URL });
          if (result.error) {
            capture(AnalyticsEvent.userLoginFailed, {
              login_method: "magic_link",
              error_message: result.error.message,
            });
            return { form: result.error.message };
          }
        } catch (error) {
          return { form: error instanceof Error ? error.message : "Unknown error" };
        }
        navigate({ to: "/check-email", search: { email } });
      },
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.subtitle}</p>
      </header>

      <Button
        type="button"
        onClick={continueWithX}
        disabled={xLoading}
        className="w-full bg-foreground text-background hover:bg-foreground/90"
      >
        {xLoading ? <Spinner /> : <XIcon />}
        Continue with X
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs whitespace-nowrap text-muted-foreground">or with email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={onSubmit}>
        <FieldGroup>
          <form.Field name="email">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                />
                {field.state.meta.isValid ? null : <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          </form.Field>
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
              errorMap: state.errorMap,
            })}
          >
            {({ canSubmit, isSubmitting, errorMap }) => (
              <Field>
                <Button type="submit" variant="outline" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? "Sending link" : "Send magic link"}
                </Button>
                {errorMap.onSubmit?.form ? <FieldError>{String(errorMap.onSubmit.form)}</FieldError> : null}
              </Field>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {copy.altText}{" "}
        <Link to={copy.altTo} className="font-medium text-foreground underline-offset-4 hover:underline">
          {copy.altLabel}
        </Link>
      </p>
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" data-icon="inline-start" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
