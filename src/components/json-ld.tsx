/**
 * Renders a JSON-LD structured-data block. Server-rendered into the page HTML, so
 * crawlers pick it up for rich results.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
