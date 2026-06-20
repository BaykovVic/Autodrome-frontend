import type {
  Vehicle,
  VehicleStatus,
  VehicleType,
} from "./useVehiclesData";

export type VehicleFilterState = {
  search: string;
  status: VehicleStatus | "any";
  type: VehicleType | "any";
};

export const DEFAULT_FILTERS: VehicleFilterState = {
  search: "",
  status: "any",
  type: "any",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function applyVehicleFilters(
  vehicles: Vehicle[],
  filters: VehicleFilterState,
): Vehicle[] {
  const needle = normalize(filters.search);
  return vehicles.filter((vehicle) => {
    if (filters.status !== "any" && vehicle.status !== filters.status) {
      return false;
    }
    if (filters.type !== "any" && vehicle.type !== filters.type) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [vehicle.plateNumber, vehicle.model, vehicle.vin ?? ""].join(" "),
    );
    return haystack.includes(needle);
  });
}
