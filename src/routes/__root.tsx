import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { GlobalLoading } from "@/components/global-loading";
import { NotFound } from "@/components/marketing/not-found";
import { Toaster } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";
import { getToast } from "@/lib/functions/get-toast";

import ConvexProvider from "../integrations/convex/provider";
import { GoogleAnalyticsPageViews, GoogleAnalyticsScripts } from "../integrations/google-analytics/provider";
import PostHogProvider from "../integrations/posthog/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Haypile";
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";
const TITLE = APP_NAME;
const DESCRIPTION = "Find anything you ever saved — across every corner of the internet.";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const serverToast = await getToast();
    return { serverToast };
  },
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: "#2e7d6e" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: APP_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: SITE_URL },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootComponent() {
  const { serverToast } = Route.useRouteContext();
  useToast(serverToast);

  return <Outlet />;
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <GoogleAnalyticsScripts />
      </head>
      <body className="font-sans antialiased">
        <GlobalLoading />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalyticsPageViews />
        <ConvexProvider>
          <PostHogProvider>
            <TanStackQueryProvider>
              <Toaster closeButton richColors />
              <main className="isolate flex min-h-svh w-full flex-col">{children}</main>
              <TanStackDevtools
                config={{ position: "bottom-right" }}
                plugins={[
                  {
                    name: "Tanstack Router",
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                  TanStackQueryDevtools,
                ]}
              />
            </TanStackQueryProvider>
          </PostHogProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  );
}
