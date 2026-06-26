import { describe, expect, it } from "vitest";

import {
  mapSimulatorSourceDtoToConsole,
  mapVirtualVehicleDtoToConsole,
  mapVirtualVehicleStatusDtoToConsole,
} from "@/app/(shell)/virtual-vehicles/_components/liveVirtualVehiclesLoader";
import {
  mapCoordinateFrameDtoToConsole,
  mapScenarioDtoToConsole,
  mapScenarioSourceDtoToConsole,
  mapYawProfileDtoToConsole,
} from "@/app/(shell)/virtual-vehicles/scenarios/_components/liveVirtualVehicleScenariosLoader";
import { mapSessionEventDtoToConsole } from "@/app/(shell)/virtual-vehicles/sessions/_components/liveVirtualVehicleSessionMonitorLoader";

describe("liveVirtualVehiclesLoader: status mapping", () => {
  it("maps backend statuses to console statuses", () => {
    expect(mapVirtualVehicleStatusDtoToConsole("running")).toBe("running");
    expect(mapVirtualVehicleStatusDtoToConsole("paused")).toBe("paused");
    expect(mapVirtualVehicleStatusDtoToConsole("stopped")).toBe("stopped");
    expect(mapVirtualVehicleStatusDtoToConsole("failed")).toBe("degraded");
    expect(mapVirtualVehicleStatusDtoToConsole("draft")).toBe("idle");
    expect(mapVirtualVehicleStatusDtoToConsole("ready")).toBe("idle");
  });

  it("maps simulator source to canonical console source", () => {
    expect(mapSimulatorSourceDtoToConsole("webVirtual")).toBe("simulator");
    expect(mapSimulatorSourceDtoToConsole("rpiHardware")).toBe("simulator");
    expect(mapSimulatorSourceDtoToConsole("importedLegacy")).toBe(
      "legacyReplay",
    );
  });

  it("maps a running VirtualVehicle DTO to a console snapshot row", () => {
    const dto = {
      virtualVehicleId: "11111111-1111-1111-1111-111111111111",
      displayName: "Sim agent #1",
      status: "running" as const,
      simulatorSource: "webVirtual" as const,
      compatibilityProfile: "webAndRpi" as const,
      currentScenarioId: "22222222-2222-2222-2222-222222222222",
      currentSessionId: "33333333-3333-3333-3333-333333333333",
      createdAt: "2026-06-25T10:00:00Z",
      updatedAt: "2026-06-25T10:34:00Z",
    };
    const v = mapVirtualVehicleDtoToConsole(dto);
    expect(v.id).toBe(dto.virtualVehicleId);
    expect(v.label).toBe(dto.displayName);
    expect(v.status).toBe("running");
    expect(v.statusLabel).toBe("running");
    expect(v.source).toBe("simulator");
    expect(v.sourceLabel).toBe("Simulator");
    expect(v.scenarioId).toBe(dto.currentScenarioId);
    expect(v.lastTelemetryAt).toBe(dto.updatedAt);
  });

  it("maps a failed DTO to degraded console status", () => {
    const dto = {
      virtualVehicleId: "11111111-1111-1111-1111-111111111111",
      displayName: "Sim agent · slow",
      status: "failed" as const,
      simulatorSource: "importedLegacy" as const,
      compatibilityProfile: "webAndRpi" as const,
      createdAt: "2026-06-25T10:00:00Z",
    };
    const v = mapVirtualVehicleDtoToConsole(dto);
    expect(v.status).toBe("degraded");
    expect(v.source).toBe("legacyReplay");
    expect(v.sourceLabel).toBe("Legacy replay");
    // No currentScenarioId → "—" placeholder kept.
    expect(v.scenarioId).toBe("—");
  });
});

