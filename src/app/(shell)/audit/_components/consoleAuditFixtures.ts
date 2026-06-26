import type { MockScenario } from "@/api/mock/scenarios";

import {
  AUDIT_EXPORT_FORMAT_LABELS,
  AUDIT_VERIFICATION_STATUS_LABELS,
  type ConsoleAuditEvent,
  type ConsoleAuditExport,
  type ConsoleAuditSnapshot,
  type ConsoleAuditVerification,
} from "./consoleAuditSnapshot";

function shortHash(full: string): string {
  if (full.length <= 12) return full;
  return `${full.slice(0, 4)}…${full.slice(-4)}`;
}

const BASE_EVENTS: ConsoleAuditEvent[] = [
  {
    eventId: "30000000-0000-4000-8000-000000000001",
    eventIdShort: "3000…0001",
    actorId: "20000000-0000-4000-8000-000000000001",
    action: "operator.login",
    subject: "session/login",
    occurredAt: "2026-06-26T08:00:00Z",
    payloadHashShort: shortHash(
      "a1f4d80e7c1e5a4e8c3d8b9b2a7c5e9d20b4f3a1c7e8d6b9f3a1c7e8d6b9f3a01",
    ),
    sequence: 101,
    recordedAt: "2026-06-26T08:00:00Z",
  },
  {
    eventId: "30000000-0000-4000-8000-000000000002",
    eventIdShort: "3000…0002",
    actorId: "20000000-0000-4000-8000-000000000001",
    action: "candidate.enroll",
    subject: "candidate/CND-2026-0337",
    occurredAt: "2026-06-26T08:14:42Z",
    payloadHashShort: shortHash(
      "5b07a8c1e3f4b9d20a1c7e8d6b9f3a1c7e8d6b9f3a1c7e8d6b9f3a1c7e8d6b9d11a",
    ),
    sequence: 102,
    recordedAt: "2026-06-26T08:14:42Z",
  },
  {
    eventId: "30000000-0000-4000-8000-000000000003",
    eventIdShort: "3000…0003",
    actorId: "20000000-0000-4000-8000-000000000002",
    action: "exam.start",
    subject: "exam/EXM-2026-0337",
    occurredAt: "2026-06-26T09:00:00Z",
    payloadHashShort: shortHash(
      "8f23b1c7e9d6a4f3e2b9c5d8a7e1f3b2c9d8a7e1f3b2c9d8a7e1f3b2c9d8a791bc",
    ),
    sequence: 103,
    recordedAt: "2026-06-26T09:00:00Z",
  },
  {
    eventId: "30000000-0000-4000-8000-000000000004",
    eventIdShort: "3000…0004",
    actorId: "20000000-0000-4000-8000-000000000004",
    action: "audit.export",
    subject: "export/EXP-2026-0337",
    occurredAt: "2026-06-26T09:30:00Z",
    payloadHashShort: shortHash(
      "44deabc1e7f3b2c9d8a7e1f3b2c9d8a7e1f3b2c9d8a7e1f3b2c9d8a7e1f37720",
    ),
    sequence: 104,
    recordedAt: "2026-06-26T09:30:00Z",
  },
];

const PASSED_VERIFICATION: ConsoleAuditVerification = {
  runId: "40000000-0000-4000-8000-000000000010",
  status: "passed",
  statusLabel: AUDIT_VERIFICATION_STATUS_LABELS.passed,
  checkedBlocks: 7,
  ranAt: "2026-06-26T09:35:00Z",
};

const FAILED_VERIFICATION: ConsoleAuditVerification = {
  runId: "40000000-0000-4000-8000-000000000011",
  status: "failed",
  statusLabel: AUDIT_VERIFICATION_STATUS_LABELS.failed,
  checkedBlocks: 4,
  firstErrorBlockId: "50000000-0000-4000-8000-000000000033",
  firstError: "blockHash mismatch at sequence 412",
  ranAt: "2026-06-26T09:35:00Z",
};

const RECENT_EXPORT: ConsoleAuditExport = {
  exportId: "60000000-0000-4000-8000-000000000020",
  format: "jsonl",
  formatLabel: AUDIT_EXPORT_FORMAT_LABELS.jsonl,
  eventCount: 4,
  occurredAtFrom: "2026-06-26T00:00:00Z",
  occurredAtTo: "2026-06-26T23:59:59Z",
  createdAt: "2026-06-26T09:30:00Z",
};

const NORMAL: ConsoleAuditSnapshot = {
  totals: { events: BASE_EVENTS.length, latestSequence: 104 },
  events: BASE_EVENTS,
  lastVerification: PASSED_VERIFICATION,
  lastExport: RECENT_EXPORT,
};

const VIOLATION_DETECTED: ConsoleAuditSnapshot = {
  totals: { events: BASE_EVENTS.length, latestSequence: 104 },
  events: BASE_EVENTS,
  lastVerification: FAILED_VERIFICATION,
  lastExport: RECENT_EXPORT,
};

const SERVICE_DEGRADED: ConsoleAuditSnapshot = {
  totals: { events: 0, latestSequence: 0 },
  events: [],
  degradedNote: "Audit service is degraded — no events reachable.",
};

const EMPTY: ConsoleAuditSnapshot = {
  totals: { events: 0, latestSequence: 0 },
  events: [],
};

export function consoleAuditFor(
  scenario: MockScenario,
): ConsoleAuditSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "violations-detected":
      return VIOLATION_DETECTED;
    case "normal":
    case "exam-in-progress":
    default:
      return NORMAL;
  }
}

export const __AUDIT_FIXTURE_EVENT_IDS__ = BASE_EVENTS.map(
  (e) => e.eventId,
);
