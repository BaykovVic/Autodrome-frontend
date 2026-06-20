import type { MockScenario } from "@/api/mock/scenarios";
import type { ServiceHealth } from "./serviceHealth";

const CHECK_TS = "2026-06-19T11:00:00Z";

const CANDIDATE: ServiceHealth = {
  id: "candidate-service",
  name: "Candidate service",
  kind: "backend",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const VEHICLE: ServiceHealth = {
  id: "vehicle-service",
  name: "Vehicle service",
  kind: "backend",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const EXAM: ServiceHealth = {
  id: "exam-service",
  name: "Exam service",
  kind: "backend",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const EXERCISE: ServiceHealth = {
  id: "exercise-service",
  name: "Exercise service",
  kind: "backend",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const VIOLATION_RULE: ServiceHealth = {
  id: "violation-rule-service",
  name: "Violation & rule service",
  kind: "backend",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const MEDIA_ARCHIVE: ServiceHealth = {
  id: "media-archive-service",
  name: "Media archive service",
  kind: "backend",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const EDGE_VEHICLE_GATEWAY: ServiceHealth = {
  id: "edge-vehicle-gateway",
  name: "On-board vehicle gateway",
  kind: "edge",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const EDGE_AUDIO_TRIGGER: ServiceHealth = {
  id: "edge-audio-trigger",
  name: "Cabin audio trigger",
  kind: "edge",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const DEPLOY_ORCHESTRATOR: ServiceHealth = {
  id: "deploy-orchestrator",
  name: "Local node orchestrator",
  kind: "deploy",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const DEPLOY_DB: ServiceHealth = {
  id: "deploy-database",
  name: "Local node database",
  kind: "deploy",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: CHECK_TS,
};

const ALL_HEALTHY: ServiceHealth[] = [
  CANDIDATE,
  VEHICLE,
  EXAM,
  EXERCISE,
  VIOLATION_RULE,
  MEDIA_ARCHIVE,
  EDGE_VEHICLE_GATEWAY,
  EDGE_AUDIO_TRIGGER,
  DEPLOY_ORCHESTRATOR,
  DEPLOY_DB,
];

function withStatus(
  service: ServiceHealth,
  patch: Partial<ServiceHealth>,
): ServiceHealth {
  return { ...service, ...patch };
}

export function serviceHealthFor(
  scenario: MockScenario,
): ServiceHealth[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [
        ...ALL_HEALTHY.filter((s) => s.id !== "edge-audio-trigger"),
        withStatus(EDGE_AUDIO_TRIGGER, {
          liveness: "healthy",
          readiness: "degraded",
          errorMessage:
            "Audio trigger reports stale calibration after restart.",
          correlationId: "00000000-0000-4000-8000-000000000aaa",
        }),
      ];
    case "violations-detected":
      return [
        ...ALL_HEALTHY.filter((s) => s.id !== "vehicle-service"),
        withStatus(VEHICLE, {
          liveness: "degraded",
          readiness: "degraded",
          errorMessage:
            "Telemetry intake lags behind the active exam stream.",
          correlationId: "00000000-0000-4000-8000-000000000bbb",
        }),
      ];
    case "service-degraded":
      return [
        ...ALL_HEALTHY.filter(
          (s) =>
            s.id !== "vehicle-service" &&
            s.id !== "edge-vehicle-gateway" &&
            s.id !== "media-archive-service",
        ),
        withStatus(VEHICLE, {
          liveness: "down",
          readiness: "down",
          errorMessage:
            "Service is not responding to probes for the last 90 seconds.",
          correlationId: "00000000-0000-4000-8000-000000000ccc",
        }),
        withStatus(EDGE_VEHICLE_GATEWAY, {
          liveness: "degraded",
          readiness: "degraded",
          errorMessage:
            "Upstream link is unstable; queued messages are growing.",
          correlationId: "00000000-0000-4000-8000-000000000ddd",
        }),
        withStatus(MEDIA_ARCHIVE, {
          liveness: "unknown",
          readiness: "unknown",
          errorMessage: "No probe data received yet.",
        }),
      ];
    case "normal":
    default:
      return ALL_HEALTHY;
  }
}
