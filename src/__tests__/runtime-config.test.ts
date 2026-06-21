import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIVE_BASE_URLS,
  resolveLiveBaseUrls,
  resolveRuntimeConfig,
  resolveRuntimeMode,
  summarizeRuntimeConfig,
} from "@/api/runtime-config";

describe("resolveRuntimeMode", () => {
  it("defaults to mock when env is empty", () => {
    expect(resolveRuntimeMode({})).toBe("mock");
  });

  it("defaults to mock when env value is unknown", () => {
    expect(
      resolveRuntimeMode({ NEXT_PUBLIC_API_ADAPTER: "wat" }),
    ).toBe("mock");
  });

  it("resolves to live only when env is exactly 'live'", () => {
    expect(
      resolveRuntimeMode({ NEXT_PUBLIC_API_ADAPTER: "live" }),
    ).toBe("live");
  });
});

describe("resolveLiveBaseUrls", () => {
  it("returns defaults and no issues when env has no overrides", () => {
    const { baseUrls, issues } = resolveLiveBaseUrls({});
    expect(baseUrls).toEqual(DEFAULT_LIVE_BASE_URLS);
    expect(issues).toEqual([]);
  });

  it("accepts an absolute https URL override", () => {
    const { baseUrls, issues } = resolveLiveBaseUrls({
      NEXT_PUBLIC_API_CANDIDATE_BASE_URL:
        "https://example.local/api/candidate/v1",
    });
    expect(baseUrls.candidate).toBe(
      "https://example.local/api/candidate/v1",
    );
    expect(issues).toEqual([]);
  });

  it("accepts an absolute path override", () => {
    const { baseUrls, issues } = resolveLiveBaseUrls({
      NEXT_PUBLIC_API_VEHICLE_BASE_URL: "/proxy/vehicle/v1",
    });
    expect(baseUrls.vehicle).toBe("/proxy/vehicle/v1");
    expect(issues).toEqual([]);
  });

  it("flags malformed URL and falls back to the default", () => {
    const { baseUrls, issues } = resolveLiveBaseUrls({
      NEXT_PUBLIC_API_EXAM_BASE_URL: "::not-a-url::",
    });
    expect(baseUrls.exam).toBe(DEFAULT_LIVE_BASE_URLS.exam);
    expect(issues).toHaveLength(1);
    expect(issues[0].field).toBe("NEXT_PUBLIC_API_EXAM_BASE_URL");
    expect(issues[0].message).toMatch(/Invalid base URL/i);
  });

  it("collects multiple issues at once", () => {
    const { issues } = resolveLiveBaseUrls({
      NEXT_PUBLIC_API_EXAM_BASE_URL: "::bad::",
      NEXT_PUBLIC_API_EXERCISE_BASE_URL: "also-bad",
    });
    expect(issues.map((i) => i.field).sort()).toEqual([
      "NEXT_PUBLIC_API_EXAM_BASE_URL",
      "NEXT_PUBLIC_API_EXERCISE_BASE_URL",
    ]);
  });

  it("treats empty string env value as 'not set' (no issue)", () => {
    const { baseUrls, issues } = resolveLiveBaseUrls({
      NEXT_PUBLIC_API_CANDIDATE_BASE_URL: "",
    });
    expect(baseUrls.candidate).toBe(DEFAULT_LIVE_BASE_URLS.candidate);
    expect(issues).toEqual([]);
  });
});

describe("resolveRuntimeConfig", () => {
  it("returns mock config with default scenario when no env", () => {
    const config = resolveRuntimeConfig({});
    expect(config.mode).toBe("mock");
    if (config.mode === "mock") {
      expect(config.scenario).toBe("normal");
    }
  });

  it("returns mock config with explicit scenario", () => {
    const config = resolveRuntimeConfig({
      NEXT_PUBLIC_API_ADAPTER: "mock",
      NEXT_PUBLIC_MOCK_SCENARIO: "violations-detected",
    });
    expect(config.mode).toBe("mock");
    if (config.mode === "mock") {
      expect(config.scenario).toBe("violations-detected");
    }
  });

  it("returns ok-live with default base URLs", () => {
    const config = resolveRuntimeConfig({
      NEXT_PUBLIC_API_ADAPTER: "live",
    });
    expect(config.mode).toBe("live");
    expect(config.ok).toBe(true);
    if (config.mode === "live" && config.ok) {
      expect(config.baseUrls).toEqual(DEFAULT_LIVE_BASE_URLS);
    }
  });

  it("returns degraded-live with issues when a base URL is invalid", () => {
    const config = resolveRuntimeConfig({
      NEXT_PUBLIC_API_ADAPTER: "live",
      NEXT_PUBLIC_API_EXAM_BASE_URL: "::bad::",
    });
    expect(config.mode).toBe("live");
    expect(config.ok).toBe(false);
    if (config.mode === "live" && !config.ok) {
      expect(config.issues).toHaveLength(1);
      // Invalid value falls back to default.
      expect(config.baseUrls.exam).toBe(DEFAULT_LIVE_BASE_URLS.exam);
    }
  });
});

describe("summarizeRuntimeConfig", () => {
  it("strips internal fields for the mock case", () => {
    const summary = summarizeRuntimeConfig({
      ok: true,
      mode: "mock",
      scenario: "empty",
    });
    expect(summary).toEqual({ mode: "mock", scenario: "empty" });
  });

  it("flattens ok-live", () => {
    const summary = summarizeRuntimeConfig({
      ok: true,
      mode: "live",
      baseUrls: DEFAULT_LIVE_BASE_URLS,
    });
    expect(summary).toEqual({
      mode: "live",
      ok: true,
      baseUrls: DEFAULT_LIVE_BASE_URLS,
    });
  });

  it("flattens degraded-live with issues", () => {
    const summary = summarizeRuntimeConfig({
      ok: false,
      mode: "live",
      baseUrls: DEFAULT_LIVE_BASE_URLS,
      issues: [
        {
          field: "NEXT_PUBLIC_API_EXAM_BASE_URL",
          message: "Invalid base URL for exam-service.",
        },
      ],
    });
    expect(summary.mode).toBe("live");
    if (summary.mode === "live" && !summary.ok) {
      expect(summary.issues).toHaveLength(1);
    }
  });
});
