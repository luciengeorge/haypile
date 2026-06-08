export type SourceId = "x" | "github" | "youtube" | "pinterest" | "reddit" | "chrome";

export type SourceMeta = { id: SourceId; label: string };

// Launch set. Only "x" is wired today; the rest scaffold the source filters + UI.
export const SOURCES: SourceMeta[] = [
  { id: "x", label: "X" },
  { id: "github", label: "GitHub" },
  { id: "youtube", label: "YouTube" },
  { id: "pinterest", label: "Pinterest" },
  { id: "reddit", label: "Reddit" },
  { id: "chrome", label: "Chrome" },
];

export function sourceLabel(id: string): string {
  return SOURCES.find((source) => source.id === id)?.label ?? id;
}

export function filterBySource<T extends { source: string }>(items: T[], source: string): T[] {
  if (source === "all") return items;
  return items.filter((item) => item.source === source);
}

// Distinct sources present in a result set, returned in SOURCES order, for building filter pills.
export function presentSources<T extends { source: string }>(items: T[]): SourceMeta[] {
  const present = new Set(items.map((item) => item.source));
  return SOURCES.filter((source) => present.has(source.id));
}
