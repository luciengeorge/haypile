import { defineNitroConfig } from "nitro/config";

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://vercel.live https://challenges.cloudflare.com",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live https://eu-assets.i.posthog.com https://us-assets.i.posthog.com https://www.googletagmanager.com https://challenges.cloudflare.com",
    "connect-src 'self' https: wss:",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data: https:",
    "upgrade-insecure-requests",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), browsing-topics=(), interest-cohort=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// Public brand/share assets are fetched cross-origin (OG scrapers, favicon services,
// PWA installers), so they need Cross-Origin-Resource-Policy: cross-origin. The global
// "same-origin" default otherwise blocks them (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin).
const publicAssetHeaders = { ...securityHeaders, "Cross-Origin-Resource-Policy": "cross-origin" };

export default defineNitroConfig({
  routeRules: {
    "/**": {
      headers: securityHeaders,
    },
    "/api/**": {
      headers: {
        "Cache-Control": "no-store",
        ...securityHeaders,
      },
    },
    "/og-image.png": { headers: publicAssetHeaders },
    "/favicon.ico": { headers: publicAssetHeaders },
    "/favicon.svg": { headers: publicAssetHeaders },
    "/apple-touch-icon.png": { headers: publicAssetHeaders },
    "/icon-192.png": { headers: publicAssetHeaders },
    "/icon-512.png": { headers: publicAssetHeaders },
    "/manifest.json": { headers: publicAssetHeaders },
  },
});
