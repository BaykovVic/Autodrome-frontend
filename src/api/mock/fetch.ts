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

let mockExamCounter = 0;
function mockExamId(): string {
  mockExamCounter += 1;
  const hex = mockExamCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8002-${hex}`;
}

const MOCK_EXAM_TIMESTAMPS = {
  startedAt: "2026-06-19T10:30:00Z",
  finishedAt: "2026-06-19T11:15:00Z",
  abortedAt: "2026-06-19T10:45:00Z",
};

function extractExamId(path: string): string | null {
  const match = path.match(/\/api\/exam\/v1\/exams\/([^/]+)/);
  return match ? match[1] : null;
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
    method: "POST",
    pathPattern: /\/api\/exam\/v1\/exams\/?$/,
    respond: async (_ctx, request) => {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock exam creation expects JSON body",
        );
      }
      return json(201, {
        examId: mockExamId(),
        candidateRef: body.candidateRef,
        vehicleRef: body.vehicleRef,
        examType: body.examType,
        status: "scheduled",
        scheduledAt: body.scheduledAt,
        notes: body.notes,
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
  },
  {
    method: "POST",
    pathPattern: /\/api\/exam\/v1\/exams\/[^/]+\/start\/?$/,
    respond: async (_ctx, request) => {
      const examId = extractExamId(new URL(request.url).pathname) ?? "";
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        // Empty body is acceptable; openapi spec allows optional notes.
      }
      return json(200, {
        examId,
        status: "inProgress",
        startedAt: MOCK_EXAM_TIMESTAMPS.startedAt,
        notes: body.notes,
      });
    },
  },
  {
    method: "POST",
    pathPattern: /\/api\/exam\/v1\/exams\/[^/]+\/finish\/?$/,
    respond: async (_ctx, request) => {
      const examId = extractExamId(new URL(request.url).pathname) ?? "";
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock exam finish expects JSON body",
        );
      }
      return json(200, {
        examId,
        status: "finished",
        finishedAt: MOCK_EXAM_TIMESTAMPS.finishedAt,
        outcome: body.outcome,
        score: body.score,
        notes: body.notes,
      });
    },
  },
  {
    method: "POST",
    pathPattern: /\/api\/exam\/v1\/exams\/[^/]+\/abort\/?$/,
    respond: async (_ctx, request) => {
      const examId = extractExamId(new URL(request.url).pathname) ?? "";
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock exam abort expects JSON body",
        );
      }
      return json(200, {
        examId,
        status: "aborted",
        finishedAt: MOCK_EXAM_TIMESTAMPS.abortedAt,
        notes: body.reason,
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
