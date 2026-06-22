import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";
import {
  liveVehiclesLoader,
  mapVehicleDtoToConsole,
  vehicleDeviceState,
} from "@/app/(shell)/vehicles/_components/liveVehiclesLoader";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/vehicle";

type VehicleDto = components["schemas"]["Vehicle"];

function makeDto(over: Partial<VehicleDto> = {}): VehicleDto {
  return {
    vehicleId: "00000000-0000-0000-0000-0000000000aa",
    plateNumber: "AA 100",
    type: "passenger",
    model: "Renault Logan",
    status: "active",
    createdAt: "2026-06-22T10:00:00Z",
    ...over,
  };
}

describe("liveVehiclesLoader: mappers (pure)", () => {
  it("maps an active passenger vehicle into a ConsoleVehicle", () => {
    const v = mapVehicleDtoToConsole(makeDto());
    expect(v.id).toBe("00000000-0000-0000-0000-0000000000aa");
    expect(v.plate).toBe("AA 100");
    expect(v.model).toBe("Renault Logan");
    expect(v.category).toBe("Cat B");
    expect(v.device.state).toBe("standby");
    expect(v.equipment).toEqual([]);
  });

  it("maps decommissioned vehicle to offline device state", () => {
    const v = mapVehicleDtoToConsole(makeDto({ status: "decommissioned" }));
    expect(v.device.state).toBe("offline");
    expect(v.device.label).toMatch(/decommissioned/i);
  });

  it("maps maintenance status to degraded device state", () => {
    const v = mapVehicleDtoToConsole(makeDto({ status: "maintenance" }));
    expect(v.device.state).toBe("degraded");
  });

  it("marks active vehicle with both bindings as online", () => {
    const v = mapVehicleDtoToConsole(
      makeDto({
        status: "active",
        boundEdgeGateway: {
          edgeGatewayId: "00000000-0000-0000-0000-000000000aa1",
        },
        boundDevice: {
          deviceId: "00000000-0000-0000-0000-000000000bb1",
        },
      }),
    );
    expect(v.device.state).toBe("online");
    expect(v.device.label).toMatch(/device bound/i);
  });

  it("marks partial binding as degraded", () => {
    const v = mapVehicleDtoToConsole(
      makeDto({
        status: "active",
        boundEdgeGateway: {
          edgeGatewayId: "00000000-0000-0000-0000-000000000aa1",
        },
      }),
    );
    expect(v.device.state).toBe("degraded");
    expect(v.device.label).toMatch(/partial binding/i);
  });

  it("maps vehicle types to operator categories", () => {
    expect(mapVehicleDtoToConsole(makeDto({ type: "motorcycle" })).category)
      .toBe("Cat A");
    expect(mapVehicleDtoToConsole(makeDto({ type: "truck" })).category)
      .toBe("Cat C");
    expect(mapVehicleDtoToConsole(makeDto({ type: "bus" })).category)
      .toBe("Cat D");
  });

  it("falls through helpers consistently for `vehicleDeviceState`", () => {
    expect(vehicleDeviceState(makeDto({ status: "active" })).state).toBe(
      "standby",
    );
    expect(vehicleDeviceState(makeDto({ status: "registered" })).state).toBe(
      "standby",
    );
  });
});

describe("liveVehiclesLoader: full loader (mocked client)", () => {
  function makeApi(
    handler: () => Promise<{
      data?: { items?: VehicleDto[] };
      error?: unknown;
    }> | { data?: { items?: VehicleDto[] }; error?: unknown },
  ): AutodromeApi {
    const stub = { GET: handler } as unknown as AutodromeApi["vehicle"];
    return { vehicle: stub } as unknown as AutodromeApi;
  }

  it("returns a snapshot with mapped vehicles and device-state totals", async () => {
    const api = makeApi(async () => ({
      data: {
        items: [
          makeDto({ vehicleId: "v-1", status: "active" }),
          makeDto({ vehicleId: "v-2", status: "maintenance" }),
          makeDto({ vehicleId: "v-3", status: "decommissioned" }),
        ],
      },
    }));
    const snapshot = await liveVehiclesLoader(api);
    expect(snapshot.totals.total).toBe(3);
    expect(snapshot.totals.degraded).toBe(1);
    expect(snapshot.totals.offline).toBe(1);
  });

  it("returns empty snapshot when the response has no items", async () => {
    const api = makeApi(async () => ({ data: { items: [] } }));
    const snapshot = await liveVehiclesLoader(api);
    expect(snapshot.totals.total).toBe(0);
    expect(snapshot.vehicles).toEqual([]);
  });

  it("propagates ApiError thrown by the client middleware", async () => {
    const api = makeApi(() => {
      throw new ApiError({
        status: 500,
        code: "HTTP_500",
        message: "vehicle-service offline",
        url: "/api/vehicle/v1/vehicles",
      });
    });
    await expect(liveVehiclesLoader(api)).rejects.toBeInstanceOf(ApiError);
  });
});
