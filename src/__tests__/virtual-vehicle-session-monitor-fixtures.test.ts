import { describe, expect, it } from "vitest";

import {
  __SESSION_MONITOR_FIXTURE_KEYS__,
  consoleVirtualVehicleSessionMonitorFor,
} from "@/app/(shell)/virtual-vehicles/sessions/_components/consoleVirtualVehicleSessionMonitorFixtures";

describe("consoleVirtualVehicleSessionMonitorFor: known session ids", () => {
  it("returns a running session monitor for VV-SIM-001", () => {
    const s = consoleVirtualVehicleSessionMonitorFor("VV-SIM-001");
    expect(s.state).toBe("running");
    expect(s.scenarioId).toBe("SC-CITY-A");
    expect(s.source).toBe("simulator");
    expect(s.runtimeCards.length).toBeGreaterThan(0);
    expect(s.events.length).toBeGreaterThan(0);
  });

  it("returns a paused session monitor for VV-REPLAY-014", () => {
    const s = consoleVirtualVehicleSessionMonitorFor("VV-REPLAY-014");
    expect(s.state).toBe("paused");
    expect(s.source).toBe("legacyReplay");
    // Paused event log includes a pause acknowledgement event.
    const kinds = s.events.map((e) => e.kind);
    expect(kinds).toContain("sessionPaused");
  });

  it("returns a degraded session monitor for VV-SIM-DEGRADED", () => {
    const s = consoleVirtualVehicleSessionMonitorFor("VV-SIM-DEGRADED");
    expect(s.state).toBe("degraded");
    // Degraded events list includes a degraded marker event.
    expect(
      s.events.some((e) => e.kind === "degraded"),
    ).toBe(true);
    // Runtime cards include a warning variant card.
    expect(s.runtimeCards.some((c) => c.variant === "warning")).toBe(true);
  });

  it("returns a stopped session monitor for VV-REPLAY-OLD", () => {
    const s = consoleVirtualVehicleSessionMonitorFor("VV-REPLAY-OLD");
    expect(s.state).toBe("stopped");
    const kinds = s.events.map((e) => e.kind);
    expect(kinds).toContain("sessionStopped");
  });

  it("returns an unknown stub for an unrecognised session id (no PII guesswork)", () => {
    const s = consoleVirtualVehicleSessionMonitorFor("VV-DOES-NOT-EXIST");
    expect(s.state).toBe("unknown");
    expect(s.runtimeCards).toEqual([]);
    expect(s.events).toEqual([]);
    // The supplied session id is echoed so the screen renders
    // something identifying without inventing data.
    expect(s.sessionId).toBe("VV-DOES-NOT-EXIST");
  });

  it("exposes the canonical fixture keys for cross-reference", () => {
    expect(__SESSION_MONITOR_FIXTURE_KEYS__).toEqual(
      expect.arrayContaining([
        "VV-SIM-001",
        "VV-REPLAY-014",
        "VV-SIM-DEGRADED",
        "VV-REPLAY-OLD",
      ]),
    );
  });

  it("event canonical kinds use camelCase backend tokens", () => {
    const allKinds = __SESSION_MONITOR_FIXTURE_KEYS__.flatMap((k) =>
      consoleVirtualVehicleSessionMonitorFor(k).events.map((e) => e.kind),
    );
    // No spaces / dashes — canonical token shape.
    for (const k of allKinds) {
      expect(k).toMatch(/^[a-z][a-zA-Z]*$/);
    }
  });
});
