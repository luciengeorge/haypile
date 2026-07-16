import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { HaypileLockup } from "@/components/brand/haypile-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaitlistTeaserCard } from "@/components/waitlist/waitlist-teaser-card";
import { joinWaitlist } from "@/lib/functions/join-waitlist";

export function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await joinWaitlist({ data: { email: normalizedEmail, source: "waitlist" } });
      setSubmittedEmail(normalizedEmail);
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-background text-foreground">
      <header className="flex w-full items-center justify-between px-5 py-6 sm:px-8 lg:px-16 lg:py-8">
        <Link to="/" aria-label="Haypile home">
          <HaypileLockup size={40} className="gap-3" />
        </Link>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.75">
          <div className="size-1.5 shrink-0 rounded-full bg-primary" />
          <div className="text-xs/4 font-medium tracking-[0.12em] text-primary uppercase">Coming soon</div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[90rem] grow flex-col items-start gap-12 px-5 pb-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-20 lg:px-16 lg:pb-[3.75rem]">
        <section className="flex w-full max-w-[35rem] shrink-0 flex-col items-start">
          <div className="mb-7 flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
            <div className="size-1.5 shrink-0 rounded-full bg-gold" />
            <div className="text-xs/4 font-medium tracking-[0.12em] text-primary uppercase">
              {submitted ? "You're on the list" : "Private beta · opening in waves"}
            </div>
          </div>

          <div className="flex flex-col items-start">
            <h1 className="font-display text-5xl/13 font-semibold text-foreground sm:text-6xl/15 lg:text-[66px]/16">
              {submitted ? "Your spot is" : "The waitlist"}
            </h1>
            <p className="font-display text-5xl/14 font-semibold text-foreground italic sm:text-6xl/16 lg:text-[66px]/17.5">
              {submitted ? "saved." : "is open."}
            </p>
          </div>

          <p className="mt-6 max-w-[30rem] text-lg/7.25 text-muted-foreground">
            {submitted
              ? "Thanks for joining. We will email you at the address you gave us the moment your spot opens, usually within a couple of weeks. No need to check back, we will come to you."
              : "Haypile reads inside everything you save, the pixels in a screenshot, the moment in a video, the page behind a link. We are letting people in a few at a time. Add your email and we will save your spot."}
          </p>

          {submitted ? (
            <>
              <div className="mt-10 flex h-16 w-full max-w-[30rem] items-center gap-3.5 rounded-[15px] border border-primary/22 bg-primary/8 px-5">
                <div className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    aria-hidden="true"
                    className="size-4.5"
                  >
                    <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex min-w-0 grow basis-0 flex-col gap-0.5">
                  <div className="text-[15px]/4.5 font-semibold text-foreground">You are confirmed</div>
                  <div className="truncate text-sm/4.5 text-muted-foreground">{submittedEmail}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-10 flex w-full max-w-[30rem] flex-col gap-2">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <Input
                    id="waitlist-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={pending}
                    required
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "waitlist-error" : undefined}
                    className="h-14 grow rounded-[13px] border-foreground/14 bg-card px-4.5 text-base/5 shadow-none placeholder:text-muted-foreground/70 md:text-base"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={pending}
                    className="h-14 shrink-0 gap-2 rounded-[13px] px-6 text-base/5 font-semibold"
                  >
                    {pending ? "Joining..." : "Join the waitlist"}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                      data-icon="inline-end"
                    >
                      <path d="M8 16 16 8M9 8h7v7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                </form>
                {error ? (
                  <p id="waitlist-error" className="text-sm/5 text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className="size-3.75 text-muted-foreground"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <div className="text-sm/4.5 text-muted-foreground">
                  No spam. We will only email you when your spot is ready.
                </div>
              </div>
            </>
          )}
        </section>

        <div className="hidden lg:flex lg:min-w-0 lg:flex-1 lg:justify-end">
          <WaitlistTeaserCard />
        </div>
      </main>
    </div>
  );
}
