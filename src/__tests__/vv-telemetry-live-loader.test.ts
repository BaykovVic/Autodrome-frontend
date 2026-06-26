import { describe, expect, it, vi } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import {
  liveVirtualVehicleRuntimePreviewLoader,
  mapTimelineToConsole,
} from "@/app/(shell)/virtual-vehicles/sessions/_components/runtime-preview/liveVirtualVehicleRuntimePreviewLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapTimelineToConsole", () => {
  it("empty samples → noRuntime state with suppressed pose", () => {
    const v = mapTimelineToConsole({
      telemetrySessionId: "S-1",
      vehicleId: "V-1",
      coordinateFrame: "legacyXY",
      sampleCount: 0,
      samples: [],
      gaps: [],
    });
    expect(v.state).toBe("noRuntime");
    expect(v.speedKmh).toBe(0);
    expect(v.capturedAt).toBe("—");
  });

  it("running session: latest sample produces pose + speed (m/s → km/h)", () => {
    const v = mapTimelineToConsole({
      telemetrySessionId: "S-1",
      vehicleId: "V-1",
      coordinateFrame: "legacyXY",
      sampleCount: 1,
      samples: [
        {
          sampleSequence: 7,
          capturedAt: "2026-06-26T10:00:00Z",
          signals: [
            { code: "positionX", value: 12.5 },
            { code: "positionY", value: -3.4 },
            { code: "yaw", value: 0.5 },
            { code: "speed", value: 10 }, // m/s
            { code: "gear", value: 0, unit: "drive" },
            { code: "cameraFront", value: 1, confidence: 0.9 },
            { code: "gnss", value: 0, confidence: 0.4 },
          ],
        },
      ],
      gaps: [],
    });
    expect(v.state).toBe("running");
    expect(v.pose).toEqual({ x: 12.5, y: -3.4, yaw: 0.5 });
    expect(v.speedKmh).toBeCloseTo(36, 1);
    expect(v.gear).toBe("drive");
    expect(v.sensors.find((s) => s.sensor === "cameraFront")?.health).toBe(
      "ok",
    );
    expect(v.sensors.find((s) => s.sensor === "gnss")?.health).toBe(
      "offline",
    );
    expect(v.compatibility.coordinateFrame).toBe("local");
  });

  it("gaps → degraded state with reason", () => {
    const v = mapTimelineToConsole({
      telemetrySessionId: "S-1",
      vehicleId: "V-1",
      coordinateFrame: "normalizedXY",
      sampleCount: 1,
      samples: [
        {
          sampleSequence: 7,
          capturedAt: "2026-06-26T10:00:00Z",
        },
      ],
      gaps: [
        {
          fromSequence: 0,
          toSequence: 5,
          reason: "Gateway offline",
          severity: "high",
        },
      ],
    });
    expect(v.state).toBe("degraded");
    expect(v.reason).toMatch(/runtime is degraded/i);
    expect(v.compatibility.coordinateFrame).toBe("world");
  });

  it("geodeticWgs84 coordinate frame → geo", () => {
    const v = mapTimelineToConsole({
      telemetrySessionId: "S-1",
      vehicleId: "V-1",
      coordinateFrame: "geodeticWgs84",
      sampleCount: 1,
      samples: [
        {
          sampleSequence: 1,
          capturedAt: "2026-06-26T10:00:00Z",
        },
      ],
      gaps: [],
    });
    expect(v.compatibility.coordinateFrame).toBe("geo");
  });

  it("sensors without signals fall back to offline health", () => {
    const v = mapTimelineToConsole({
      telemetrySessionId: "S-1",
      vehicleId: "V-1",
      coordinateFrame: "legacyXY",
      sampleCount: 1,
      samples: [
        {
          sampleSequence: 1,
          capturedAt: "2026-06-26T10:00:00Z",
          signals: [],
        },
      ],
      gaps: [],
    });
    expect(v.sensors.every((s) => s.health === "offline")).toBe(true);
  });
});

describe("liveVirtualVehicleRuntimePreviewLoader: integration", () => {
  it("calls /telemetry/sessions/{sessionId}/timeline and maps response", async () => {
    const GET = vi.fn(async () => ({
      data: {
        telemetrySessionId: "S-1",
        vehicleId: "V-1",
        coordinateFrame: "legacyXY",
        sampleCount: 1,
        samples: [
          {
            sampleSequence: 1,
            capturedAt: "2026-06-26T10:00:00Z",
            signals: [{ code: "speed", value: 5 }],
          },
        ],
        gaps: [],
      },
    }));
    const api = makeApi({
      vehicleTelemetry: {
        GET,
      } as unknown as AutodromeApi["vehicleTelemetry"],
    });
    const v = await liveVirtualVehicleRuntimePreviewLoader(api, "S-1");
    expect(GET).toHaveBeenCalledWith(
      "/telemetry/sessions/{sessionId}/timeline",
      { params: { path: { sessionId: "S-1" } } },
    );
    expect(v.state).toBe("running");
    expect(v.speedKmh).toBeCloseTo(18, 1);
  });

  it("returns unknown state when endpoint returns no body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      vehicleTelemetry: {
        GET,
      } as unknown as AutodromeApi["vehicleTelemetry"],
    });
    const v = await liveVirtualVehicleRuntimePreviewLoader(api, "S-X");
    expect(v.state).toBe("unknown");
    expect(v.sessionId).toBe("S-X");
  });
});
