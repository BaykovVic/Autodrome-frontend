/**
 * Frontend live-API error taxonomy.
 *
 * One classification layer above `ApiError` that maps every failure
 * mode the live runtime can produce into one of nine stable
 * categories. Each category drives a stable UI state — either a
 * `DegradedState` banner, an `ApiErrorView` panel, or form-level
 * field errors — without screens having to switch on raw HTTP status
 * codes or backend `error.code` strings.
 *
 * This module is pure: it does NOT depend on any UI component or
 * React. UI integration lives in `src/components/ApiErrorView.tsx`
 * (category-aware title/description) and per-screen wiring.
 *
 * Categories (per spec):
 *
 *   1. network              — backend unavailable / DNS / TCP / fetch failed
 *   2. timeout              — request exceeded timeout
 *   3. unauthorized         — auth missing / expired / 401
 *   4. forbidden            — authenticated but not permitted / 403
 *   5. validation           — 400 / 422 with field errors envelope
 *   6. conflict             — 409 or `RESOURCE_CONFLICT` envelope
 *   7. not-found            — 404 or `NOT_FOUND` envelope
 *   8. contract-drift       — decode failure / unknown body shape /
 *                              status without a recognised envelope
 *   9. degraded             — backend returned a response but flagged
 *                              itself degraded (e.g. 503
 *                              `SERVICE_DEGRADED` envelope, partial
 *                              data response with `_degraded: true`)
 *
 *   plus `unknown` as a strict fallback. Code that handles only the
 *   eight named categories should still treat `unknown` as a generic
 *   error state — never silently swallow it.
 */

import { ApiError } from "./errors";

export type ApiErrorCategory =
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "conflict"
  | "not-found"
  | "contract-drift"
  | "degraded"
  | "unknown";

/**
 * Which UI primitive the screen should render. Screens choose the
 * primitive based on this kind, not on the raw error.
 *
 *   - `degraded-banner`     → render `<DegradedState />`. The
 *                              underlying data may still be visible
 *                              (stale or partial); operator can
 *                              continue.
 *   - `error-view`          → render `<ApiErrorView />`. The data is
 *                              unavailable; show the error panel and
 *                              a retry control where appropriate.
 *   - `form-field`          → caller-side handling. Validation
 *                              errors map onto inline field hints;
 *                              the global ApiErrorView is hidden.
 *   - `auth-block`          → render `<ApiErrorView />` for a missing /
 *                              expired session: an operator-facing
 *                              "session expired" message plus a
 *                              sign-in action that routes to `/login`
 *                              (preserving `redirect`). Used for 401.
 */
export type ApiErrorUiKind =
  | "degraded-banner"
  | "error-view"
  | "form-field"
  | "auth-block";

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorClassification {
  /** One of the eight named categories (or `unknown`). */
  category: ApiErrorCategory;
  /** Which UI primitive renders this category. */
  uiKind: ApiErrorUiKind;
  /** Short operator-facing title (used in `<ApiErrorView />` header). */
  title: string;
  /** Operator-facing description. Plain text; safe to inject into UI. */
  description: string;
  /**
   * Whether re-trying the same request is likely to succeed. UI uses
   * this to show / hide a retry button.
   */
  retryable: boolean;
  /**
   * Extracted field-level errors (validation category only). Always
   * undefined for non-validation categories.
   */
  fieldErrors?: FieldError[];
  /** Raw `ApiError.code` if classification came from one. */
  rawCode?: string;
  /** Raw HTTP status if classification came from an `ApiError`. */
  rawStatus?: number;
  /** Correlation-Id propagated for operator hand-off. */
  correlationId?: string;
}

/**
 * Status codes that map deterministically to a category. Order
 * matters: this table is consulted before the `code` heuristics so
 * a known HTTP status always wins.
 */
const STATUS_CATEGORY: Readonly<Record<number, ApiErrorCategory>> = {
  400: "validation",
  401: "unauthorized",
  403: "forbidden",
  404: "not-found",
  408: "timeout",
  409: "conflict",
  410: "not-found",
  422: "validation",
  502: "network",
  503: "degraded",
  504: "timeout",
};

/**
 * `ApiError.code` keys we recognise as degraded-but-still-operational.
 * Anything matching this set is steered into `degraded`, even if the
 * HTTP status is not 503.
 */
const DEGRADED_CODES: ReadonlySet<string> = new Set([
  "SERVICE_DEGRADED",
  "PARTIAL_DATA",
  "SERVICE_UNAVAILABLE",
]);

/**
 * Codes that always indicate decode failure regardless of status.
 */
const CONTRACT_DRIFT_CODES: ReadonlySet<string> = new Set([
  "DECODE_FAILURE",
  "CONTRACT_DRIFT",
  "INVALID_RESPONSE_BODY",
  "UNKNOWN_ENVELOPE",
]);

const TIMEOUT_CODES: ReadonlySet<string> = new Set([
  "TIMEOUT",
  "REQUEST_TIMEOUT",
  "GATEWAY_TIMEOUT",
]);

