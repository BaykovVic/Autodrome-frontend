import createClient, {
  type Client,
  type Middleware,
} from "openapi-fetch";

import { CORRELATION_HEADER, newCorrelationId } from "./correlation";
import { ApiError, parseErrorResponse } from "./errors";

export type ApiClientOptions = {
  /** Base URL for the service, e.g. `/api/candidate` or `https://node.local/v1`. */
  baseUrl: string;
  /** Optional default timeout in ms applied to every request without an explicit signal. */
  defaultTimeoutMs?: number;
  /** Optional factory for a per-request correlation id (UUID v4 by default). */
  correlationIdFactory?: () => string;
  /**
   * Optional bearer-token provider. When set and it returns a non-empty
   * token, the client adds `Authorization: Bearer <token>` to every
   * request that does not already carry one. Live clients pass the
   * session token store; mock clients omit it, so mock mode never sends
   * an `Authorization` header.
   */
  authTokenProvider?: () => string | null | undefined;
  /** Optional `fetch` override (useful for tests / SSR). */
  fetch?: typeof fetch;
};

export type AutodromeClient<Paths extends object> = Client<Paths>;

/**
 * Creates a typed API client for a single Autodrome service. Adds the
 * canonical `Correlation-Id` header to every request, applies a default
 * timeout via `AbortController` when the caller does not pass a `signal`,
 * and parses the REST error envelope into `ApiError` for any non-2xx
 * response.
 */
export function createAutodromeClient<Paths extends object>(
  options: ApiClientOptions,
): AutodromeClient<Paths> {
  const correlationIdFactory =
    options.correlationIdFactory ?? newCorrelationId;
  const defaultTimeoutMs = options.defaultTimeoutMs ?? 30_000;
  const authTokenProvider = options.authTokenProvider;

  const middleware: Middleware = {
    async onRequest({ request }) {
      if (!request.headers.has(CORRELATION_HEADER)) {
        request.headers.set(CORRELATION_HEADER, correlationIdFactory());
      }
      // Authenticate live requests with the current session bearer.
      // A caller-set Authorization header is never overwritten; an
      // absent/empty token leaves the request unauthenticated so the
      // backend answers 401 and the session flow shows auth-required.
      if (authTokenProvider && !request.headers.has("Authorization")) {
        const token = authTokenProvider();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return request;
    },
    async onResponse({ response, request }) {
      if (response.ok) return response;
      throw await parseErrorResponse(response, request.url);
    },
  };

  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);

  // Wrap fetch so a default timeout is applied when the caller does not
  // pass its own AbortSignal. Custom signals take priority and remain
  // composable with `AbortSignal.any`.
  const fetchWithTimeout: typeof fetch = async (input, init) => {
    if (init?.signal || defaultTimeoutMs <= 0) {
      return fetchImpl(input, init);
    }
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new ApiError({
        status: 0,
        code: "REQUEST_TIMEOUT",
        message: `Request timed out after ${defaultTimeoutMs}ms`,
        url: typeof input === "string" ? input : input.toString(),
      })),
      defaultTimeoutMs,
    );
    try {
      return await fetchImpl(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };

  const client = createClient<Paths>({
    baseUrl: options.baseUrl,
    fetch: fetchWithTimeout,
  });
  client.use(middleware);
  return client;
}
