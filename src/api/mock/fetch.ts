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

let mockExerciseCounter = 0;
function mockExerciseId(): string {
  mockExerciseCounter += 1;
  const hex = mockExerciseCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8003-${hex}`;
}

let mockExerciseVersionCounter = 0;
function mockExerciseVersionId(): string {
  mockExerciseVersionCounter += 1;
  const hex = mockExerciseVersionCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8004-${hex}`;
}

let mockExerciseGroupCounter = 0;
function mockExerciseGroupId(): string {
  mockExerciseGroupCounter += 1;
  const hex = mockExerciseGroupCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8005-${hex}`;
}

let mockViolationCounter = 0;
function mockViolationId(): string {
  mockViolationCounter += 1;
  const hex = mockViolationCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8006-${hex}`;
}

let mockRuleCounter = 0;
function mockRuleId(): string {
  mockRuleCounter += 1;
  const hex = mockRuleCounter.toString(16).padStart(12, "0");
  return `99000000-0000-4000-8007-${hex}`;
}

function extractRuleId(path: string): string | null {
  const match = path.match(/\/api\/violation-rule\/v1\/rules\/([^/]+)/);
  return match ? match[1] : null;
}

function extractExerciseId(path: string): string | null {
  const match = path.match(/\/api\/exercise\/v1\/exercises\/([^/]+)/);
  return match ? match[1] : null;
}

