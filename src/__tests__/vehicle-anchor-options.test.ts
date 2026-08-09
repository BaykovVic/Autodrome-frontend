import { describe, expect, it, vi } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import { isUuid } from "@/app/(shell)/devices/_components/androidAssignmentHelpers";
import {
  liveVehicleAnchorOptions,
  MOCK_VEHICLE_LIFECYCLE_UNKNOWN,
  mapConsoleVehicleToAnchorOption,
  mapVehicleDtoToAnchorOption,
  mockVehicleAnchorId,
  mockVehicleAnchorOptions,
  vehicleAnchorLabel,
} from "@/app/(shell)/devices/_components/vehicleAnchorOptions";
import type { components } from "@/contracts/types/vehicle";

type VehicleDto = components["schemas"]["Vehicle"];

function vehicleDto(over: Partial<VehicleDto> = {}): VehicleDto {
  return {
    vehicleId: "11111111-1111-4111-8111-111111111111",
    plateNumber: "А 014 ТУ 199",
    type: "passenger",
    model: "Lada Vesta 2024",
    status: "active",
    createdAt: "2026-06-01T00:00:00Z",
    ...over,
  };
}

function vehicleApi(GET: unknown): AutodromeApi {
  return { vehicle: { GET } } as unknown as AutodromeApi;
}

describe("mapVehicleDtoToAnchorOption", () => {
  it("carries the canonical vehicleId through as the anchor value", () => {
    const option = mapVehicleDtoToAnchorOption(vehicleDto());
    expect(option.vehicleId).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(option.plateNumber).toBe("А 014 ТУ 199");
    expect(option.model).toBe("Lada Vesta 2024");
    expect(option.statusLabel).toBe("active");
    expect(option.bindable).toBe(true);
  });

  it("keeps a decommissioned vehicle listed but not bindable", () => {
    const option = mapVehicleDtoToAnchorOption(
      vehicleDto({ status: "decommissioned" }),
    );
    expect(option.bindable).toBe(false);
    expect(option.statusLabel).toBe("decommissioned");
  });

  it("treats maintenance and registered vehicles as bindable", () => {
    for (const status of ["maintenance", "registered"] as const) {
      expect(
        mapVehicleDtoToAnchorOption(vehicleDto({ status })).bindable,
      ).toBe(true);
    }
  });

  it("labels an option by what the operator recognises", () => {
    expect(vehicleAnchorLabel(mapVehicleDtoToAnchorOption(vehicleDto()))).toBe(
      "А 014 ТУ 199 · Lada Vesta 2024",
    );
  });
});

describe("liveVehicleAnchorOptions", () => {
  it("reads GET /vehicles and sorts options by plate number", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          vehicleDto({
            vehicleId: "22222222-2222-4222-8222-222222222222",
            plateNumber: "В 220 ТО 199",
          }),
          vehicleDto({ plateNumber: "А 014 ТУ 199" }),
        ],
      },
    }));
    const options = await liveVehicleAnchorOptions(vehicleApi(GET));
    expect(GET).toHaveBeenCalledWith("/vehicles", {});
    expect(options.map((o) => o.plateNumber)).toEqual([
      "А 014 ТУ 199",
      "В 220 ТО 199",
    ]);
  });

  it("returns an empty list for an empty page (no invented vehicles)", async () => {
    const options = await liveVehicleAnchorOptions(
      vehicleApi(vi.fn(async () => ({ data: { items: [] } }))),
    );
    expect(options).toEqual([]);
  });

  it("propagates ApiError so the picker can classify it", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 403,
        code: "FORBIDDEN",
        message: "FORBIDDEN",
        url: "/api/vehicle/v1/vehicles",
      });
    });
    await expect(
      liveVehicleAnchorOptions(vehicleApi(GET)),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("mockVehicleAnchorId", () => {
  it("produces a canonical UUID for a non-UUID fixture id", () => {
    expect(isUuid(mockVehicleAnchorId("VEH-01"))).toBe(true);
  });

  it("is deterministic for the same fixture id", () => {
    expect(mockVehicleAnchorId("VEH-01")).toBe(
      mockVehicleAnchorId("VEH-01"),
    );
  });

  it("distinguishes different fixture ids", () => {
    expect(mockVehicleAnchorId("VEH-01")).not.toBe(
      mockVehicleAnchorId("VEH-02"),
    );
  });

  it("passes an already-canonical UUID through untouched", () => {
    const uuid = "11111111-1111-4111-8111-111111111111";
    expect(mockVehicleAnchorId(uuid)).toBe(uuid);
  });
});

describe("mockVehicleAnchorOptions", () => {
  it("derives bindable, UUID-identified options from the vehicle fixtures", () => {
    const options = mockVehicleAnchorOptions("normal");
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => isUuid(o.vehicleId))).toBe(true);
    expect(
      options.every((o) => o.plateNumber.length > 0 && o.model.length > 0),
    ).toBe(true);
  });

  // Review finding LOW 1: the previous test here fed
  // `device.label: "decommissioned"` into the mapper — a value no
  // fixture produces — so it was green without covering anything.
  // What mock mode actually does is the assertion worth making.
  it("reports every fixture vehicle as bindable with an unknown lifecycle", () => {
    const options = mockVehicleAnchorOptions("normal");
    expect(options.every((o) => o.bindable)).toBe(true);
    expect(
      options.every(
        (o) => o.statusLabel === MOCK_VEHICLE_LIFECYCLE_UNKNOWN,
      ),
    ).toBe(true);
  });

  it("does not read vehicle lifecycle out of the device-health label", () => {
    const option = mapConsoleVehicleToAnchorOption({
      id: "VEH-99",
      model: "Lada Granta 2019",
      plate: "С 001 АА 199",
      category: "Cat B",
      // `offline` is a device-health state, not a decommissioned
      // vehicle — the mapper must not conflate the two.
      device: { state: "offline", label: "offline" },
      firmware: "—",
      lastSeen: "—",
      equipment: [],
    });
    expect(option.bindable).toBe(true);
    expect(option.statusLabel).toBe(MOCK_VEHICLE_LIFECYCLE_UNKNOWN);
  });

  it("keeps the not-bindable affordance reachable on the live path", () => {
    // The affordance mock cannot reach is exercised where it is real:
    // the canonical VehicleStatus from vehicle-service.
    expect(
      mapVehicleDtoToAnchorOption(vehicleDto({ status: "decommissioned" }))
        .bindable,
    ).toBe(false);
  });
});
