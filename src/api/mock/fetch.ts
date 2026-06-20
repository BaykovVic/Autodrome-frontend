import { selectFixtures } from "./fixtures";
import type { MockScenario } from "./scenarios";

type HandlerContext = {
  scenario: MockScenario;
  fixtures: ReturnType<typeof selectFixtures>;
};

type MockHandler = {
  method: "GET" | "POST";
  pathPattern: RegExp;
  respond: (
    ctx: HandlerContext,
    request: Request,
  ) => Response | Promise<Response>;
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

const MOCK_REGISTER_RESPONSE_CREATED_AT = "2026-06-19T10:00:00Z";
let mockCandidateCounter = 0;
function mockCandidateId(): string {
  mockCandidateCounter += 1;
  const hex = mockCandidateCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8000-${hex}`;
}

let mockVehicleCounter = 0;
function mockVehicleId(): string {
  mockVehicleCounter += 1;
  const hex = mockVehicleCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8001-${hex}`;
}

const HANDLERS: MockHandler[] = [
  {
    method: "GET",
    pathPattern: /\/api\/candidate\/v1\/candidates\/?$/,
    respond: ({ fixtures }) =>
      json(200, { items: fixtures.candidates, nextPageToken: undefined }),
  },
  {
    method: "POST",
    pathPattern: /\/api\/candidate\/v1\/candidates\/?$/,
    respond: async (_ctx, request) => {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock candidate registration expects JSON body",
        );
      }
      return json(201, {
        candidateId: mockCandidateId(),
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        birthDate: body.birthDate,
        identityDocument: body.identityDocument,
        externalRegistryId: body.externalRegistryId,
        status: "registered",
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
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
    method: "POST",
    pathPattern: /\/api\/vehicle\/v1\/vehicles\/?$/,
    respond: async (_ctx, request) => {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock vehicle registration expects JSON body",
        );
      }
      return json(201, {
        vehicleId: mockVehicleId(),
        plateNumber: body.plateNumber,
        type: body.type,
        model: body.model,
        manufactureYear: body.manufactureYear,
        vin: body.vin,
        status: "registered",
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
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

function toRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  if (input instanceof Request) return input;
  return new Request(
    typeof input === "string" ? input : (input as URL).toString(),
    init,
  );
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
    const request = toRequest(input, init);
    const method = request.method.toUpperCase();
    const path = pathOf(request.url);

    for (const handler of HANDLERS) {
      if (handler.method !== method) continue;
      if (handler.pathPattern.test(path)) {
        return handler.respond(ctx, request);
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
