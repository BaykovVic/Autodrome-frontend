import { describe, expect, it } from "vitest";

import { CORRELATION_HEADER, newCorrelationId } from "@/api/correlation";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("newCorrelationId", () => {
  it("returns a UUID v4", () => {
    const value = newCorrelationId();
    expect(value).toMatch(UUID_V4_PATTERN);
  });

  it("produces unique values across calls", () => {
    const samples = new Set(
      Array.from({ length: 32 }, () => newCorrelationId()),
    );
    expect(samples.size).toBe(32);
  });

  it("exposes the canonical header name from contracts", () => {
    expect(CORRELATION_HEADER).toBe("Correlation-Id");
  });
});
