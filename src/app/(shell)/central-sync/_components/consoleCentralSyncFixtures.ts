import type { MockScenario } from "@/api/mock/scenarios";

import {
  LICENSE_STATUS_LABELS,
  PACKAGE_TYPE_LABELS,
  type ConsoleCentralSyncSnapshot,
  type ConsoleSyncPackage,
} from "./consoleCentralSyncSnapshot";

const RECENT_PACKAGES: ConsoleSyncPackage[] = [
  {
    packageId: "70000000-0000-4000-8000-000000000001",
    type: "read_models",
    typeLabel: PACKAGE_TYPE_LABELS.read_models,
    schemaVersion: 3,
    checksumShort: "a1f4…9c20",
    createdAt: "2026-06-27T07:30:00Z",
  },
  {
    packageId: "70000000-0000-4000-8000-000000000002",
    type: "audit",
    typeLabel: PACKAGE_TYPE_LABELS.audit,
    schemaVersion: 1,
    checksumShort: "5b07…d11a",
    createdAt: "2026-06-27T07:35:00Z",
  },
];

const NORMAL: ConsoleCentralSyncSnapshot = {
  status: {
    enabled: true,
    pendingItems: 12,
    lastSuccessAt: "2026-06-27T07:00:00Z",
    licenseStatus: "valid",
    licenseStatusLabel: LICENSE_STATUS_LABELS.valid,
    licenseExpiresAt: "2026-12-31T23:59:59Z",
  },
  recentPackages: RECENT_PACKAGES,
  lastSyncJob: null,
};

const CENTRAL_UNAVAILABLE: ConsoleCentralSyncSnapshot = {
  status: {
    enabled: true,
    pendingItems: 47,
    lastSuccessAt: "2026-06-25T18:00:00Z",
    lastError: "Central contour unreachable (SYNC_CENTRAL_UNAVAILABLE).",
    licenseStatus: "grace",
    licenseStatusLabel: LICENSE_STATUS_LABELS.grace,
    licenseExpiresAt: "2026-06-26T18:00:00Z",
    offlineGraceUntil: "2026-07-03T18:00:00Z",
  },
  recentPackages: RECENT_PACKAGES,
  lastSyncJob: null,
  degradedNote:
    "Central contour unreachable; local node continues serving exams. Sync will retry automatically when central recovers.",
};

const DISABLED: ConsoleCentralSyncSnapshot = {
  status: {
    enabled: false,
    pendingItems: 0,
    lastSuccessAt: "—",
    licenseStatus: "unknown",
    licenseStatusLabel: LICENSE_STATUS_LABELS.unknown,
  },
  recentPackages: [],
  lastSyncJob: null,
  degradedNote:
    "Central sync is disabled on this node. Local operations are unaffected.",
};

export function centralSyncFor(
  scenario: MockScenario,
): ConsoleCentralSyncSnapshot {
  switch (scenario) {
    case "service-degraded":
      return CENTRAL_UNAVAILABLE;
    case "empty":
      return DISABLED;
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return NORMAL;
  }
}

export const __SYNC_FIXTURE_PACKAGE_IDS__ = RECENT_PACKAGES.map(
  (p) => p.packageId,
);
