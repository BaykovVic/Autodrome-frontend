import type {
  EnrollmentSession,
  EnrollmentSessionScenario,
  EnrollmentSessionSnapshot,
  EnrollmentSessionState,
  EnrollmentSessionTimelineEntry,
} from "./consoleEnrollmentSession";

/**
 * Reference session id from the Web Operator Console design HTML.
 * Stable across scenarios so the operator can land here from a
 * single deeplink (`/candidates/sessions/ENR-9F41`).
 */
export const REFERENCE_SESSION_ID = "ENR-9F41";

const BASE_CANDIDATE = {
  candidate: "Irina Volkova",
  candidateId: "CND-2026-0144",
};

const BASE_CHANNEL = {
  channel: "registrar" as const,
  channelLabel: "Registrar tablet",
  targetDevice: "REG-TAB-02",
  deviceStation: "Station B · online",
};

const QUEUED_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "queued",
  state: "queued",
  label: "Command queued",
  note: "Queued to REG-TAB-02 from operator console",
  time: "09:40:51",
  tone: "standby",
};

const ACCEPTED_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "accepted",
  state: "accepted",
  label: "Registrar accepted",
  note: "REG-TAB-02 received the command",
  time: "09:41:02",
  tone: "online",
};

const CAPTURING_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "capturing",
  state: "capturing",
  label: "Capturing",
  note: "Candidate in capture window · 18 frames so far",
  time: "09:41:18",
  tone: "online",
};

const TTL_WARNING_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "ttl-warning",
  state: "ttl-warning",
  label: "TTL warning",
  note: "Less than a minute remaining — prompt candidate to stay still",
  time: "09:42:36",
  tone: "degraded",
};

const QUALITY_FAILED_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "quality-failed",
  state: "quality-failed",
  label: "Quality failed",
  note: "Best frame below threshold (motion). Operator can Retry.",
  time: "09:42:58",
  tone: "offline",
};

const FINALIZED_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "finalized",
  state: "finalized",
  label: "Finalized",
  note: "Template tpl-9 stored and sealed on NODE-A2",
  time: "09:43:21",
  tone: "online",
};

const EXPIRED_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "expired",
  state: "expired",
  label: "Expired",
  note: "TTL exhausted before a usable frame was captured",
  time: "09:44:00",
  tone: "offline",
};

const CANCELLED_ENTRY: EnrollmentSessionTimelineEntry = {
  id: "cancelled",
  state: "cancelled",
  label: "Cancelled",
  note: "Operator cancelled the session from the monitor",
  time: "09:43:05",
  tone: "offline",
};

const STATE_LABELS: Record<EnrollmentSessionState, string> = {
  queued: "Queued",
  accepted: "Accepted",
  capturing: "Capturing",
  "ttl-warning": "TTL warning",
  "quality-failed": "Quality failed",
  finalized: "Finalized",
  expired: "Expired",
  cancelled: "Cancelled",
};

function makeSession(
  state: EnrollmentSessionState,
  ttl: string,
  timeline: EnrollmentSessionTimelineEntry[],
  lastEventAt: string,
): EnrollmentSession {
  return {
    id: REFERENCE_SESSION_ID,
    state,
    stateLabel: STATE_LABELS[state],
    ttl,
    ...BASE_CANDIDATE,
    ...BASE_CHANNEL,
    lastEventAt,
    timeline,
  };
}

const SCENARIOS: Record<
  EnrollmentSessionScenario,
  EnrollmentSessionSnapshot
> = {
  queued: {
    scenario: "queued",
    session: makeSession("queued", "04:55", [QUEUED_ENTRY], "09:40:51"),
  },
  accepted: {
    scenario: "accepted",
    session: makeSession(
      "accepted",
      "04:42",
      [QUEUED_ENTRY, ACCEPTED_ENTRY],
      "09:41:02",
    ),
  },
  capturing: {
    scenario: "capturing",
    session: makeSession(
      "capturing",
      "02:43",
      [QUEUED_ENTRY, ACCEPTED_ENTRY, CAPTURING_ENTRY],
      "09:41:18",
    ),
  },
  "ttl-warning": {
    scenario: "ttl-warning",
    session: makeSession(
      "ttl-warning",
      "00:54",
      [QUEUED_ENTRY, ACCEPTED_ENTRY, CAPTURING_ENTRY, TTL_WARNING_ENTRY],
      "09:42:36",
    ),
  },
  "quality-failed": {
    scenario: "quality-failed",
    session: makeSession(
      "quality-failed",
      "00:12",
      [
        QUEUED_ENTRY,
        ACCEPTED_ENTRY,
        CAPTURING_ENTRY,
        TTL_WARNING_ENTRY,
        QUALITY_FAILED_ENTRY,
      ],
      "09:42:58",
    ),
  },
  finalized: {
    scenario: "finalized",
    session: makeSession(
      "finalized",
      "—",
      [QUEUED_ENTRY, ACCEPTED_ENTRY, CAPTURING_ENTRY, FINALIZED_ENTRY],
      "09:43:21",
    ),
  },
  expired: {
    scenario: "expired",
    session: makeSession(
      "expired",
      "—",
      [
        QUEUED_ENTRY,
        ACCEPTED_ENTRY,
        CAPTURING_ENTRY,
        TTL_WARNING_ENTRY,
        EXPIRED_ENTRY,
      ],
      "09:44:00",
    ),
  },
  cancelled: {
    scenario: "cancelled",
    session: makeSession(
      "cancelled",
      "—",
      [QUEUED_ENTRY, ACCEPTED_ENTRY, CAPTURING_ENTRY, CANCELLED_ENTRY],
      "09:43:05",
    ),
  },
};

export const ENROLLMENT_SESSION_SCENARIOS: readonly EnrollmentSessionScenario[] =
  [
    "queued",
    "accepted",
    "capturing",
    "ttl-warning",
    "quality-failed",
    "finalized",
    "expired",
    "cancelled",
  ] as const;

export function consoleEnrollmentSessionFor(
  scenario: EnrollmentSessionScenario,
): EnrollmentSessionSnapshot {
  return SCENARIOS[scenario];
}

export function isEnrollmentSessionScenario(
  value: unknown,
): value is EnrollmentSessionScenario {
  return (
    typeof value === "string" &&
    (ENROLLMENT_SESSION_SCENARIOS as readonly string[]).includes(value)
  );
}

/**
 * Build a synthetic "Retry queued" timeline entry to append when the
 * operator clicks Retry. The corresponding state transition (back to
 * `queued`) is owned by the screen component.
 */
export function retryAppendedTimeline(
  prev: EnrollmentSessionTimelineEntry[],
): EnrollmentSessionTimelineEntry[] {
  return [
    ...prev,
    {
      id: `retry-${prev.length}`,
      state: "queued",
      label: "Retry queued",
      note: "Operator re-sent the enrollment command from the monitor",
      time: "—",
      tone: "standby",
    },
  ];
}

/**
 * Build a synthetic "Cancelled" timeline entry to append when the
 * operator clicks Cancel.
 */
export function cancelAppendedTimeline(
  prev: EnrollmentSessionTimelineEntry[],
): EnrollmentSessionTimelineEntry[] {
  return [
    ...prev,
    {
      id: `cancel-${prev.length}`,
      state: "cancelled",
      label: "Cancelled",
      note: "Operator cancelled the session from the monitor",
      time: "—",
      tone: "offline",
    },
  ];
}
