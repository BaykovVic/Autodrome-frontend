import { describe, expect, it } from "vitest";

import {
  applyVehicleFilters,
  DEFAULT_FILTERS,
} from "@/app/(shell)/vehicles/_components/applyVehicleFilters";
import type { Vehicle } from "@/app/(shell)/vehicles/_components/useVehiclesData";

const RENAULT: Vehicle = {
  vehicleId: "v-1",
  plateNumber: "A123BC77",
  type: "passenger",
  model: "Renault Logan",
  manufactureYear: 2021,
  status: "active",
  createdAt: "2026-06-19T10:00:00Z",
};

const TRUCK: Vehicle = {
  vehicleId: "v-2",
  plateNumber: "T567FG77",
  type: "truck",
  model: "GAZon Next",
  vin: "VINTEST00123",
  status: "maintenance",
  createdAt: "2026-06-19T10:00:00Z",
};

const ALL = [RENAULT, TRUCK];

describe("applyVehicleFilters", () => {
  it("returns everything for default filters", () => {
    expect(applyVehicleFilters(ALL, DEFAULT_FILTERS)).toEqual(ALL);
  });

  it("filters by plate substring", () => {
    expect(
      applyVehicleFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "T567",
      }),
    ).toEqual([TRUCK]);
  });

  it("filters by VIN substring", () => {
    expect(
      applyVehicleFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "VINTEST",
      }),
    ).toEqual([TRUCK]);
  });

  it("filters by status", () => {
    expect(
      applyVehicleFilters(ALL, {
        ...DEFAULT_FILTERS,
        status: "active",
      }),
    ).toEqual([RENAULT]);
  });

  it("filters by type", () => {
    expect(
      applyVehicleFilters(ALL, {
        ...DEFAULT_FILTERS,
        type: "truck",
      }),
    ).toEqual([TRUCK]);
  });

  it("combines status and type", () => {
    expect(
      applyVehicleFilters(ALL, {
        search: "",
        status: "active",
        type: "truck",
      }),
    ).toEqual([]);
  });
});
