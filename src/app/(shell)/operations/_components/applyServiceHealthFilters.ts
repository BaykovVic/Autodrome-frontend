import type {
  ServiceHealth,
  ServiceHealthStatus,
  ServiceKind,
} from "./serviceHealth";

export type ServiceHealthFilterState = {
  search: string;
  kind: ServiceKind | "any";
  liveness: ServiceHealthStatus | "any";
};

export const DEFAULT_FILTERS: ServiceHealthFilterState = {
  search: "",
  kind: "any",
  liveness: "any",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function applyServiceHealthFilters(
  services: ServiceHealth[],
  filters: ServiceHealthFilterState,
): ServiceHealth[] {
  const needle = normalize(filters.search);
  return services.filter((service) => {
    if (filters.kind !== "any" && service.kind !== filters.kind) {
      return false;
    }
    if (
      filters.liveness !== "any" &&
      service.liveness !== filters.liveness
    ) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [service.name, service.id, service.kind].join(" "),
    );
    return haystack.includes(needle);
  });
}
