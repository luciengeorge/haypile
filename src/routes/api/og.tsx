import { Resvg } from "@resvg/resvg-js";
import { createFileRoute } from "@tanstack/react-router";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";

/**
 * Dynamic Open Graph image generator.
 *
 * Use as `<meta property="og:image" content="/api/og?title=Hello&subtitle=World" />`.
 *
 * Renders JSX → SVG (satori) → PNG (resvg) on the server, returns a 1200×630
 * PNG with strong cache headers. ~50–150ms per cold render.
 *
 * Fonts: satori needs ttf/otf/woff (NOT woff2). Static Geist woff lives in
 * `public/fonts/`. Read once at module load. NOTE: relies on `public/` shipping
 * with the server bundle at runtime cwd — verify on your deploy target.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const APP_NAME = process.env.APP_NAME ?? "Starter Template";

const FONT_DIR = join(process.cwd(), "public/fonts");
const geistRegular = readFileSync(join(FONT_DIR, "geist-400.woff"));
const geistSemibold = readFileSync(join(FONT_DIR, "geist-600.woff"));

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
              fontFamily: "Geist",
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.6 }}>{APP_NAME}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.1 }}>{title}</div>
              {subtitle ? <div style={{ fontSize: 32, opacity: 0.7, lineHeight: 1.3 }}>{subtitle}</div> : null}
            </div>
          </div>,
          {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
              { name: "Geist", data: geistRegular, weight: 400, style: "normal" },
              { name: "Geist", data: geistSemibold, weight: 600, style: "normal" },
            ],
          },
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
