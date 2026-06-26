import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import { liveVirtualVehiclesLoader } from "@/app/(shell)/virtual-vehicles/_components/liveVirtualVehiclesLoader";
import { liveVirtualVehicleScenariosLoader } from "@/app/(shell)/virtual-vehicles/scenarios/_components/liveVirtualVehicleScenariosLoader";
import { liveVirtualVehicleSessionMonitorLoader } from "@/app/(shell)/virtual-vehicles/sessions/_components/liveVirtualVehicleSessionMonitorLoader";

function makeApi(
  virtualVehicle: Partial<AutodromeApi["virtualVehicle"]>,
): AutodromeApi {
  return { virtualVehicle } as unknown as AutodromeApi;
}

describe("liveVirtualVehiclesLoader (list)", () => {
  it("returns snapshot with totals and mapped vehicles", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          {
            virtualVehicleId: "v-1",
            displayName: "Sim agent #1",
            status: "running",
            simulatorSource: "webVirtual",
            compatibilityProfile: "webAndRpi",
            currentScenarioId: "s-1",
            createdAt: "2026-06-25T10:00:00Z",
            updatedAt: "2026-06-25T10:34:00Z",
          },
          {
            virtualVehicleId: "v-2",
            displayName: "Replay #14",
            status: "paused",
            simulatorSource: "importedLegacy",
            compatibilityProfile: "webAndRpi",
            createdAt: "2026-06-25T07:00:00Z",
            updatedAt: "2026-06-25T08:00:00Z",
          },
          {
            virtualVehicleId: "v-3",
            displayName: "Slow sim",
            status: "failed",
            simulatorSource: "webVirtual",
            compatibilityProfile: "webAndRpi",
            createdAt: "2026-06-25T09:00:00Z",
          },
          {
            virtualVehicleId: "v-4",
            displayName: "Idle agent",
            status: "ready",
            simulatorSource: "webVirtual",
            compatibilityProfile: "webAndRpi",
            createdAt: "2026-06-25T09:00:00Z",
          },
        ],
      },
    }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["virtualVehicle"]["GET"],
    });

    const snapshot = await liveVirtualVehiclesLoader(api);
    expect(GET).toHaveBeenCalledWith("/virtual-vehicles", {});
    expect(snapshot.totals).toEqual({
      total: 4,
      running: 1,
      idle: 1,
      degraded: 1,
    });
    expect(snapshot.vehicles.map((v) => v.id)).toEqual([
      "v-1",
      "v-2",
      "v-3",
      "v-4",
    ]);
    expect(snapshot.vehicles[0]!.source).toBe("simulator");
    expect(snapshot.vehicles[1]!.source).toBe("legacyReplay");
    expect(snapshot.vehicles[2]!.status).toBe("degraded");
  });

  it("returns empty snapshot for empty page", async () => {
    const GET = vi.fn(async () => ({ data: { items: [] } }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["virtualVehicle"]["GET"],
    });
    const snapshot = await liveVirtualVehiclesLoader(api);
    expect(snapshot.totals).toEqual({
      total: 0,
      running: 0,
      idle: 0,
      degraded: 0,
    });
    expect(snapshot.vehicles).toEqual([]);
  });

  it("propagates ApiError thrown by the underlying client", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 503,
        url: "/virtual-vehicles",
        code: "VIRTUAL_VEHICLE_NOT_IMPLEMENTED",
        message:
          "Virtual vehicle service is not yet implemented on this environment.",
      });
    });
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["virtualVehicle"]["GET"],
    });
    await expect(liveVirtualVehiclesLoader(api)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("liveVirtualVehicleScenariosLoader (catalog)", () => {
  it("maps backend scenarios to canonical console scenarios", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          {
            scenarioId: "s-1",
            name: "Generated sim",
            type: "generated",
            source: "web",
            compatibilityProfile: "webAndRpi",
            coordinateFrame: "legacyXY",
            yawProfile: "normalized",
            initialState: { position: { x: 0, y: 0 }, yaw: 0 },
            createdAt: "2026-06-25T10:00:00Z",
            updatedAt: "2026-06-25T10:34:00Z",
          },
          {
            scenarioId: "s-2",
            name: "Lite replay",
            type: "replay",
            source: "legacyLiteReplay",
            compatibilityProfile: "webAndRpi",
            coordinateFrame: "normalizedXY",
            yawProfile: "liteDirectYaw",
            initialState: { position: { x: 0, y: 0 }, yaw: 0 },
            createdAt: "2026-06-25T10:00:00Z",
          },
          {
            scenarioId: "s-3",
            name: "Full replay",
            type: "replay",
            source: "legacyFullTrajectory",
            compatibilityProfile: "webAndRpi",
            coordinateFrame: "geodeticWgs84",
            yawProfile: "tcpGsofYaw",
            initialState: { position: { x: 0, y: 0 }, yaw: 0 },
            createdAt: "2026-06-25T10:00:00Z",
          },
        ],
      },
    }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["virtualVehicle"]["GET"],
    });
    const snapshot = await liveVirtualVehicleScenariosLoader(api);
    expect(GET).toHaveBeenCalledWith("/scenarios", {});
    expect(snapshot.totals.total).toBe(3);
    expect(snapshot.totals.published).toBe(3);
    expect(snapshot.scenarios.map((s) => s.source)).toEqual([
      "simulator",
      "liteReplay",
      "fullReplay",
    ]);
    expect(snapshot.scenarios.map((s) => s.coordinateFrame)).toEqual([
      "local",
      "world",
      "geo",
    ]);
    expect(snapshot.scenarios.map((s) => s.yawFrame)).toEqual([
      "relative",
      "absolute",
      "compass",
    ]);
  });
});

