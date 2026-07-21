import { describe, expect, it } from "vitest";
import { isValidEmail } from "@/lib/email";

describe("isValidEmail", () => {
  it("accepts standard email addresses", () => {
    expect(isValidEmail("ada@example.com")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.example.co")).toBe(true);
    expect(isValidEmail("  ada@example.com  ")).toBe(true);
  });

  it("rejects emoji and other non-email symbols", () => {
    expect(isValidEmail("😀@example.com")).toBe(false);
    expect(isValidEmail("ada😀@example.com")).toBe(false);
    expect(isValidEmail("ada@exam😀ple.com")).toBe(false);
    expect(isValidEmail("ada@example.c😀m")).toBe(false);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("ada@")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("ada@example")).toBe(false);
    expect(isValidEmail("ada @example.com")).toBe(false);
  });
});