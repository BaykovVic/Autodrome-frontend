/**
 * Console-shaped autodrome geometry view-model.
 *
 * Surfaces canonical `autodrome-geometry-service` v1:
 *   - Geometry entries (`GET /geometry`).
 *   - Snapshot read (`GET /geometry/versions/{versionId}`).
 *
 * Per spec rule "Не смешиваем справочники, геометрию и
 * расписание в один доменный API": этот workspace scoped
 * только на autodrome-geometry.
 */

export type ConsoleGeometryStatus =
  | "draft"
  | "published"
  | "archived";

export type ConsoleGeometryEntry = {
  geometryId: string;
  /** Operator-facing name e.g. "Main parking circuit". */
  name: string;
  status: ConsoleGeometryStatus;
  statusLabel: string;
  version: number;
  publishedAt?: string;
  checksumShort: string;
};

export type ConsoleGeometrySnapshot = {
  entries: ConsoleGeometryEntry[];
  degradedNote?: string;
};

export const GEOMETRY_STATUS_LABELS: Record<
  ConsoleGeometryStatus,
  string
> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};
