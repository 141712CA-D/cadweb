import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// API_BASE is read from process.env at module load, so each test re-imports
// the module after adjusting the environment.
const ORIGINAL = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = ORIGINAL;
  }
});

describe("apiUrl", () => {
  it("prefixes paths with NEXT_PUBLIC_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.parametra.ai";
    const { apiUrl, API_BASE } = await import("@/lib/api");
    expect(API_BASE).toBe("https://api.parametra.ai");
    expect(apiUrl("/api/health")).toBe("https://api.parametra.ai/api/health");
  });

  it("falls back to same-origin (empty prefix) when the env var is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const { apiUrl, API_BASE } = await import("@/lib/api");
    expect(API_BASE).toBe("");
    expect(apiUrl("/api/waitlist/request")).toBe("/api/waitlist/request");
  });

  it("does not mangle query strings", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.parametra.ai";
    const { apiUrl } = await import("@/lib/api");
    expect(apiUrl("/api/waitlist/check-cache?email=a%40b.com")).toBe(
      "https://api.parametra.ai/api/waitlist/check-cache?email=a%40b.com"
    );
  });
});
