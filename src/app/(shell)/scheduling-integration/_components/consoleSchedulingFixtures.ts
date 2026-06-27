import type { MockScenario } from "@/api/mock/scenarios";

import {
  INTEGRATION_STATUS_LABELS,
  SCHEDULE_STATUS_LABELS,
  type ConsoleIntegrationEntry,
  type ConsoleSchedule,
  type ConsoleSchedulingSnapshot,
} from "./consoleSchedulingSnapshot";

const SCHEDULES: ConsoleSchedule[] = [
  {
    scheduleId: "a0000000-0000-4000-8000-000000000001",
    candidateRef: "CND-2026-0337",
    examRef: "EXM-2026-0337",
    startsAt: "2026-06-27T09:00:00Z",
    status: "scheduled",
    statusLabel: SCHEDULE_STATUS_LABELS.scheduled,
  },
  {
    scheduleId: "a0000000-0000-4000-8000-000000000002",
    candidateRef: "CND-2026-0338",
    examRef: "EXM-2026-0338",
    startsAt: "2026-06-27T10:00:00Z",
    status: "scheduled",
    statusLabel: SCHEDULE_STATUS_LABELS.scheduled,
  },
  {
    scheduleId: "a0000000-0000-4000-8000-000000000003",
    candidateRef: "CND-2026-0334",
    examRef: "EXM-2026-0334",
    startsAt: "2026-06-26T08:00:00Z",
    status: "completed",
    statusLabel: SCHEDULE_STATUS_LABELS.completed,
  },
  {
    scheduleId: "a0000000-0000-4000-8000-000000000004",
    candidateRef: "CND-2026-0335",
    examRef: "EXM-2026-0335",
    startsAt: "2026-06-26T11:00:00Z",
    status: "rescheduled",
    statusLabel: SCHEDULE_STATUS_LABELS.rescheduled,
  },
];

const INTEGRATIONS: ConsoleIntegrationEntry[] = [
  {
    integrationId: "b0000000-0000-4000-8000-000000000001",
    source: "RegistryGateway",
    status: "ok",
    statusLabel: INTEGRATION_STATUS_LABELS.ok,
    lastImportAt: "2026-06-27T07:30:00Z",
    pendingItems: 0,
  },
  {
    integrationId: "b0000000-0000-4000-8000-000000000002",
    source: "MunicipalIntake",
    status: "degraded",
    statusLabel: INTEGRATION_STATUS_LABELS.degraded,
    lastImportAt: "2026-06-26T15:00:00Z",
    lastError: "Source schema mismatch on field `examType`.",
    pendingItems: 4,
  },
];

const FAILED_INTEGRATIONS: ConsoleIntegrationEntry[] = [
  {
    integrationId: "b0000000-0000-4000-8000-000000000003",
    source: "FleetExport",
    status: "failed",
    statusLabel: INTEGRATION_STATUS_LABELS.failed,
    lastImportAt: "2026-06-26T18:00:00Z",
    lastError: "Source endpoint unreachable (timeout 30s).",
    pendingItems: 47,
  },
];

const NORMAL: ConsoleSchedulingSnapshot = {
  schedules: SCHEDULES,
  integrations: INTEGRATIONS,
};

const SERVICE_DEGRADED: ConsoleSchedulingSnapshot = {
  schedules: SCHEDULES.filter((s) => s.status !== "scheduled"),
  integrations: [...INTEGRATIONS, ...FAILED_INTEGRATIONS],
  degradedNote:
    "Scheduling integration service is degraded — some integrations are failed.",
};

const EMPTY: ConsoleSchedulingSnapshot = {
  schedules: [],
  integrations: [],
};

export function consoleSchedulingFor(
  scenario: MockScenario,
): ConsoleSchedulingSnapshot {
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
