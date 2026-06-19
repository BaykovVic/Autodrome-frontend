import { describe, expect, it, vi } from "vitest";

import { ApiError, createAutodromeClient } from "@/api";
import type { paths } from "@/contracts/types/candidate";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 400 ? "Error" : "OK",
    headers: { "Content-Type": "application/json" },
  });
}

describe("createAutodromeClient", () => {
  it("adds a Correlation-Id header to outgoing requests", async () => {
    let observed: Headers | undefined;
    const fakeFetch: typeof fetch = vi.fn(async (input, init) => {
      observed =
        input instanceof Request
          ? input.headers
          : new Headers(init?.headers);
      return jsonResponse(200, { items: [], nextPageToken: null });
    });

    const client = createAutodromeClient<paths>({
      baseUrl: "/api/candidate/v1",
      fetch: fakeFetch,
      correlationIdFactory: () =>
        "00000000-0000-4000-8000-000000000001",
    });

    await client.GET("/candidates", {
      params: { query: { pageSize: 10 } },
    });

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(observed?.get("Correlation-Id")).toBe(
      "00000000-0000-4000-8000-000000000001",
    );
  });

  it("throws ApiError for non-2xx responses with canonical envelope", async () => {
    const envelope = {
      error: {
        code: "CANDIDATE_NOT_FOUND",
        message: "missing",
        correlationId: "00000000-0000-4000-8000-000000000002",
      },
    };
    const fakeFetch: typeof fetch = vi.fn(async () =>
      jsonResponse(404, envelope),
    );

    const client = createAutodromeClient<paths>({
      baseUrl: "/api/candidate/v1",
      fetch: fakeFetch,
    });

    await expect(
      client.GET("/candidates/{candidateId}", {
        params: {
          path: { candidateId: "00000000-0000-4000-8000-000000000003" },
        },
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("aborts requests that exceed the default timeout", async () => {
    const fakeFetch: typeof fetch = vi.fn(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(
              new DOMException("aborted", "AbortError"),
            );
          });
        }),
    );

    const client = createAutodromeClient<paths>({
      baseUrl: "/api/candidate/v1",
      fetch: fakeFetch,
      defaultTimeoutMs: 5,
    });

    await expect(
      client.GET("/candidates", {
        params: { query: { pageSize: 10 } },
      }),
    ).rejects.toThrowError();
  });
});
