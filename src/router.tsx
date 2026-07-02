import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { ErrorScreen } from "./components/error-screen";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

// Client-side Sentry (the server initialises via instrument.server.mjs). Guarded to
// the browser so it never double-inits on the server.
if (typeof window !== "undefined" && import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    sendDefaultPii: true,
    tracesSampleRate: 0.1,
  });
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: getContext(),
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ErrorScreen,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