const VALIDATION_CODES: ReadonlySet<string> = new Set([
  "VALIDATION_FAILED",
  "INVALID_REQUEST",
  "BAD_REQUEST",
]);

const CONFLICT_CODES: ReadonlySet<string> = new Set([
  "RESOURCE_CONFLICT",
  "CONFLICT",
  "VERSION_MISMATCH",
]);

const NOT_FOUND_CODES: ReadonlySet<string> = new Set([
  "NOT_FOUND",
  "RESOURCE_NOT_FOUND",
]);

const UNAUTHORIZED_CODES: ReadonlySet<string> = new Set([
  "UNAUTHORIZED",
  "AUTH_MISSING",
  "AUTH_EXPIRED",
]);

const FORBIDDEN_CODES: ReadonlySet<string> = new Set([
  "FORBIDDEN",
  "ACCESS_DENIED",
  "INSUFFICIENT_PERMISSIONS",
  "PERMISSION_DENIED",
]);

function uiKindFor(category: ApiErrorCategory): ApiErrorUiKind {
  switch (category) {
    case "network":
    case "timeout":
    case "degraded":
    case "contract-drift":
      return "degraded-banner";
    case "validation":
      return "form-field";
    case "unauthorized":
      return "auth-block";
    case "forbidden":
    case "conflict":
    case "not-found":
    case "unknown":
    default:
      return "error-view";
  }
}

function retryableFor(category: ApiErrorCategory): boolean {
  switch (category) {
    case "network":
    case "timeout":
    case "degraded":
      return true;
    case "contract-drift":
    case "unauthorized":
    case "forbidden":
    case "validation":
    case "conflict":
    case "not-found":
      return false;
    case "unknown":
    default:
      return true;
  }
}

type CopySpec = { title: string; description: string };

function defaultCopy(category: ApiErrorCategory): CopySpec {
  switch (category) {
    case "network":
      return {
        title: "Backend unavailable",
        description:
          "The local node cannot reach the backend right now. The console will keep retrying — operator can continue working with cached data.",
      };
    case "timeout":
      return {
        title: "Request timed out",
        description:
          "The backend took too long to respond. Retry the action, or wait until the latency settles.",
      };
    case "unauthorized":
      return {
        title: "Session expired",
        description:
          "Your operator session is missing or has expired. Sign in again to continue.",
      };
    case "forbidden":
      return {
        title: "Access denied",
        description:
          "The current operator is authenticated but not authorized for this action. Backend RBAC rejected the request (403). Ask an administrator to grant the required role/permission.",
      };
    case "validation":
      return {
        title: "Validation failed",
        description:
          "Some fields did not pass backend validation. Adjust the highlighted fields and try again.",
      };
    case "conflict":
      return {
        title: "Conflict with current state",
        description:
          "Another operator (or a recent local change) already modified the same record. Reload to see the latest version, then retry.",
      };
    case "not-found":
      return {
        title: "Record not found",
        description:
          "The requested record is not on this local node. It may have been removed or never existed here.",
      };
    case "contract-drift":
      return {
        title: "Backend response is not understood",
        description:
          "The backend returned data that does not match the canonical contract. The console will keep the last known good snapshot. File a contract drift report.",
      };
    case "degraded":
      return {
        title: "Backend is degraded",
        description:
          "The service is operational but signalled a degraded mode. Data may be stale or partial; latest writes might be queued locally and replay on recovery.",
      };
    case "unknown":
    default:
      return {
        title: "Unexpected error",
        description:
          "The console could not classify this error. Operator can retry or capture the correlation id for support.",
      };
  }
}

function extractFieldErrorsFromDetails(
  details: unknown,
): FieldError[] | undefined {
  if (!details || typeof details !== "object") return undefined;
  const obj = details as Record<string, unknown>;

  // Canonical shape from `common-dto-and-error-model.md` section
  // "Validation errors": `{ fields: { fieldName: "message" } }`.
  if (obj.fields && typeof obj.fields === "object") {
    const fields = obj.fields as Record<string, unknown>;
    const list: FieldError[] = [];
    for (const [field, message] of Object.entries(fields)) {
      if (typeof message === "string") {
        list.push({ field, message });
      }
    }
    if (list.length > 0) return list;
  }

  // Alternative `{ issues: [{ field, message }] }` shape some
  // services use when reporting multiple errors per field.
  if (Array.isArray(obj.issues)) {
    const list: FieldError[] = [];
    for (const raw of obj.issues) {
      if (
        raw &&
        typeof raw === "object" &&
        typeof (raw as Record<string, unknown>).field === "string" &&
        typeof (raw as Record<string, unknown>).message === "string"
      ) {
        list.push({
          field: String((raw as Record<string, unknown>).field),
          message: String((raw as Record<string, unknown>).message),
        });
      }
    }
    if (list.length > 0) return list;
  }

  return undefined;
}

