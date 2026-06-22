import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  liveVehicleBindDevice,
  liveVehicleBindGateway,
  liveVehicleChangeStatus,
  liveVehicleGet,
  liveVehicleRegister,
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

function makeVehicleApi(
  vehicle: Partial<AutodromeApi["vehicle"]>,
): AutodromeApi {
  return { vehicle } as unknown as AutodromeApi;
}

describe("liveVehicleGet / liveVehicleRegister / liveVehicleChangeStatus / liveVehicleBindGateway / liveVehicleBindDevice", () => {
  it("GET /vehicles/{id}: passes path param and maps DTO", async () => {
    const dto = makeDto({ vehicleId: "v-X" });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeVehicleApi({
      GET: GET as unknown as AutodromeApi["vehicle"]["GET"],
    });

    const v = await liveVehicleGet(api, "v-X");

    expect(GET).toHaveBeenCalledWith("/vehicles/{vehicleId}", {
      params: { path: { vehicleId: "v-X" } },
    });
    expect(v.id).toBe("v-X");
  });

  it("GET /vehicles/{id}: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeVehicleApi({
      GET: GET as unknown as AutodromeApi["vehicle"]["GET"],
    });
    await expect(liveVehicleGet(api, "v-Z")).rejects.toThrow(/empty body/i);
  });

  it("POST /vehicles: attaches Idempotency-Key header and maps response", async () => {
    const created = makeDto({ vehicleId: "v-NEW-1" });
    const POST = vi.fn(async () => ({ data: created }));
    const api = makeVehicleApi({
      POST: POST as unknown as AutodromeApi["vehicle"]["POST"],
    });

    const registration: components["schemas"]["VehicleRegistration"] = {
      plateNumber: "AA 100",
      type: "passenger",
      model: "Renault Logan",
    };
    const v = await liveVehicleRegister(api, registration);

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: { "Idempotency-Key": string } };
        body: components["schemas"]["VehicleRegistration"];
      },
    ];
    expect(path).toBe("/vehicles");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(registration);
    expect(v.id).toBe("v-NEW-1");
  });

  it("POST /vehicles: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeVehicleApi({
      POST: POST as unknown as AutodromeApi["vehicle"]["POST"],
    });
    await expect(
      liveVehicleRegister(api, {
        plateNumber: "AA 100",
        type: "passenger",
        model: "Renault Logan",
      }),
    ).rejects.toThrow(/empty body/i);
  });

  it("POST /vehicles/{id}/status: forwards path, header, and body", async () => {
    const dto = makeDto({ vehicleId: "v-S", status: "maintenance" });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeVehicleApi({
      POST: POST as unknown as AutodromeApi["vehicle"]["POST"],
    });

    const v = await liveVehicleChangeStatus(api, "v-S", {
      targetStatus: "maintenance",
      reason: "scheduled",
    });

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { vehicleId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["VehicleStatusChange"];
      },
    ];
    expect(path).toBe("/vehicles/{vehicleId}/status");
    expect(opts.params.path.vehicleId).toBe("v-S");
    expect(opts.body.targetStatus).toBe("maintenance");
    expect(v.device.state).toBe("degraded");
  });

  it("POST /vehicles/{id}/bind-gateway: forwards path, header, and binding payload", async () => {
    const dto = makeDto({
      vehicleId: "v-G",
      status: "active",
      boundEdgeGateway: {
        edgeGatewayId: "gw-1",
      },
    });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeVehicleApi({
      POST: POST as unknown as AutodromeApi["vehicle"]["POST"],
    });

    const v = await liveVehicleBindGateway(api, "v-G", {
      edgeGatewayRef: { edgeGatewayId: "gw-1" },
    });

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { vehicleId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["EdgeGatewayBinding"];
      },
    ];
    expect(path).toBe("/vehicles/{vehicleId}/bind-gateway");
    expect(opts.params.path.vehicleId).toBe("v-G");
    expect(opts.body.edgeGatewayRef.edgeGatewayId).toBe("gw-1");
    expect(v.device.state).toBe("degraded");
  });

  it("POST /vehicles/{id}/bind-device: forwards path, header, and binding payload", async () => {
    const dto = makeDto({
      vehicleId: "v-D",
      status: "active",
      boundEdgeGateway: { edgeGatewayId: "gw-1" },
      boundDevice: { deviceId: "dev-1" },
    });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeVehicleApi({
      POST: POST as unknown as AutodromeApi["vehicle"]["POST"],
    });

    const v = await liveVehicleBindDevice(api, "v-D", {
      deviceRef: { deviceId: "dev-1" },
    });

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { vehicleId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["DeviceBinding"];
      },
    ];
    expect(path).toBe("/vehicles/{vehicleId}/bind-device");
    expect(opts.params.path.vehicleId).toBe("v-D");
    expect(opts.body.deviceRef.deviceId).toBe("dev-1");
    expect(v.device.state).toBe("online");
  });

  it("propagates ApiError from middleware on register", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 422,
        code: "VALIDATION",
        message: "invalid plate",
        url: "/api/vehicle/v1/vehicles",
      });
    });
    const api = makeVehicleApi({
      POST: POST as unknown as AutodromeApi["vehicle"]["POST"],
    });
    await expect(
      liveVehicleRegister(api, {
        plateNumber: "??",
        type: "passenger",
        model: "X",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("each register call uses a fresh Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({ data: makeDto() }));
    const api = makeVehicleApi({
      POST: POST as unknown as AutodromeApi["vehicle"]["POST"],
    });
    await liveVehicleRegister(api, {
      plateNumber: "AA 100",
      type: "passenger",
      model: "X",
    });
    await liveVehicleRegister(api, {
      plateNumber: "AA 101",
      type: "passenger",
      model: "X",
    });
    const [, opts1] = POST.mock.calls[0] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    const [, opts2] = POST.mock.calls[1] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    expect(opts1.params.header["Idempotency-Key"]).not.toBe(
      opts2.params.header["Idempotency-Key"],
    );
  });
});
