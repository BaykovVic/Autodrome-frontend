import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";
import {
  classifyError,
  categoryCopy,
  categoryUiKind,
  API_ERROR_CATEGORIES,
  type ApiErrorCategory,
} from "@/api/error-taxonomy";

function makeApiError(opts: {
  status: number;
  code: string;
  details?: unknown;
}): ApiError {
  return new ApiError({
    status: opts.status,
    code: opts.code,
    message: `${opts.code} test`,
    correlationId: "11111111-2222-4333-8444-555555555555",
    url: "/api/test",
    details: opts.details,
  });
}

describe("error-taxonomy: classifyError() per-category", () => {
  it("classifies 503 SERVICE_DEGRADED as degraded → degraded-banner", () => {
    const c = classifyError(
      makeApiError({ status: 503, code: "SERVICE_DEGRADED" }),
    );
    expect(c.category).toBe("degraded");
    expect(c.uiKind).toBe("degraded-banner");
    expect(c.retryable).toBe(true);
    expect(c.title).toMatch(/degraded/i);
    expect(c.rawCode).toBe("SERVICE_DEGRADED");
    expect(c.rawStatus).toBe(503);
    expect(c.correlationId).toBe(
      "11111111-2222-4333-8444-555555555555",
    );
  });

  it("classifies 504 GATEWAY_TIMEOUT as timeout → degraded-banner", () => {
    const c = classifyError(
      makeApiError({ status: 504, code: "HTTP_504" }),
    );
    expect(c.category).toBe("timeout");
    expect(c.uiKind).toBe("degraded-banner");
    expect(c.retryable).toBe(true);
  });

  it("classifies 502 with non-degraded code as network → degraded-banner", () => {
    const c = classifyError(
      makeApiError({ status: 502, code: "HTTP_502" }),
    );
    expect(c.category).toBe("network");
    expect(c.uiKind).toBe("degraded-banner");
    expect(c.retryable).toBe(true);
  });

  it("classifies 401 UNAUTHORIZED as unauthorized → auth-block, not retryable", () => {
    const c = classifyError(
      makeApiError({ status: 401, code: "UNAUTHORIZED" }),
    );
    expect(c.category).toBe("unauthorized");
    expect(c.uiKind).toBe("auth-block");
    expect(c.retryable).toBe(false);
    expect(c.title).toMatch(/authentication is not configured/i);
    expect(c.description).toMatch(/unauthorized/i);
  });

  it("classifies 403 as forbidden → error-view, not retryable (distinct from 401)", () => {
    const c = classifyError(makeApiError({ status: 403, code: "HTTP_403" }));
    expect(c.category).toBe("forbidden");
    expect(c.uiKind).toBe("error-view");
    expect(c.retryable).toBe(false);
    expect(c.title).toMatch(/access denied/i);
    expect(c.description).toMatch(/not authorized|403|permission/i);
  });

  it("classifies a FORBIDDEN envelope code as forbidden regardless of status", () => {
    const c = classifyError(
      makeApiError({ status: 400, code: "FORBIDDEN" }),
    );
    expect(c.category).toBe("forbidden");
  });

  it("classifies 422 VALIDATION_FAILED as validation with field errors", () => {
    const c = classifyError(
      makeApiError({
        status: 422,
        code: "VALIDATION_FAILED",
        details: {
          fields: { fullName: "must be non-empty", dob: "must be valid date" },
        },
      }),
    );
    expect(c.category).toBe("validation");
    expect(c.uiKind).toBe("form-field");
    expect(c.retryable).toBe(false);
    expect(c.fieldErrors).toBeDefined();
    expect(c.fieldErrors).toContainEqual({
      field: "fullName",
      message: "must be non-empty",
    });
    expect(c.fieldErrors).toContainEqual({
      field: "dob",
      message: "must be valid date",
    });
  });

  it("classifies 422 with { issues: [...] } shape as validation", () => {
    const c = classifyError(
      makeApiError({
        status: 422,
        code: "VALIDATION_FAILED",
        details: {
          issues: [
            { field: "category", message: "unknown category" },
            { field: "category", message: "must not be empty" },
          ],
        },
      }),
    );
    expect(c.category).toBe("validation");
    expect(c.fieldErrors?.length).toBe(2);
  });

  it("classifies 409 RESOURCE_CONFLICT as conflict → error-view", () => {
    const c = classifyError(
      makeApiError({ status: 409, code: "RESOURCE_CONFLICT" }),
    );
    expect(c.category).toBe("conflict");
    expect(c.uiKind).toBe("error-view");
    expect(c.retryable).toBe(false);
  });

  it("classifies 404 NOT_FOUND as not-found → error-view", () => {
    const c = classifyError(
      makeApiError({ status: 404, code: "CANDIDATE_NOT_FOUND" }),
    );
    expect(c.category).toBe("not-found");
    expect(c.uiKind).toBe("error-view");
    expect(c.retryable).toBe(false);
  });

  it("classifies DECODE_FAILURE as contract-drift regardless of status", () => {
    const c = classifyError(
      makeApiError({ status: 200, code: "DECODE_FAILURE" }),
    );
    expect(c.category).toBe("contract-drift");
    expect(c.uiKind).toBe("degraded-banner");
    expect(c.retryable).toBe(false);
  });

  it("classifies 5xx without a recognised code as network", () => {
    const c = classifyError(
      makeApiError({ status: 599, code: "HTTP_599" }),
    );
    expect(c.category).toBe("network");
  });

  it("classifies native fetch failure (TypeError fetch failed) as network", () => {
    const err = new TypeError("fetch failed");
    const c = classifyError(err);
    expect(c.category).toBe("network");
    expect(c.uiKind).toBe("degraded-banner");
    expect(c.retryable).toBe(true);
  });

  it("classifies AbortError (timeout cancellation) as timeout", () => {
    const err = new Error("The operation was aborted");
    err.name = "AbortError";
    const c = classifyError(err);
    expect(c.category).toBe("timeout");
  });

  it("classifies a generic unknown Error as unknown → error-view", () => {
    const err = new Error("Plain boom");
    const c = classifyError(err);
    expect(c.category).toBe("unknown");
    expect(c.uiKind).toBe("error-view");
  });

  it("classifies non-Error throw values (string / object) as unknown", () => {
    expect(classifyError("oops").category).toBe("unknown");
    expect(classifyError({ random: true }).category).toBe("unknown");
    expect(classifyError(42).category).toBe("unknown");
  });
});

describe("error-taxonomy: copy + ui-kind helpers", () => {
  it("exposes stable title + description per category", () => {
    for (const category of API_ERROR_CATEGORIES) {
      const copy = categoryCopy(category);
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.description.length).toBeGreaterThan(0);
    }
  });

  it("maps every category to a defined ui-kind", () => {
    const expected: Record<ApiErrorCategory, string> = {
      network: "degraded-banner",
      timeout: "degraded-banner",
      degraded: "degraded-banner",
      "contract-drift": "degraded-banner",
      validation: "form-field",
      unauthorized: "auth-block",
      forbidden: "error-view",
      conflict: "error-view",
      "not-found": "error-view",
      unknown: "error-view",
    };
    for (const category of API_ERROR_CATEGORIES) {
      expect(categoryUiKind(category)).toBe(expected[category]);
    }
  });

  it("exposes 10 categories (9 spec categories + unknown)", () => {
    expect(API_ERROR_CATEGORIES.length).toBe(10);
    expect(new Set(API_ERROR_CATEGORIES).size).toBe(10);
  });
});