function extractExerciseVersionId(path: string): string | null {
  const match = path.match(
    /\/api\/exercise\/v1\/exercises\/[^/]+\/versions\/([^/]+)/,
  );
  return match ? match[1] : null;
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
    method: "POST",
    pathPattern: /\/api\/exercise\/v1\/exercises\/?$/,
    respond: async (_ctx, request) => {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock exercise creation expects JSON body",
        );
      }
      return json(201, {
        exerciseId: mockExerciseId(),
        code: body.code,
        title: body.title,
        description: body.description,
        status: "draft",
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
  },
  {
    method: "POST",
    pathPattern: /\/api\/exercise\/v1\/exercises\/[^/]+\/publish\/?$/,
    respond: async ({ fixtures }, request) => {
      const exerciseId =
        extractExerciseId(new URL(request.url).pathname) ?? "";
      try {
        // Validate body parses as JSON per ExerciseVersionDraft contract.
        // We do not forward draft fields into the response; canonical
        // OpenAPI publish returns Exercise, not the draft itself.
        await request.clone().json();
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock exercise publish expects JSON body",
        );
      }
      // Canonical OpenAPI says this endpoint returns a full `Exercise`
      // (required: exerciseId, code, title, status, createdAt). The mock
      // must mirror that shape so the workspace `patchExercise` merge
      // never loses required fields after publish. We look up the
      // previous fixture by id and preserve its identity fields.
      const previous = fixtures.exercises.find(
        (e) => e.exerciseId === exerciseId,
      );
      const nextVersion = {
        versionId: mockExerciseVersionId(),
        versionNumber: previous?.currentVersion?.versionNumber
          ? previous.currentVersion.versionNumber + 1
          : 1,
        publishedAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      };
      if (previous) {
        return json(200, {
          ...previous,
          status: "published",
          currentVersion: nextVersion,
          updatedAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
        });
      }
      // Fallback for ids not in fixtures (e.g. an exercise created in
      // the same session via mock POST). Still emit all required
      // `Exercise` fields with synthesized placeholders.
      return json(200, {
        exerciseId,
        code: `MOCK-${exerciseId.slice(-6).toUpperCase()}`,
        title: "Mock exercise",
        status: "published",
        currentVersion: nextVersion,
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
        updatedAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
  },
  {
    method: "GET",
    pathPattern:
      /\/api\/exercise\/v1\/exercises\/[^/]+\/versions\/[^/]+\/?$/,
    respond: async (_ctx, request) => {
      const url = new URL(request.url);
      const exerciseId = extractExerciseId(url.pathname) ?? "";
      const versionId = extractExerciseVersionId(url.pathname) ?? "";
      return json(200, {
        exerciseId,
        versionId,
        versionNumber: 1,
        rulesRefs: [],
        geometryRefs: [],
        errors: [],
        publishedAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
  },
  {
    method: "GET",
    pathPattern: /\/api\/exercise\/v1\/exercise-groups\/?$/,
    respond: ({ fixtures }) =>
      json(200, {
        items: fixtures.exerciseGroups,
        nextPageToken: undefined,
      }),
  },
  {
    method: "POST",
    pathPattern: /\/api\/exercise\/v1\/exercise-groups\/?$/,
    respond: async (_ctx, request) => {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock exercise group creation expects JSON body",
        );
      }
      return json(201, {
        groupId: mockExerciseGroupId(),
        title: body.title,
        exerciseOrder: body.exerciseOrder ?? [],
        categoryRefs: body.categoryRefs ?? [],
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
  },
  {
    method: "GET",
    pathPattern: /\/api\/violation-rule\/v1\/violations\/?$/,
    respond: ({ fixtures }) =>
      json(200, { items: fixtures.violations, nextPageToken: undefined }),
  },
  {
    method: "POST",
    pathPattern: /\/api\/violation-rule\/v1\/violations\/?$/,
    respond: async (_ctx, request) => {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock violation creation expects JSON body",
        );
      }
      // Canonical OpenAPI says POST /violations returns full `Violation`
      // (required: violationId, code, title, severity, createdAt).
      // The mock must mirror that shape so the workspace cannot drop
      // identity fields after submit — same lesson as the exercise R1
      // review (mock_full_contract_shape).
      return json(201, {
        violationId: mockViolationId(),
        code: body.code,
        title: body.title,
        description: body.description,
        severity: body.severity,
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
  },
  {
    method: "GET",
    pathPattern: /\/api\/violation-rule\/v1\/rules\/?$/,
    respond: ({ fixtures }) =>
      json(200, { items: fixtures.rules, nextPageToken: undefined }),
  },
  {
    method: "POST",
    pathPattern: /\/api\/violation-rule\/v1\/rules\/?$/,
    respond: async (_ctx, request) => {
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock rule draft creation expects JSON body",
        );
      }
      // Canonical OpenAPI says POST /rules returns full `RuleDefinition`.
      // Mock honours required fields: ruleId, violationRef, ruleVersion,
      // status, createdAt. Optional title/description/inputs/conditionTree/
      // actions echo through. Lesson applied from R1 exercise review
      // (mock_full_contract_shape).
      return json(201, {
        ruleId: mockRuleId(),
        violationRef: body.violationRef,
        title: body.title,
        description: body.description,
        ruleVersion: 1,
        status: "draft",
        inputs: body.inputs,
        conditionTree: body.conditionTree,
        actions: body.actions,
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
  },
  {
    method: "POST",
    pathPattern: /\/api\/violation-rule\/v1\/rules\/[^/]+\/publish\/?$/,
    respond: async ({ fixtures }, request) => {
      const ruleId = extractRuleId(new URL(request.url).pathname) ?? "";
      let body: Record<string, unknown> = {};
      try {
        body = (await request.clone().json()) as Record<string, unknown>;
      } catch {
        return errorEnvelope(
          400,
          "MOCK_INVALID_BODY",
          "Mock rule publish expects JSON body",
        );
      }
      // Look up previous rule in fixtures and return a full contract-
      // shaped `RuleDefinition` with required fields preserved
      // (ruleId, violationRef, ruleVersion, status, createdAt). The
      // publish increments ruleVersion. Optional condition/inputs/
      // actions come from the publish body.
      const previous = fixtures.rules.find((r) => r.ruleId === ruleId);
      if (previous) {
        return json(200, {
          ...previous,
          status: "published",
          ruleVersion: (previous.ruleVersion ?? 0) + 1,
          conditionTree: body.conditionTree,
          inputs: body.inputs ?? previous.inputs,
          actions: body.actions ?? previous.actions,
          publishedAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
          updatedAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
        });
      }
      // Fallback: rule not in fixtures (e.g. newly-created in the same
      // session via POST /rules). Still emit required fields.
      return json(200, {
        ruleId,
        violationRef: {
          violationId: "50000000-0000-4000-8000-000000000001",
        },
        ruleVersion: 1,
        status: "published",
        conditionTree: body.conditionTree,
        inputs: body.inputs,
        actions: body.actions,
        publishedAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
        createdAt: MOCK_REGISTER_RESPONSE_CREATED_AT,
      });
    },
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
