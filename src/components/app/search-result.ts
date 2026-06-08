export type SearchResult = {
  _id: string;
  url: string;
  source: string;
  score?: number;
  title?: string;
  text?: string;
  author?: string;
  matchModality?: string;
  kind?: string;
  durationSec?: number;
  media?: { type: string; url: string; durationSec?: number }[];
  links?: { url: string; title?: string; description?: string; imageUrl?: string }[];
  thumbnailStorageId?: string;
};

type Kind = "image" | "video" | "link" | "text";

export function modalityKind(modality?: string): Kind {
  if (!modality) return "text";
  if (modality.startsWith("image")) return "image";
  if (modality.startsWith("video")) return "video";
  if (modality.includes("link")) return "link";
  return "text";
}

export type CardKind = "image" | "video" | "link" | "post";

export function cardKind(result: SearchResult): CardKind {
  switch (result.kind) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "post":
      return "post";
    case "article":
    case "repo":
      return "link";
    default: {
      const modality = modalityKind(result.matchModality);
      return modality === "text" ? "post" : modality;
    }
  }
}

export function thumbnailUrl(result: SearchResult, kind: CardKind): string | undefined {
  if (result.thumbnailStorageId) return `/api/img/${result.thumbnailStorageId}`;
  if (kind === "image") return result.media?.find((m) => m.type === "image")?.url ?? result.media?.[0]?.url;
  if (kind === "link") return result.links?.[0]?.imageUrl;
  return undefined;
}

export function videoDuration(result: SearchResult): number | undefined {
  return result.durationSec ?? result.media?.find((m) => m.type === "video")?.durationSec;
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
