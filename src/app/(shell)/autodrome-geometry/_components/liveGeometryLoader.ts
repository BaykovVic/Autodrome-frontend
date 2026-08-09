/**
 * Live geometry loader over canonical `autodrome-geometry-service` v1:
 * `GET /geometry` → `GeometryObjectsPage` (`items: GeometryObject[]`).
 *
 * A `GeometryObject` carries identity, type, name, srid, coordinates
 * and `createdAt` — it does NOT carry a publication status, version
 * number or checksum (those belong to `GeometryVersion`). Those
 * view-model fields therefore stay `null` in live mode and render as
 * "—" instead of a guessed "Published".
 *
 * Errors bubble up as `ApiError`; the screen classifies them through
 * the shared taxonomy (401 → session, 403 → forbidden, unreachable →
 * degraded).
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/autodrome-geometry";

import type {
  ConsoleGeometryEntry,
  ConsoleGeometrySnapshot,
} from "./consoleGeometrySnapshot";

type GeometryObjectsPageDto = components["schemas"]["GeometryObjectsPage"];
type GeometryObjectDto = components["schemas"]["GeometryObject"];

export function mapGeometryObject(
  dto: GeometryObjectDto,
): ConsoleGeometryEntry {
  return {
    geometryId: dto.geometryId,
    // Fall back to the canonical type when the object is unnamed —
    // both are backend-reported values, not invented ones.
    name: dto.name ?? dto.type,
    status: null,
    statusLabel: "—",
    version: null,
    publishedAt: undefined,
    checksumShort: null,
  };
}

export async function liveGeometryLoader(
  adapter: AutodromeApi,
): Promise<ConsoleGeometrySnapshot> {
  const result = await adapter.autodromeGeometry.GET("/geometry", {});
  const dto = result.data as GeometryObjectsPageDto | undefined;
  const entries = (dto?.items ?? []).map(mapGeometryObject);
  return {
    entries,
    degradedNote:
      entries.length > 0
        ? "Publication status, version and checksum are not part of the geometry object read model."
        : undefined,
  };
}