describe("liveVirtualVehicleScenariosLoader: enum mapping", () => {
  it("maps backend scenario source enum to console tokens", () => {
    expect(mapScenarioSourceDtoToConsole("web")).toBe("simulator");
    expect(mapScenarioSourceDtoToConsole("legacyLiteReplay")).toBe(
      "liteReplay",
    );
    expect(mapScenarioSourceDtoToConsole("legacyFullTrajectory")).toBe(
      "fullReplay",
    );
  });

  it("maps backend coordinate frame enum to console tokens", () => {
    expect(mapCoordinateFrameDtoToConsole("legacyXY")).toBe("local");
    expect(mapCoordinateFrameDtoToConsole("normalizedXY")).toBe("world");
    expect(mapCoordinateFrameDtoToConsole("geodeticWgs84")).toBe("geo");
  });

  it("maps backend yaw profile to console yaw frame", () => {
    expect(mapYawProfileDtoToConsole("normalized")).toBe("relative");
    expect(mapYawProfileDtoToConsole("liteDirectYaw")).toBe("absolute");
    expect(mapYawProfileDtoToConsole("fullVehicleStateYaw")).toBe(
      "absolute",
    );
    expect(mapYawProfileDtoToConsole("tcpGsofYaw")).toBe("compass");
  });

  it("maps a full SimulatorScenario DTO to a console scenario", () => {
    const dto = {
      scenarioId: "22222222-2222-2222-2222-222222222222",
      name: "City circuit · A",
      type: "generated" as const,
      source: "web" as const,
      compatibilityProfile: "webAndRpi" as const,
      coordinateFrame: "legacyXY" as const,
      yawProfile: "normalized" as const,
      initialState: { position: { x: 0, y: 0 }, yaw: 0 },
      createdAt: "2026-06-25T10:00:00Z",
      updatedAt: "2026-06-25T10:34:00Z",
    };
    const s = mapScenarioDtoToConsole(dto);
    expect(s.id).toBe(dto.scenarioId);
    expect(s.source).toBe("simulator");
    expect(s.sourceLabel).toBe("Simulator");
    expect(s.coordinateFrame).toBe("local");
    expect(s.coordinateFrameLabel).toBe("Local");
    expect(s.yawFrame).toBe("relative");
    expect(s.status).toBe("published");
  });
});

describe("liveVirtualVehicleSessionMonitorLoader: event mapping", () => {
  it("maps sessionStarted event to canonical kind + info severity", () => {
    const e = mapSessionEventDtoToConsole({
      eventId: "44444444-4444-4444-4444-444444444444",
      sessionId: "33333333-3333-3333-3333-333333333333",
      type: "sessionStarted",
      occurredAt: "2026-06-25T10:00:00Z",
    });
    expect(e.kind).toBe("sessionStarted");
    expect(e.severity).toBe("info");
    expect(e.label).toBe("Session started");
  });

  it("maps sessionFailed event to error severity", () => {
    const e = mapSessionEventDtoToConsole({
      eventId: "44444444-4444-4444-4444-444444444444",
      sessionId: "33333333-3333-3333-3333-333333333333",
      type: "sessionFailed",
      occurredAt: "2026-06-25T10:34:00Z",
    });
    expect(e.severity).toBe("error");
  });

  it("maps telemetrySampleEmitted to telemetry severity (no spam in label)", () => {
    const e = mapSessionEventDtoToConsole({
      eventId: "44444444-4444-4444-4444-444444444444",
      sessionId: "33333333-3333-3333-3333-333333333333",
      type: "telemetrySampleEmitted",
      occurredAt: "2026-06-25T10:34:00Z",
    });
    expect(e.severity).toBe("telemetry");
    expect(e.kind).toBe("telemetrySampleEmitted");
  });

  it("renders Actor: {id} detail when actorId is present", () => {
    const e = mapSessionEventDtoToConsole({
      eventId: "44444444-4444-4444-4444-444444444444",
      sessionId: "33333333-3333-3333-3333-333333333333",
      type: "manualControlApplied",
      occurredAt: "2026-06-25T10:34:00Z",
      actor: {
        actorId: "operator-7",
        actorType: "user",
      },
    });
    expect(e.detail).toBe("Actor: operator-7");
  });

  it("falls back to '—' detail when no actor present", () => {
    const e = mapSessionEventDtoToConsole({
      eventId: "44444444-4444-4444-4444-444444444444",
      sessionId: "33333333-3333-3333-3333-333333333333",
      type: "sessionPaused",
      occurredAt: "2026-06-25T10:34:00Z",
    });
    expect(e.detail).toBe("—");
  });
});
