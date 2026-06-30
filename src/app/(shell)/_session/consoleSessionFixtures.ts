import type { MockScenario } from "@/api/mock/scenarios";

import type {
  ConsoleSessionActor,
  ConsoleSessionResult,
} from "./consoleSession";

/**
 * Mock-first session fixtures.
 *
 * The default `normal` scenario authenticates an operator so the
 * existing console (dev + e2e run with `NEXT_PUBLIC_MOCK_SCENARIO=
 * normal`) renders exactly as before behind the session gate. The
 * `empty` scenario yields an unauthenticated session so the
 * auth-required state can be exercised without a backend.
 */

const OPERATOR_SESSION_ACTOR: ConsoleSessionActor = {
  actorId: "20000000-0000-4000-8000-000000000001",
  actorType: "user",
  label: "Anna Petrova",
  roles: ["admin", "techAdmin"],
  permissions: [
    "user.read",
    "user.assign",
    "role.read",
    "audit.read",
    "exam.read",
  ],
};

const AUTHENTICATED: ConsoleSessionResult = {
  status: "authenticated",
  actor: OPERATOR_SESSION_ACTOR,
};

const UNAUTHENTICATED: ConsoleSessionResult = {
  status: "unauthenticated",
  reason:
    "No active operator session. Sign in at the deploy layer to continue.",
};

export function consoleSessionFor(
  scenario: MockScenario,
): ConsoleSessionResult {
  switch (scenario) {
    case "empty":
      return UNAUTHENTICATED;
    case "service-degraded":
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return AUTHENTICATED;
  }
}

export const __SESSION_FIXTURE_ACTOR_ID__ = OPERATOR_SESSION_ACTOR.actorId;
