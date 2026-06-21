/**
 * Opt-in reachability probe for a frontend client base URL.
 *
 * The probe is intentionally minimal: an idempotent GET to the base
 * URL with a short timeout. It does not authenticate, does not POST,
 * does not mutate. Even a 404/405 response counts as "reachable" —
 * we are testing whether the HTTP endpoint accepts a connection,
 * not whether a specific route exists. 5xx is surfaced separately
 * because it implies the server is up but a downstream piece is
 * broken.
 *
 * The probe is user-triggered (button click in the operations
 * diagnostics panel). It is never invoked automatically, so it
 * cannot generate background traffic against live services.
 */
export type ProbeState =
  | "reachable"
  | "degraded"
  | "unreachable"
  | "error";

export type ProbeResult = {
  state: ProbeState;
  httpStatus?: number;
  message?: string;
  checkedAt: string;
};

export type ProbeOptions = {
  timeoutMs?: number;
  /**
   * Injectable fetch and clock for tests. In production callers
   * leave these undefined and the global `fetch` and `Date` are
   * used.
   */
  fetchImpl?: typeof fetch;
  nowIso?: () => string;
};

const DEFAULT_TIMEOUT_MS = 3000;

function defaultNowIso(): string {
  return new Date().toISOString();
}

export async function probeEndpoint(
  url: string,
  opts: ProbeOptions = {},
): Promise<ProbeResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
    nowIso = defaultNowIso,
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      // Do not send credentials even if the browser would attach
      // cookies — this is a diagnostics check, not a session call.
      credentials: "omit",
    });
    if (response.status >= 500) {
      return {
        state: "degraded",
        httpStatus: response.status,
        checkedAt: nowIso(),
      };
    }
    return {
      state: "reachable",
      httpStatus: response.status,
      checkedAt: nowIso(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const aborted = controller.signal.aborted;
    return {
      state: aborted ? "unreachable" : "error",
      message: aborted ? `Probe timed out after ${timeoutMs}ms.` : message,
      checkedAt: nowIso(),
    };
  } finally {
    clearTimeout(timer);
  }
}
