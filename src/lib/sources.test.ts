import { describe, expect, it } from "vitest";

import { filterBySource, presentSources, sourceLabel } from "./sources";

const results = [
  { source: "x", id: 1 },
  { source: "github", id: 2 },
  { source: "x", id: 3 },
];

describe("sourceLabel", () => {
  it("maps known ids to labels", () => {
    expect(sourceLabel("x")).toBe("X");
    expect(sourceLabel("github")).toBe("GitHub");
  });

  it("returns the id unchanged when unknown", () => {
    expect(sourceLabel("mastodon")).toBe("mastodon");
  });
});

describe("filterBySource", () => {
  it("returns everything for 'all'", () => {
    expect(filterBySource(results, "all")).toHaveLength(3);
  });

  it("filters to a single source", () => {
    expect(filterBySource(results, "x").map((r) => r.id)).toEqual([1, 3]);
  });

  it("returns empty when no items match", () => {
    expect(filterBySource(results, "reddit")).toEqual([]);
  });
});

describe("presentSources", () => {
  it("returns distinct sources in SOURCES order", () => {
    expect(presentSources(results).map((s) => s.id)).toEqual(["x", "github"]);
  });

  it("returns empty for no results", () => {
    expect(presentSources([])).toEqual([]);
  });
});
