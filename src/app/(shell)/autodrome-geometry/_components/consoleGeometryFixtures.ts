import type { MockScenario } from "@/api/mock/scenarios";

import {
  GEOMETRY_STATUS_LABELS,
  type ConsoleGeometryEntry,
  type ConsoleGeometrySnapshot,
} from "./consoleGeometrySnapshot";

const BASE: ConsoleGeometryEntry[] = [
  {
    geometryId: "90000000-0000-4000-8000-000000000001",
    name: "Main parking circuit",
    status: "published",
    statusLabel: GEOMETRY_STATUS_LABELS.published,
    version: 5,
    publishedAt: "2026-06-15T09:00:00Z",
    checksumShort: "a1f4…9c20",
  },
  {
    geometryId: "90000000-0000-4000-8000-000000000002",
    name: "Reverse parking station",
    status: "published",
    statusLabel: GEOMETRY_STATUS_LABELS.published,
    version: 3,
    publishedAt: "2026-06-18T10:30:00Z",
    checksumShort: "5b07…d11a",
  },
  {
    geometryId: "90000000-0000-4000-8000-000000000003",
    name: "Highway merge mock",
    status: "draft",
    statusLabel: GEOMETRY_STATUS_LABELS.draft,
    version: 1,
    checksumShort: "8f23…91bc",
  },
  {
    geometryId: "90000000-0000-4000-8000-000000000004",
    name: "Legacy figure-eight",
    status: "archived",
    statusLabel: GEOMETRY_STATUS_LABELS.archived,
    version: 9,
    publishedAt: "2024-09-01T08:00:00Z",
    checksumShort: "44de…7720",
  },
];

const NORMAL: ConsoleGeometrySnapshot = {
  entries: BASE,
};

const SERVICE_DEGRADED: ConsoleGeometrySnapshot = {
  entries: BASE.filter((e) => e.status === "published"),
  degradedNote:
    "Autodrome geometry service is degraded — only published versions are reachable.",
};

const EMPTY: ConsoleGeometrySnapshot = {
  entries: [],
};

export function consoleGeometryFor(
  scenario: MockScenario,
): ConsoleGeometrySnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return NORMAL;
  }
}
