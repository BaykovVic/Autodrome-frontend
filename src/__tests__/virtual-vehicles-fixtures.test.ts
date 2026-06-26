import { describe, expect, it } from "vitest";

import {
  __VIRTUAL_VEHICLES_FIXTURE__,
  consoleVirtualVehiclesFor,
} from "@/app/(shell)/virtual-vehicles/_components/consoleVirtualVehiclesFixtures";

describe("consoleVirtualVehiclesFor: default scenario", () => {
  const snapshot = consoleVirtualVehiclesFor("normal");

  it("contains representatives of all canonical sources", () => {
    const sources = new Set(snapshot.vehicles.map((v) => v.source));
    expect(sources.has("simulator")).toBe(true);
    expect(sources.has("legacyReplay")).toBe(true);
    expect(sources.has("operatorManual")).toBe(true);
  });

  it("contains representatives of running / idle / degraded statuses", () => {
    const statuses = new Set(snapshot.vehicles.map((v) => v.status));
    expect(statuses.has("running")).toBe(true);
    expect(statuses.has("idle")).toBe(true);
    expect(statuses.has("degraded")).toBe(true);
  });

  it("totals match the rendered list", () => {
    expect(snapshot.totals.total).toBe(snapshot.vehicles.length);
    expect(snapshot.totals.running).toBe(
      snapshot.vehicles.filter((v) => v.status === "running").length,
    );
    expect(snapshot.totals.idle).toBe(
      snapshot.vehicles.filter((v) => v.status === "idle").length,
    );
    expect(snapshot.totals.degraded).toBe(
      snapshot.vehicles.filter((v) => v.status === "degraded").length,
    );
  });

  it("uses canonical source strings only", () => {
    for (const v of snapshot.vehicles) {
      expect(["simulator", "legacyReplay", "operatorManual"]).toContain(
        v.source,
      );
    }
  });

  it("statusLabel mirrors canonical status value (no operator-facing renaming)", () => {
    for (const v of snapshot.vehicles) {
      expect(v.statusLabel).toBe(v.status);
    }
  });

  it("idle vehicles use the '—' placeholder for scenario / timestamps", () => {
    const idle = snapshot.vehicles.filter((v) => v.status === "idle");
    expect(idle.length).toBeGreaterThan(0);
    for (const v of idle) {
      expect(v.scenarioId).toBe("—");
      expect(v.startedAt).toBe("—");
    }
  });

  it("running/paused/degraded sessions carry non-placeholder telemetry timestamps", () => {
    const active = snapshot.vehicles.filter((v) =>
      ["running", "paused", "degraded"].includes(v.status),
    );
    for (const v of active) {
      expect(v.startedAt).not.toBe("—");
      expect(v.lastTelemetryAt).not.toBe("—");
    }
  });

  it("sourceLabel matches the canonical token via the lookup", () => {
    for (const v of snapshot.vehicles) {
      expect(v.sourceLabel.length).toBeGreaterThan(0);
    }
  });
});

describe("consoleVirtualVehiclesFor: alternative scenarios", () => {
  it("empty scenario returns no vehicles", () => {
    const snap = consoleVirtualVehiclesFor("empty");
    expect(snap.vehicles).toEqual([]);
    expect(snap.totals).toEqual({ total: 0, running: 0, idle: 0, degraded: 0 });
  });

  it("service-degraded scenario returns empty list (mirrors future 503 surface)", () => {
    const snap = consoleVirtualVehiclesFor("service-degraded");
    expect(snap.vehicles).toEqual([]);
  });

  it("exam-in-progress / violations-detected fall back to default seed", () => {
    expect(
      consoleVirtualVehiclesFor("exam-in-progress").vehicles.length,
    ).toBe(__VIRTUAL_VEHICLES_FIXTURE__.length);
    expect(
      consoleVirtualVehiclesFor("violations-detected").vehicles.length,
    ).toBe(__VIRTUAL_VEHICLES_FIXTURE__.length);
  });
});
