import { describe, expect, it } from "vitest";
import { isKnownUniversity, searchUniversities, type University } from "@/lib/collegeSearch";

const DATA: University[] = [
  { name: "State University of New York at Buffalo", country: "United States" },
  { name: "State University of New York College at Buffalo", country: "United States" },
  { name: "State University of New York at Stony Brook", country: "United States" },
  { name: "University of Michigan - Ann Arbor", country: "United States" },
  { name: "University of Michigan - Dearborn", country: "United States" },
  { name: "Michigan State University", country: "United States" },
  { name: "University of California, Los Angeles", country: "United States" },
  { name: "Massachusetts Institute of Technology", country: "United States" },
  { name: "Madras Institute of Technology", country: "India" },
];

function names(query: string, limit = 8) {
  return searchUniversities(query, DATA, limit).map((u) => u.name);
}

describe("searchUniversities", () => {
  it("matches reordered word phrases", () => {
    expect(names("University of Buffalo")[0]).toBe("State University of New York at Buffalo");
    expect(names("Stony Brook University")[0]).toBe("State University of New York at Stony Brook");
  });

  it("resolves clean acronyms", () => {
    expect(names("UCLA")[0]).toBe("University of California, Los Angeles");
    expect(names("MIT")).toContain("Massachusetts Institute of Technology");
  });

  it("resolves irregular nicknames via the alias table", () => {
    const top = names("UMich").slice(0, 2);
    expect(top).toContain("University of Michigan - Ann Arbor");
    expect(top).toContain("University of Michigan - Dearborn");
  });

  it("returns nothing for an empty query and respects the limit", () => {
    expect(searchUniversities("", DATA, 8)).toEqual([]);
    expect(searchUniversities("University", DATA, 2)).toHaveLength(2);
  });
});

describe("isKnownUniversity", () => {
  it("accepts an exact, case-insensitive match to a listed name", () => {
    expect(isKnownUniversity("Massachusetts Institute of Technology", DATA)).toBe(true);
    expect(isKnownUniversity("massachusetts institute of technology", DATA)).toBe(true);
    expect(isKnownUniversity("  Massachusetts Institute of Technology  ", DATA)).toBe(true);
  });

  it("rejects freeform text, partial matches, and empty input", () => {
    expect(isKnownUniversity("MIT", DATA)).toBe(false);
    expect(isKnownUniversity("Massachusetts Institute", DATA)).toBe(false);
    expect(isKnownUniversity("Some Made Up University", DATA)).toBe(false);
    expect(isKnownUniversity("", DATA)).toBe(false);
    expect(isKnownUniversity("   ", DATA)).toBe(false);
  });
});
