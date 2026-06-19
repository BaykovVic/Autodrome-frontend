import { describe, expect, it } from "vitest";

import { ApiError, parseErrorResponse } from "@/api/errors";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: "BadRequest",
    headers: { "Content-Type": "application/json" },
  });
}

describe("parseErrorResponse", () => {
  it("turns a canonical REST error envelope into ApiError", async () => {
    const envelope = {
      error: {
        code: "CANDIDATE_NOT_FOUND",
        message: "Candidate does not exist",
        correlationId: "11111111-2222-4333-8444-555555555555",
        timestamp: "2026-06-19T12:00:00Z",
        details: { candidateId: "abc" },
      },
    };
    const response = jsonResponse(404, envelope);

    const apiError = await parseErrorResponse(response, "/api/candidate/v1/x");

    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.status).toBe(404);
    expect(apiError.code).toBe("CANDIDATE_NOT_FOUND");
    expect(apiError.message).toBe("Candidate does not exist");
    expect(apiError.correlationId).toBe(
      "11111111-2222-4333-8444-555555555555",
    );
    expect(apiError.timestamp).toBe("2026-06-19T12:00:00Z");
    expect(apiError.details).toEqual({ candidateId: "abc" });
    expect(apiError.url).toBe("/api/candidate/v1/x");
  });

  it("falls back to HTTP_<status> code when body is not a known envelope", async () => {
    const response = new Response("not-json", {
      status: 502,
      statusText: "Bad Gateway",
    });

    const apiError = await parseErrorResponse(response, "/api/foo");

    expect(apiError.status).toBe(502);
    expect(apiError.code).toBe("HTTP_502");
    expect(apiError.message.length).toBeGreaterThan(0);
  });

  it("ignores partial bodies that are not envelopes", async () => {
    const response = jsonResponse(400, { error: { code: "X" } }); // missing message
    const apiError = await parseErrorResponse(response, "/x");
    expect(apiError.code).toBe("HTTP_400");
  });
});
