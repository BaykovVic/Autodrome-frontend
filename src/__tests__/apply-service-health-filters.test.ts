import { describe, expect, it } from "vitest";

import {
  applyServiceHealthFilters,
  DEFAULT_FILTERS,
} from "@/app/(shell)/operations/_components/applyServiceHealthFilters";
import type { ServiceHealth } from "@/app/(shell)/operations/_components/serviceHealth";

const BACKEND_HEALTHY: ServiceHealth = {
  id: "candidate-service",
  name: "Candidate service",
  kind: "backend",
  liveness: "healthy",
  readiness: "healthy",
  lastCheckAt: "2026-06-19T11:00:00Z",
};

const EDGE_DEGRADED: ServiceHealth = {
  id: "edge-vehicle-gateway",
  name: "On-board vehicle gateway",
  kind: "edge",
  liveness: "degraded",
  readiness: "degraded",
  lastCheckAt: "2026-06-19T11:00:00Z",
};

const DEPLOY_DOWN: ServiceHealth = {
  id: "deploy-orchestrator",
  name: "Local node orchestrator",
  kind: "deploy",
  liveness: "down",
  readiness: "down",
  lastCheckAt: "2026-06-19T11:00:00Z",
};

const ALL = [BACKEND_HEALTHY, EDGE_DEGRADED, DEPLOY_DOWN];

describe("applyServiceHealthFilters", () => {
  it("returns all by default", () => {
    expect(applyServiceHealthFilters(ALL, DEFAULT_FILTERS)).toEqual(
      ALL,
    );
  });

  it("filters by kind", () => {
    expect(
      applyServiceHealthFilters(ALL, {
        ...DEFAULT_FILTERS,
        kind: "edge",
      }),
    ).toEqual([EDGE_DEGRADED]);
  });

  it("filters by liveness", () => {
    expect(
      applyServiceHealthFilters(ALL, {
        ...DEFAULT_FILTERS,
        liveness: "down",
      }),
    ).toEqual([DEPLOY_DOWN]);
  });

  it("searches by service name", () => {
    expect(
      applyServiceHealthFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "orchestrator",
      }),
    ).toEqual([DEPLOY_DOWN]);
  });

  it("searches by service id substring", () => {
    expect(
      applyServiceHealthFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "candidate-",
      }),
    ).toEqual([BACKEND_HEALTHY]);
  });

  it("combines kind and liveness (no match)", () => {
    expect(
      applyServiceHealthFilters(ALL, {
        search: "",
        kind: "backend",
        liveness: "down",
      }),
    ).toEqual([]);
  });
});
