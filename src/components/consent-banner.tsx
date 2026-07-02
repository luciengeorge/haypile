import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { setConsent, useConsent } from "@/lib/consent";

/** Cookie-consent prompt. Shown in production until the user accepts or declines analytics cookies. */
export function ConsentBanner() {
  const consent = useConsent();
  if (!import.meta.env.PROD || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4"
    >
      <div className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl border bg-card p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm text-muted-foreground">
          We use analytics cookies to understand how Haypile is used. See our{" "}
          <Link to="/cookies" className="font-medium text-foreground underline underline-offset-2">
            cookie policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConsent("denied")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => setConsent("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
