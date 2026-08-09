/**
 * Vehicle anchor options for the Android device assign dialog.
 *
 * The canonical `AndroidDeviceBinding.anchorId` is an opaque UUID
 * reference into the owning service. For the `vehicle` binding type
 * that owning service is `vehicle-service`, so the operator must pick
 * the target from the real vehicle registry instead of typing a UUID
 * by hand (a plate number is what an operator actually knows; the
 * UUID is an implementation detail of the reference).
 *
 * Two sources, one shape:
 *
 *   - live mode → `GET /vehicles` through the typed `vehicle-service`
 *     client (`adapter.vehicle`). Non-2xx throws an `ApiError` via the
 *     shared middleware, so the dialog surfaces it through the error
 *     taxonomy instead of rendering an empty picker that looks like
 *     "no vehicles exist".
 *   - mock mode → the existing vehicles-workspace fixtures. No network
 *     call is made in mock mode.
 *
 * Decommissioned vehicles stay in the list but are not bindable: the
 * operator sees why the vehicle they are looking for cannot be chosen
 * rather than the entry silently disappearing.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { MockScenario } from "@/api/mock/scenarios";
import type { components } from "@/contracts/types/vehicle";

import { consoleVehiclesFor } from "@/app/(shell)/vehicles/_components/consoleRegistryFixtures";
import type { ConsoleVehicle } from "@/app/(shell)/vehicles/_components/consoleRegistrySnapshot";
import { isUuid } from "./androidAssignmentHelpers";

type VehicleDto = components["schemas"]["Vehicle"];

export type VehicleAnchorOption = {
  /** Canonical `vehicleId` — used verbatim as the binding `anchorId`. */
  vehicleId: string;
  plateNumber: string;
  model: string;
  /** Canonical `VehicleStatus` (live) or fixture device label (mock). */
  statusLabel: string;
  /**
   * Whether the vehicle may be used as a binding anchor. Only
   * `decommissioned` vehicles are excluded — the backend owns the
   * final decision, this just avoids offering an obviously dead
   * target.
   */
  bindable: boolean;
};

/** Operator-facing option label: what the operator recognises. */
export function vehicleAnchorLabel(option: VehicleAnchorOption): string {
  return `${option.plateNumber} · ${option.model}`;
}

export function mapVehicleDtoToAnchorOption(
  dto: VehicleDto,
): VehicleAnchorOption {
  return {
    vehicleId: dto.vehicleId,
    plateNumber: dto.plateNumber,
    model: dto.model,
    statusLabel: dto.status,
    bindable: dto.status !== "decommissioned",
  };
}

function byPlate(a: VehicleAnchorOption, b: VehicleAnchorOption): number {
  return a.plateNumber.localeCompare(b.plateNumber);
}

/**
 * `GET /vehicles` → anchor options. Pagination is not followed: the
 * picker shows the first page, which matches what the vehicles
 * workspace itself renders today (see tech debt in the feature
 * report). An empty page yields an empty list — the dialog renders an
 * explicit "no vehicles" message, never a fixture.
 */
export async function liveVehicleAnchorOptions(
  adapter: AutodromeApi,
): Promise<VehicleAnchorOption[]> {
  const result = await adapter.vehicle.GET("/vehicles", {});
  const page = (result.data ?? { items: [] }) as { items?: VehicleDto[] };
  return (page.items ?? []).map(mapVehicleDtoToAnchorOption).sort(byPlate);
}

/**
 * Deterministic mock-only UUID for a fixture vehicle.
 *
 * The vehicles-workspace fixtures predate the canonical UUID contract
 * and identify vehicles by display ids (`VEH-01`). The assign dialog
 * validates `anchorId` as a canonical UUID (the live backend rejects
 * anything else), so mock options need a UUID-shaped identity or mock
 * mode would fail validation on values live mode accepts.
 *
 * FNV-1a over the fixture id, expanded to 32 hex digits with a
 * per-chunk counter, stamped with version `4` and variant `8`. Stable
 * across renders and runs — the same fixture always maps to the same
 * UUID. Mock-only: live ids come from `vehicle-service` untouched.
 */
export function mockVehicleAnchorId(fixtureId: string): string {
  if (isUuid(fixtureId)) return fixtureId;
  let hex = "";
  for (let chunk = 0; hex.length < 32; chunk += 1) {
    let hash = 0x811c9dc5;
    const seed = `${fixtureId}#${chunk}`;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    hex += hash.toString(16).padStart(8, "0");
  }
  const digits = hex.slice(0, 32).split("");
  digits[12] = "4";
  digits[16] = "8";
  const s = digits.join("");
  return [
    s.slice(0, 8),
    s.slice(8, 12),
    s.slice(12, 16),
    s.slice(16, 20),
    s.slice(20, 32),
  ].join("-");
}

export function mapConsoleVehicleToAnchorOption(
  vehicle: ConsoleVehicle,
): VehicleAnchorOption {
  return {
    vehicleId: mockVehicleAnchorId(vehicle.id),
    plateNumber: vehicle.plate,
    model: vehicle.model,
    statusLabel: vehicle.device.label,
    bindable: vehicle.device.label !== "decommissioned",
  };
}

/** Mock-mode options — fixtures only, no network call. */
export function mockVehicleAnchorOptions(
  scenario: MockScenario,
): VehicleAnchorOption[] {
  return consoleVehiclesFor(scenario)
    .vehicles.map(mapConsoleVehicleToAnchorOption)
    .sort(byPlate);
}
