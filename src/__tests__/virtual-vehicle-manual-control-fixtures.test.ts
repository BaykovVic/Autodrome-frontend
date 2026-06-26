import { describe, expect, it } from "vitest";

import {
  __MANUAL_CONTROL_FIXTURE_KEYS__,
  consoleVirtualVehicleManualControlFor,
} from "@/app/(shell)/virtual-vehicles/sessions/_components/manual-control/consoleVirtualVehicleManualControlFixtures";
import {
  SENSOR_LABELS,
  disabledReasonFor,
  manualControlsAllowed,
  type ConsoleManualControlSensor,
} from "@/app/(shell)/virtual-vehicles/sessions/_components/manual-control/consoleVirtualVehicleManualControlSnapshot";

describe("consoleVirtualVehicleManualControlFor: known session ids", () => {
  it("returns a running panel for VV-SIM-001 with all sensors enabled", () => {
    const p = consoleVirtualVehicleManualControlFor("VV-SIM-001");
    expect(p.sessionState).toBe("running");
    expect(manualControlsAllowed(p.sessionState)).toBe(true);
    expect(p.sensors.every((s) => s.enabled)).toBe(true);
    expect(p.speedKmh).toBeGreaterThanOrEqual(0);
    expect(p.speedKmh).toBeLessThanOrEqual(200);
    expect(p.steering).toBeGreaterThanOrEqual(-1);
    expect(p.steering).toBeLessThanOrEqual(1);
  });

  it("returns a paused panel for VV-REPLAY-014 with lanePerception disabled", () => {
    const p = consoleVirtualVehicleManualControlFor("VV-REPLAY-014");
    expect(p.sessionState).toBe("paused");
    expect(manualControlsAllowed(p.sessionState)).toBe(false);
    const lane = p.sensors.find((s) => s.sensor === "lanePerception");
    expect(lane?.enabled).toBe(false);
    expect(p.disabledReason).toBe(disabledReasonFor("paused"));
  });

  it("returns a degraded panel for VV-SIM-DEGRADED with lidar+gnss disabled", () => {
    const p = consoleVirtualVehicleManualControlFor("VV-SIM-DEGRADED");
    expect(p.sessionState).toBe("degraded");
    expect(manualControlsAllowed(p.sessionState)).toBe(false);
    expect(
      p.sensors.find((s) => s.sensor === "lidar")?.enabled,
    ).toBe(false);
    expect(
      p.sensors.find((s) => s.sensor === "gnss")?.enabled,
    ).toBe(false);
  });

  it("returns a stopped panel for VV-REPLAY-OLD with most sensors off", () => {
    const p = consoleVirtualVehicleManualControlFor("VV-REPLAY-OLD");
    expect(p.sessionState).toBe("stopped");
    expect(manualControlsAllowed(p.sessionState)).toBe(false);
    const offCount = p.sensors.filter((s) => !s.enabled).length;
    expect(offCount).toBeGreaterThanOrEqual(4);
  });

  it("returns an unknown stub for an unrecognised session id (no invented telemetry)", () => {
    const p = consoleVirtualVehicleManualControlFor("VV-DOES-NOT-EXIST");
    expect(p.sessionState).toBe("unknown");
    expect(p.sensors.every((s) => !s.enabled)).toBe(true);
    expect(p.speedKmh).toBe(0);
    expect(p.steering).toBe(0);
    expect(p.lastCommandAt).toBe("—");
    expect(p.sessionId).toBe("VV-DOES-NOT-EXIST");
  });

  it("exposes the canonical fixture keys", () => {
    expect(__MANUAL_CONTROL_FIXTURE_KEYS__).toEqual(
      expect.arrayContaining([
        "VV-SIM-001",
        "VV-REPLAY-014",
        "VV-SIM-DEGRADED",
        "VV-REPLAY-OLD",
      ]),
    );
  });

  it("sensor tokens are canonical camelCase, not raw bitmask numbers", () => {
    const tokens = (
      Object.keys(SENSOR_LABELS) as ConsoleManualControlSensor[]
    );
    for (const t of tokens) {
      expect(t).toMatch(/^[a-z][a-zA-Z]*$/);
    }
    for (const key of __MANUAL_CONTROL_FIXTURE_KEYS__) {
      const p = consoleVirtualVehicleManualControlFor(key);
      const seen = p.sensors.map((s) => s.sensor);
      expect(new Set(seen).size).toBe(seen.length);
      expect(seen.every((s) => tokens.includes(s))).toBe(true);
    }
  });

  it("disabledReason matches disabledReasonFor for non-running states", () => {
    for (const key of __MANUAL_CONTROL_FIXTURE_KEYS__) {
      const p = consoleVirtualVehicleManualControlFor(key);
      if (p.sessionState === "running") {
        expect(p.disabledReason).toBeUndefined();
      } else {
        expect(p.disabledReason).toBe(disabledReasonFor(p.sessionState));
      }
    }
  });
});
