import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AnalyticsEvent, useAnalytics } from "@/lib/analytics";
import { authClient } from "@/lib/auth-client";

/** Sign out: capture analytics, clear the session, toast, and return home. */
export function useSignOut(): () => Promise<void> {
  const navigate = useNavigate();
  const { capture } = useAnalytics();

  return async () => {
    capture(AnalyticsEvent.userLogoutStarted);
    try {
      await authClient.signOut();
      capture(AnalyticsEvent.userLoggedOut);
      toast.success("Signed out");
      navigate({ to: "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      capture(AnalyticsEvent.userLogoutFailed, { error_message: message });
      toast.error("Sign out failed", { description: message });
    }
  };
}
