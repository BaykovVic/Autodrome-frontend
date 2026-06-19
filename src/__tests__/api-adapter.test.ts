import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getApiAdapter } from "@/api/get-api-adapter";

const ORIGINAL_MODE = process.env.NEXT_PUBLIC_API_ADAPTER;
const ORIGINAL_SCENARIO = process.env.NEXT_PUBLIC_MOCK_SCENARIO;

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_API_ADAPTER;
  delete process.env.NEXT_PUBLIC_MOCK_SCENARIO;
});

afterEach(() => {
  setEnv("NEXT_PUBLIC_API_ADAPTER", ORIGINAL_MODE);
  setEnv("NEXT_PUBLIC_MOCK_SCENARIO", ORIGINAL_SCENARIO);
});

describe("getApiAdapter", () => {
  it("returns an adapter that exposes all 5 services", () => {
    const adapter = getApiAdapter({ mode: "mock" });
    expect(typeof adapter.candidate.GET).toBe("function");
    expect(typeof adapter.vehicle.GET).toBe("function");
    expect(typeof adapter.exam.GET).toBe("function");
    expect(typeof adapter.exercise.GET).toBe("function");
    expect(typeof adapter.violationRule.GET).toBe("function");
  });

  it("defaults to live mode when no env var is set", () => {
    const adapter = getApiAdapter();
    expect(adapter).toBeDefined();
    expect(typeof adapter.candidate.GET).toBe("function");
  });

  it("switches to mock mode via NEXT_PUBLIC_API_ADAPTER env var", async () => {
    process.env.NEXT_PUBLIC_API_ADAPTER = "mock";
    process.env.NEXT_PUBLIC_MOCK_SCENARIO = "empty";

    const adapter = getApiAdapter();
    const { data, response } = await adapter.candidate.GET("/candidates", {
      params: { query: { pageSize: 10 } },
    });

    expect(response.status).toBe(200);
    expect(data?.items).toEqual([]);
  });

  it("explicit options override env vars", async () => {
    process.env.NEXT_PUBLIC_API_ADAPTER = "live";

    const adapter = getApiAdapter({ mode: "mock", scenario: "normal" });
    const { data, response } = await adapter.candidate.GET("/candidates", {
      params: { query: { pageSize: 10 } },
    });

    expect(response.status).toBe(200);
    expect((data?.items?.length ?? 0)).toBeGreaterThan(0);
  });
});
