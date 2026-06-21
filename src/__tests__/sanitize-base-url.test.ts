import { describe, expect, it } from "vitest";

import { sanitizeBaseUrl } from "@/api/sanitize-base-url";

describe("sanitizeBaseUrl", () => {
  it("returns relative paths unchanged", () => {
    expect(sanitizeBaseUrl("/api/candidate/v1")).toBe(
      "/api/candidate/v1",
    );
  });

  it("returns absolute URLs without credentials unchanged", () => {
    expect(
      sanitizeBaseUrl("https://api.example.local/api/candidate/v1"),
    ).toBe("https://api.example.local/api/candidate/v1");
  });

  it("redacts user:password userinfo", () => {
    const sanitized = sanitizeBaseUrl(
      "https://alice:secret@api.example.local/api/candidate/v1",
    );
    expect(sanitized.startsWith("https://***@")).toBe(true);
    expect(sanitized.includes("alice")).toBe(false);
    expect(sanitized.includes("secret")).toBe(false);
  });

  it("redacts credential-looking query params (case-insensitive)", () => {
    const sanitized = sanitizeBaseUrl(
      "https://api.example.local/v1?token=abc123&Region=eu&api_key=xyz",
    );
    expect(sanitized.includes("abc123")).toBe(false);
    expect(sanitized.includes("xyz")).toBe(false);
    expect(sanitized).toMatch(/token=\*\*\*/);
    expect(sanitized).toMatch(/api_key=\*\*\*/);
    // Non-credential params are preserved.
    expect(sanitized.includes("Region=eu")).toBe(true);
  });

  it("returns malformed URLs unchanged so the operator sees the bad value", () => {
    expect(sanitizeBaseUrl("::not-a-url::")).toBe("::not-a-url::");
  });
});
