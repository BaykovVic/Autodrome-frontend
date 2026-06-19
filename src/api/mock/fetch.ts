import { selectFixtures } from "./fixtures";
import type { MockScenario } from "./scenarios";

type HandlerContext = {
  scenario: MockScenario;
  fixtures: ReturnType<typeof selectFixtures>;
};

type MockHandler = {
  method: "GET";
  pathPattern: RegExp;
  respond: (ctx: HandlerContext) => Response | Promise<Response>;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 400 ? "Mock Error" : "OK",
    headers: { "Content-Type": "application/json" },
  });
}

function errorEnvelope(
  status: number,
  code: string,
  message: string,
): Response {
  return json(status, {
    error: {
      code,
      message,
      timestamp: "2026-06-19T10:00:00Z",
    },
  });
}

const HANDLERS: MockHandler[] = [
  {
    method: "GET",
    pathPattern: /\/api\/candidate\/v1\/candidates\/?$/,
    respond: ({ fixtures }) =>
      json(200, { items: fixtures.candidates, nextPageToken: undefined }),
  },
  {
    method: "GET",
    pathPattern: /\/api\/vehicle\/v1\/vehicles\/?$/,
    respond: ({ scenario, fixtures }) => {
      if (scenario === "service-degraded") {
        return errorEnvelope(
          503,
          "SERVICE_DEGRADED",
          "vehicle-service is degraded in mock scenario",
        );
      }
      return json(200, {
        items: fixtures.vehicles,
        nextPageToken: undefined,
      });
    },
  },
  {
    method: "GET",
    pathPattern: /\/api\/exercise\/v1\/exercises\/?$/,
    respond: ({ fixtures }) =>
      json(200, { items: fixtures.exercises, nextPageToken: undefined }),
  },
  {
    method: "GET",
    pathPattern: /\/api\/violation-rule\/v1\/violations\/?$/,
    respond: ({ fixtures }) =>
      json(200, { items: fixtures.violations, nextPageToken: undefined }),
  },
  {
    method: "GET",
    pathPattern: /\/api\/violation-rule\/v1\/rules\/?$/,
    respond: ({ fixtures }) =>
      json(200, { items: fixtures.rules, nextPageToken: undefined }),
  },
];

function extractRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): { url: string; method: string } {
  if (input instanceof Request) {
    return { url: input.url, method: input.method.toUpperCase() };
  }
  const url =
    typeof input === "string" ? input : (input as URL).toString();
  const method = (init?.method ?? "GET").toUpperCase();
  return { url, method };
}

function pathOf(rawUrl: string): string {
  try {
    return new URL(rawUrl, "http://mock.local").pathname;
  } catch {
    return rawUrl;
  }
}

export function createMockFetch(scenario: MockScenario): typeof fetch {
  const ctx: HandlerContext = {
    scenario,
    fixtures: selectFixtures(scenario),
  };

  const mockFetch: typeof fetch = async (input, init) => {
    const { url, method } = extractRequest(input, init);
    const path = pathOf(url);

    for (const handler of HANDLERS) {
      if (handler.method !== method) continue;
      if (handler.pathPattern.test(path)) {
        return handler.respond(ctx);
      }
    }

    return errorEnvelope(
      404,
      "MOCK_HANDLER_NOT_FOUND",
      `No mock handler for ${method} ${path}`,
    );
  };

  return mockFetch;
}