describe("liveVirtualVehicleSessionMonitorLoader", () => {
  it("returns unknown session when no parent vehicle holds the sessionId", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          {
            virtualVehicleId: "v-1",
            displayName: "Sim agent",
            status: "running",
            simulatorSource: "webVirtual",
            compatibilityProfile: "webAndRpi",
            currentSessionId: "other-session",
            createdAt: "2026-06-25T10:00:00Z",
          },
        ],
      },
    }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["virtualVehicle"]["GET"],
    });
    const monitor =
      await liveVirtualVehicleSessionMonitorLoader(api, "missing-id");
    expect(monitor.state).toBe("unknown");
    expect(monitor.events).toEqual([]);
    expect(monitor.runtimeCards).toEqual([]);
    expect(monitor.sessionId).toBe("missing-id");
  });

  it("returns running monitor when parent vehicle matches sessionId", async () => {
    const calls: Array<[string, unknown]> = [];
    const GET = vi.fn(async (path: string, params: unknown) => {
      calls.push([path, params]);
      if (path === "/virtual-vehicles") {
        return {
          data: {
            items: [
              {
                virtualVehicleId: "v-1",
                displayName: "Sim agent #1",
                status: "running",
                simulatorSource: "webVirtual",
                compatibilityProfile: "webAndRpi",
                currentScenarioId: "s-1",
                currentSessionId: "S-1",
                currentPosition: { x: 1.5, y: -2 },
                speed: 4.2,
                yaw: 0.1571,
                gear: "drive",
                createdAt: "2026-06-25T10:00:00Z",
                updatedAt: "2026-06-25T10:34:00Z",
              },
            ],
          },
        };
      }
      return {
        data: {
          items: [
            {
              eventId: "e-1",
              sessionId: "S-1",
              type: "sessionStarted",
              occurredAt: "2026-06-25T10:00:00Z",
            },
            {
              eventId: "e-2",
              sessionId: "S-1",
              type: "telemetrySampleEmitted",
              occurredAt: "2026-06-25T10:34:00Z",
            },
          ],
        },
      };
    });
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["virtualVehicle"]["GET"],
    });
    const monitor = await liveVirtualVehicleSessionMonitorLoader(api, "S-1");
    expect(monitor.state).toBe("running");
    expect(monitor.sessionId).toBe("S-1");
    expect(monitor.vehicleLabel).toBe("Sim agent #1");
    expect(monitor.runtimeCards.length).toBeGreaterThan(0);
    expect(monitor.events.map((e) => e.kind)).toEqual([
      "sessionStarted",
      "telemetrySampleEmitted",
    ]);
    // Events call path was the canonical sub-route.
    expect(calls[1]?.[0]).toBe(
      "/virtual-vehicles/{virtualVehicleId}/sessions/{sessionId}/events",
    );
  });
});
