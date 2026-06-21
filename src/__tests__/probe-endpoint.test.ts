import { describe, expect, it, vi } from "vitest";

import { probeEndpoint } from "@/api/probe-endpoint";

function fakeFetch(
  response: { status: number } | Error,
  delayMs = 0,
): typeof fetch {
  return ((async (
    _input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    if (delayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, delayMs);
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new DOMException("aborted", "AbortError"));
        });
      });
    }
    if (response instanceof Error) throw response;
    return new Response(null, { status: response.status });
  }) as unknown) as typeof fetch;
}

describe("probeEndpoint", () => {
  it("returns reachable for 2xx", async () => {
    const result = await probeEndpoint("https://api.example.local/v1", {
      fetchImpl: fakeFetch({ status: 200 }),
      nowIso: () => "2026-06-21T10:00:00Z",
    });
    expect(result.state).toBe("reachable");
    expect(result.httpStatus).toBe(200);
    expect(result.checkedAt).toBe("2026-06-21T10:00:00Z");
  });

  it("returns reachable for 4xx (server is up, route just unknown)", async () => {
    const result = await probeEndpoint("https://api.example.local/v1", {
      fetchImpl: fakeFetch({ status: 404 }),
    });
    expect(result.state).toBe("reachable");
    expect(result.httpStatus).toBe(404);
  });

  it("returns degraded for 5xx", async () => {
    const result = await probeEndpoint("https://api.example.local/v1", {
      fetchImpl: fakeFetch({ status: 503 }),
    });
    expect(result.state).toBe("degraded");
    expect(result.httpStatus).toBe(503);
  });

  it("returns error for thrown network failure (no abort)", async () => {
    const result = await probeEndpoint("https://api.example.local/v1", {
      fetchImpl: fakeFetch(new TypeError("network down")),
    });
    expect(result.state).toBe("error");
    expect(result.message).toMatch(/network down/);
  });

  it("returns unreachable when the request times out", async () => {
    vi.useFakeTimers();
    try {
      const slow = fakeFetch({ status: 200 }, 100_000);
      const promise = probeEndpoint("https://api.example.local/v1", {
        timeoutMs: 50,
        fetchImpl: slow,
      });
      // Advance past the timeout so the AbortController fires.
      await vi.advanceTimersByTimeAsync(60);
      const result = await promise;
      expect(result.state).toBe("unreachable");
      expect(result.message).toMatch(/timed out/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
