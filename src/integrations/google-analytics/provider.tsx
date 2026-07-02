import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { useConsent } from "@/lib/consent";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const isProduction = import.meta.env.PROD;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const initScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());`;

/**
 * Loads Google Analytics only after the user grants cookie consent (UK/EU PECR).
 * gtag can't be SSR-injected because consent is a client-side decision, so we inject
 * the tag on the client once consent is "granted", then send a pageview per route.
 */
export function GoogleAnalytics() {
  const consent = useConsent();
  const router = useRouter();
  const loaded = useRef(false);

  useEffect(() => {
    if (!isProduction || !GA_MEASUREMENT_ID || consent !== "granted") return;

    if (!loaded.current) {
      const tag = document.createElement("script");
      tag.async = true;
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(tag);

      const init = document.createElement("script");
      init.textContent = initScript;
      document.head.appendChild(init);
      loaded.current = true;
    }

    const sendPageView = () => {
      if (typeof window.gtag !== "function") return;
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title,
      });
    };

    sendPageView();
    return router.subscribe("onResolved", sendPageView);
  }, [consent, router]);

  return null;
}
