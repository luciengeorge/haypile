import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { modalityKind, type SearchResult } from "./search-result";
import { SearchResults } from "./search-results";

const results: SearchResult[] = [
  { _id: "1", url: "https://x.com/a", source: "x", score: 0.69, title: "Self-employment tax", matchModality: "image" },
  {
    _id: "2",
    url: "https://youtube.com/b",
    source: "youtube",
    score: 0.66,
    title: "Quarterly taxes",
    matchModality: "video_segment",
  },
  { _id: "3", url: "https://nerdwallet.com/c", source: "x", score: 0.63, title: "Tax brackets", matchModality: "link" },
];

describe("modalityKind", () => {
  it("maps modality strings to a kind", () => {
    expect(modalityKind("image")).toBe("image");
    expect(modalityKind("video_segment")).toBe("video");
    expect(modalityKind("link-preview")).toBe("link");
    expect(modalityKind(undefined)).toBe("text");
  });
});

describe("SearchResults", () => {
  const noop = () => {};

  it("summarises count and distinct sources", () => {
    render(<SearchResults results={results} selectedSource="all" onSelectSource={noop} />);
    expect(screen.getByText(/across 2 sources/)).toBeInTheDocument();
  });

  it("renders one navigable link per result", () => {
    render(<SearchResults results={results} selectedSource="all" onSelectSource={noop} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByText("Self-employment tax")).toBeInTheDocument();
  });

  it("renders a pill per present source plus 'All sources'", () => {
    render(<SearchResults results={results} selectedSource="all" onSelectSource={noop} />);
    expect(screen.getByRole("button", { name: "All sources" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "X" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "YouTube" })).toBeInTheDocument();
  });

  it("filters rows to the selected source", () => {
    render(<SearchResults results={results} selectedSource="x" onSelectSource={noop} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.queryByText("Quarterly taxes")).not.toBeInTheDocument();
  });

  it("reports pill selection to the parent", () => {
    const onSelect = vi.fn();
    render(<SearchResults results={results} selectedSource="all" onSelectSource={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "YouTube" }));
    expect(onSelect).toHaveBeenCalledWith("youtube");
  });

  it("marks the active pill with aria-pressed", () => {
    render(<SearchResults results={results} selectedSource="youtube" onSelectSource={noop} />);
    expect(screen.getByRole("button", { name: "YouTube" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "X" })).toHaveAttribute("aria-pressed", "false");
  });
});