function classifyApiError(err: ApiError): ApiErrorClassification {
  const code = err.code;
  const status = err.status;

  // Code-first heuristics (a known envelope code always wins).
  if (DEGRADED_CODES.has(code)) {
    return finalise(err, "degraded", undefined);
  }
  if (CONTRACT_DRIFT_CODES.has(code)) {
    return finalise(err, "contract-drift", undefined);
  }
  if (TIMEOUT_CODES.has(code)) {
    return finalise(err, "timeout", undefined);
  }
  if (UNAUTHORIZED_CODES.has(code)) {
    return finalise(err, "unauthorized", undefined);
  }
  if (FORBIDDEN_CODES.has(code)) {
    return finalise(err, "forbidden", undefined);
  }
  if (CONFLICT_CODES.has(code)) {
    return finalise(err, "conflict", undefined);
  }
  if (NOT_FOUND_CODES.has(code)) {
    return finalise(err, "not-found", undefined);
  }
  if (VALIDATION_CODES.has(code)) {
    const fields = extractFieldErrorsFromDetails(err.details);
    return finalise(err, "validation", fields);
  }

  // Status fallback.
  const byStatus = STATUS_CATEGORY[status];
  if (byStatus) {
    if (byStatus === "validation") {
      const fields = extractFieldErrorsFromDetails(err.details);
      return finalise(err, byStatus, fields);
    }
    return finalise(err, byStatus, undefined);
  }

  // 5xx without a recognised code → network (server-side blast).
  if (status >= 500 && status <= 599) {
    return finalise(err, "network", undefined);
  }

  return finalise(err, "unknown", undefined);
}

function finalise(
  err: ApiError,
  category: ApiErrorCategory,
  fieldErrors: FieldError[] | undefined,
): ApiErrorClassification {
  const copy = defaultCopy(category);
  return {
    category,
    uiKind: uiKindFor(category),
    title: copy.title,
    description: copy.description,
    retryable: retryableFor(category),
    fieldErrors,
    rawCode: err.code,
    rawStatus: err.status,
    correlationId: err.correlationId,
  };
}

function classifyGenericError(err: Error): ApiErrorClassification {
  const message = err.message ?? "";
  const name = err.name ?? "";
  const lowered = `${name} ${message}`.toLowerCase();

  // Native `fetch` failures surface as `TypeError: fetch failed`
  // (Node 18+) or `TypeError: Failed to fetch` (browser).
  if (
    lowered.includes("fetch failed") ||
    lowered.includes("failed to fetch") ||
    lowered.includes("networkerror")
  ) {
    const copy = defaultCopy("network");
    return {
      category: "network",
      uiKind: uiKindFor("network"),
      title: copy.title,
      description: copy.description,
      retryable: retryableFor("network"),
    };
  }
  if (lowered.includes("timeout") || lowered.includes("timed out")) {
    const copy = defaultCopy("timeout");
    return {
      category: "timeout",
      uiKind: uiKindFor("timeout"),
      title: copy.title,
      description: copy.description,
      retryable: retryableFor("timeout"),
    };
  }
  if (lowered.includes("abort")) {
    // Aborted requests look like a soft timeout / cancellation —
    // treat as timeout so the UI gets a retry control.
    const copy = defaultCopy("timeout");
    return {
      category: "timeout",
      uiKind: uiKindFor("timeout"),
      title: copy.title,
      description: copy.description,
      retryable: retryableFor("timeout"),
    };
  }

  const copy = defaultCopy("unknown");
  return {
    category: "unknown",
    uiKind: uiKindFor("unknown"),
    title: copy.title,
    description: copy.description,
    retryable: retryableFor("unknown"),
  };
}

/**
 * Classify any caught error into the taxonomy. UI code should call
 * this in render and switch on the returned classification.
 */
export function classifyError(error: unknown): ApiErrorClassification {
  if (error instanceof ApiError) {
    return classifyApiError(error);
  }
  if (error instanceof Error) {
    return classifyGenericError(error);
  }
  // Non-Error throw values (string, number, plain object). These
  // exist in the wild and would otherwise crash `error instanceof
  // Error` checks downstream — give them a safe `unknown` slot.
  const copy = defaultCopy("unknown");
  return {
    category: "unknown",
    uiKind: uiKindFor("unknown"),
    title: copy.title,
    description: copy.description,
    retryable: retryableFor("unknown"),
  };
}

/**
 * Map a category to its default operator-facing copy. Exposed so
 * UI primitives can render the standard banner / panel text without
 * re-deriving it from a classification instance.
 */
export function categoryCopy(category: ApiErrorCategory): CopySpec {
  return defaultCopy(category);
}

/** Map a category to its UI primitive kind. */
export function categoryUiKind(category: ApiErrorCategory): ApiErrorUiKind {
  return uiKindFor(category);
}

/** All eight named categories plus `unknown`, exported for tests + docs. */
export const API_ERROR_CATEGORIES: readonly ApiErrorCategory[] = [
  "network",
  "timeout",
  "unauthorized",
  "forbidden",
  "validation",
  "conflict",
  "not-found",
  "contract-drift",
  "degraded",
  "unknown",
] as const;
