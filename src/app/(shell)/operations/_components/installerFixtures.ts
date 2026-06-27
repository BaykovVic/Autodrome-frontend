import type { MockScenario } from "@/api/mock/scenarios";

import {
  INSTALLER_OVERALL_STATUS_LABELS,
  INSTALLER_PHASE_LABELS,
  type ConsoleInstallerSnapshot,
} from "./installerSnapshot";

const READY: ConsoleInstallerSnapshot = {
  phase: "installed",
  phaseLabel: INSTALLER_PHASE_LABELS.installed,
  version: "0.7.0",
  overallStatus: "healthy",
  overallStatusLabel: INSTALLER_OVERALL_STATUS_LABELS.healthy,
  prerequisites: [
    { name: "postgres", status: "healthy" },
    { name: "objectStorage", status: "healthy" },
    { name: "audit-service", status: "healthy" },
    { name: "media-archive-service", status: "healthy" },
  ],
  degradedReasons: [],
  checkedAt: "2026-06-27T08:00:00Z",
  lastUpdateJob: null,
};

const DEGRADED: ConsoleInstallerSnapshot = {
  phase: "installed",
  phaseLabel: INSTALLER_PHASE_LABELS.installed,
  version: "0.7.0",
  overallStatus: "degraded",
  overallStatusLabel: INSTALLER_OVERALL_STATUS_LABELS.degraded,
  prerequisites: [
    { name: "postgres", status: "healthy" },
    {
      name: "objectStorage",
      status: "degraded",
      reason: "Low free space (< 5GB) on data volume.",
    },
    { name: "audit-service", status: "healthy" },
    {
      name: "media-archive-service",
      status: "offline",
      reason: "Probe timed out (5s).",
    },
  ],
  degradedReasons: [
    "Object storage approaching capacity threshold.",
    "Media archive service unreachable on local node.",
  ],
  checkedAt: "2026-06-27T08:00:00Z",
  lastUpdateJob: null,
};

const NOT_INSTALLED: ConsoleInstallerSnapshot = {
  phase: "not_installed",
  phaseLabel: INSTALLER_PHASE_LABELS.not_installed,
  version: "—",
  overallStatus: "offline",
  overallStatusLabel: INSTALLER_OVERALL_STATUS_LABELS.offline,
  prerequisites: [
    { name: "postgres", status: "unknown", reason: "Not yet checked." },
    {
      name: "objectStorage",
      status: "unknown",
      reason: "Not yet checked.",
    },
  ],
  degradedReasons: ["Local node has not been installed yet."],
  checkedAt: "2026-06-27T08:00:00Z",
  lastUpdateJob: null,
};

export function installerFor(
  scenario: MockScenario,
): ConsoleInstallerSnapshot {
  switch (scenario) {
    case "service-degraded":
      return DEGRADED;
    case "empty":
      return NOT_INSTALLED;
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return READY;
  }
}
