import { describe, expect, it } from "vitest";

import {
  __RUNTIME_PREVIEW_FIXTURE_KEYS__,
  consoleVirtualVehicleRuntimePreviewFor,
} from "@/app/(shell)/virtual-vehicles/sessions/_components/runtime-preview/consoleVirtualVehicleRuntimePreviewFixtures";
import {
  RUNTIME_SENSOR_LABELS,
  formatPose,
  formatYawDegrees,
  runtimePreviewReasonFor,
  type ConsoleRuntimeSensor,
} from "@/app/(shell)/virtual-vehicles/sessions/_components/runtime-preview/consoleVirtualVehicleRuntimePreviewSnapshot";

describe("consoleVirtualVehicleRuntimePreviewFor: known sessions", () => {
  it("returns a running preview for VV-SIM-001 with simulator compatibility", () => {
    const p = consoleVirtualVehicleRuntimePreviewFor("VV-SIM-001");
    expect(p.state).toBe("running");
    expect(p.compatibility.source).toBe("simulator");
    expect(p.compatibility.yawFrame).toBe("relative");
    expect(p.compatibility.coordinateFrame).toBe("local");
    expect(p.sensors.every((s) => s.health === "ok")).toBe(true);
    expect(p.gear).toBe("drive");
    expect(p.reason).toBeUndefined();
  });

  it("returns a paused preview for VV-REPLAY-014 with fullReplay compatibility", () => {
    const p = consoleVirtualVehicleRuntimePreviewFor("VV-REPLAY-014");
    expect(p.state).toBe("paused");
    expect(p.compatibility.source).toBe("fullReplay");
    expect(p.gear).toBe("park");
    expect(
      p.sensors.find((s) => s.sensor === "lanePerception")?.health,
    ).toBe("offline");
    expect(p.reason).toBe(runtimePreviewReasonFor("paused"));
  });

  it("returns a degraded preview for VV-SIM-DEGRADED with liteReplay + compass yaw + geo frame", () => {
    const p = consoleVirtualVehicleRuntimePreviewFor("VV-SIM-DEGRADED");
    expect(p.state).toBe("degraded");
    expect(p.compatibility.source).toBe("liteReplay");
    expect(p.compatibility.yawFrame).toBe("compass");
    expect(p.compatibility.coordinateFrame).toBe("geo");
    expect(p.sensors.find((s) => s.sensor === "lidar")?.health).toBe(
      "offline",
    );
    expect(p.sensors.find((s) => s.sensor === "gnss")?.health).toBe(
      "degraded",
    );
  });

  it("returns a noRuntime preview for VV-REPLAY-OLD (all sensors offline, no captured timestamp)", () => {
    const p = consoleVirtualVehicleRuntimePreviewFor("VV-REPLAY-OLD");
    expect(p.state).toBe("noRuntime");
    expect(p.capturedAt).toBe("—");
    expect(p.sensors.every((s) => s.health === "offline")).toBe(true);
    expect(p.reason).toBe(runtimePreviewReasonFor("noRuntime"));
  });

  it("unknown session id → unknown stub без invented telemetry", () => {
    const p = consoleVirtualVehicleRuntimePreviewFor("VV-NOT-A-SESSION");
    expect(p.state).toBe("unknown");
    expect(p.sessionId).toBe("VV-NOT-A-SESSION");
    expect(p.capturedAt).toBe("—");
    expect(p.pose).toEqual({ x: 0, y: 0, yaw: 0 });
    expect(p.speedKmh).toBe(0);
    expect(p.gear).toBe("unknown");
  });

  it("exposes canonical fixture keys", () => {
    expect(__RUNTIME_PREVIEW_FIXTURE_KEYS__).toEqual(
      expect.arrayContaining([
        "VV-SIM-001",
        "VV-REPLAY-014",
        "VV-SIM-DEGRADED",
        "VV-REPLAY-OLD",
      ]),
    );
  });

  it("sensor tokens are canonical camelCase across all fixtures", () => {
    const tokens = (
      Object.keys(RUNTIME_SENSOR_LABELS) as ConsoleRuntimeSensor[]
    );
    for (const t of tokens) {
      expect(t).toMatch(/^[a-z][a-zA-Z]*$/);
    }
    for (const key of __RUNTIME_PREVIEW_FIXTURE_KEYS__) {
      const p = consoleVirtualVehicleRuntimePreviewFor(key);
      const seen = p.sensors.map((s) => s.sensor);
      expect(new Set(seen).size).toBe(seen.length);
      expect(seen.every((s) => tokens.includes(s))).toBe(true);
    }
  });

  it("formatYawDegrees converts radians to signed degrees", () => {
    expect(formatYawDegrees(0)).toBe("0.0°");
    expect(formatYawDegrees(Math.PI / 2)).toBe("+90.0°");
    expect(formatYawDegrees(-Math.PI / 4)).toBe("-45.0°");
  });

  it("formatPose renders metres with east/north labels", () => {
    expect(
      formatPose({ x: 42.18, y: -7.93, yaw: 0 }),
    ).toBe("42.18 m E, -7.93 m N");
  });
});
