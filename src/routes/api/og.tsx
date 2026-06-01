import { Resvg } from "@resvg/resvg-js";
import { createFileRoute } from "@tanstack/react-router";
import satori from "satori";

/**
 * Dynamic Open Graph image generator.
 *
 * Use as `<meta property="og:image" content="/api/og?title=Hello&subtitle=World" />`.
 *
 * Renders JSX → SVG (satori) → PNG (resvg) on the server, returns a 1200×630
 * PNG with strong cache headers. ~50–150ms per cold render.
 *
 * Fonts: satori requires at least one font at runtime. Load Geist (or any font)
 * from `public/fonts/` and pass via `fonts: [...]` in the satori options.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const APP_NAME = process.env.APP_NAME ?? "Starter Template";

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const title = url.searchParams.get("title") ?? APP_NAME;
        const subtitle = url.searchParams.get("subtitle") ?? "";

        const svg = await satori(
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "80px",
              backgroundColor: "#0a0a0a",
              color: "#ffffff",
              fontFamily: "system-ui",
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.6 }}>{APP_NAME}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
              {subtitle ? <div style={{ fontSize: 32, opacity: 0.7, lineHeight: 1.3 }}>{subtitle}</div> : null}
            </div>
          </div>,
          { width: WIDTH, height: HEIGHT, fonts: [] },
        );

        const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng();

        return new Response(new Uint8Array(png), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
