import { describe, expect, it } from "vitest";

import {
  __VIRTUAL_VEHICLE_SCENARIOS_FIXTURE__,
  consoleVirtualVehicleScenariosFor,
} from "@/app/(shell)/virtual-vehicles/scenarios/_components/consoleVirtualVehicleScenariosFixtures";

describe("consoleVirtualVehicleScenariosFor: default scenario", () => {
  const snapshot = consoleVirtualVehicleScenariosFor("normal");

  it("covers all three canonical source types", () => {
    const sources = new Set(snapshot.scenarios.map((s) => s.source));
    expect(sources.has("simulator")).toBe(true);
    expect(sources.has("liteReplay")).toBe(true);
    expect(sources.has("fullReplay")).toBe(true);
  });

  it("covers all three canonical statuses", () => {
    const statuses = new Set(snapshot.scenarios.map((s) => s.status));
    expect(statuses.has("published")).toBe(true);
    expect(statuses.has("draft")).toBe(true);
    expect(statuses.has("archived")).toBe(true);
  });

  it("totals math is consistent", () => {
    expect(snapshot.totals.total).toBe(snapshot.scenarios.length);
    expect(snapshot.totals.published).toBe(
      snapshot.scenarios.filter((s) => s.status === "published").length,
    );
    expect(snapshot.totals.drafts).toBe(
      snapshot.scenarios.filter((s) => s.status === "draft").length,
    );
  });

  it("uses canonical source / yaw / coordinate frame strings only", () => {
    for (const s of snapshot.scenarios) {
      expect(["simulator", "liteReplay", "fullReplay"]).toContain(s.source);
      expect([
        "relative",
        "absolute",
        "compass",
        "unknown",
      ]).toContain(s.yawFrame);
      expect(["local", "world", "geo", "unknown"]).toContain(
        s.coordinateFrame,
      );
    }
  });

  it("legacy Lite and Full have distinct canonical source tokens", () => {
    const lite = snapshot.scenarios.find((s) => s.code === "SC-LITE-014");
    const full = snapshot.scenarios.find((s) => s.code === "SC-FULL-042");
    expect(lite?.source).toBe("liteReplay");
    expect(full?.source).toBe("fullReplay");
    expect(lite?.sourceLabel).toMatch(/Lite/i);
    expect(full?.sourceLabel).toMatch(/Full/i);
  });

  it("draft scenarios may carry unknown frames + '—' placeholder version", () => {
    const draft = snapshot.scenarios.find((s) => s.code === "SC-DRAFT-NEW");
    expect(draft?.status).toBe("draft");
    expect(draft?.version).toBe("—");
    expect(draft?.yawFrame).toBe("unknown");
    expect(draft?.coordinateFrame).toBe("unknown");
  });
});

describe("consoleVirtualVehicleScenariosFor: alternative scenarios", () => {
  it("empty scenario returns no items", () => {
    expect(consoleVirtualVehicleScenariosFor("empty").scenarios).toEqual(
      [],
    );
  });

  it("service-degraded scenario returns no items (mirrors future 503)", () => {
    expect(
      consoleVirtualVehicleScenariosFor("service-degraded").scenarios,
    ).toEqual([]);
  });

  it("exam-in-progress / violations-detected fall back to default seed", () => {
    expect(
      consoleVirtualVehicleScenariosFor("exam-in-progress").scenarios
        .length,
    ).toBe(__VIRTUAL_VEHICLE_SCENARIOS_FIXTURE__.length);
    expect(
      consoleVirtualVehicleScenariosFor("violations-detected").scenarios
        .length,
    ).toBe(__VIRTUAL_VEHICLE_SCENARIOS_FIXTURE__.length);
  });
});
