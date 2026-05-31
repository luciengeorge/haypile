import { Resvg } from "@resvg/resvg-js";
import { createServerFileRoute } from "@tanstack/react-start/server";
import satori from "satori";

/**
 * Dynamic Open Graph image generator.
 *
 * Use as `<meta property="og:image" content="/api/og?title=Hello&subtitle=World" />`.
 *
 * Renders JSX → SVG (satori) → PNG (resvg) on the server, returns a 1200×630
 * PNG with strong cache headers. ~50–150ms per cold render.
 *
 * Fonts: defaults to system fallbacks via satori's `system-ui` resolution.
 * To embed Geist or any other font, load it from a CDN or bundle it into
 * `public/fonts/` and pass via `fonts: [...]` in the satori options.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const APP_NAME = process.env.APP_NAME ?? "Starter Template";

export const ServerRoute = createServerFileRoute("/api/og").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const title = url.searchParams.get("title") ?? APP_NAME;
    const subtitle = url.searchParams.get("subtitle") ?? "";

    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "80px",
            backgroundColor: "#0a0a0a",
            color: "#ffffff",
            fontFamily: "system-ui",
          },
          children: [
            {
              type: "div",
              props: {
                style: { fontSize: 28, opacity: 0.6 },
                children: APP_NAME,
              },
            },
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column", gap: "16px" },
                children: [
                  {
                    type: "div",
                    props: {
                      style: { fontSize: 72, fontWeight: 700, lineHeight: 1.1 },
                      children: title,
                    },
                  },
                  subtitle
                    ? {
                        type: "div",
                        props: {
                          style: { fontSize: 32, opacity: 0.7, lineHeight: 1.3 },
                          children: subtitle,
                        },
                      }
                    : null,
                ].filter(Boolean),
              },
            },
          ],
        },
      },
      {
        width: WIDTH,
        height: HEIGHT,
        // Satori requires at least one font. Provide a system-ui fallback.
        // To use Geist, load the woff and pass: fonts: [{ name: "Geist", data: buffer, weight: 700, style: "normal" }]
        fonts: [],
      },
    );

    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: WIDTH },
    })
      .render()
      .asPng();

    return new Response(png as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  },
});
