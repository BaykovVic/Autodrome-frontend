import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleExam,
  ConsoleExamsSnapshot,
} from "./consoleExamsSnapshot";

const TIMELINE_IN_PROGRESS = [
  {
    id: "registered",
    label: "Candidate registered",
    detail: "Face verification passed (0.97)",
    time: "11:00:12",
    dot: "online" as const,
  },
  {
    id: "started",
    label: "Exam started",
    detail: "Route Slalom-B · vehicle VEH-01",
    time: "11:02:48",
    dot: "online" as const,
  },
  {
    id: "telemetry",
    label: "Telemetry stream live",
    detail: "GNSS lock, side cameras OK",
    time: "11:02:55",
    dot: "online" as const,
  },
  {
    id: "violation",
    label: "Minor: lane drift",
    detail: "Section 3 · auto-flagged · 1 pt",
    time: "11:08:14",
    dot: "degraded" as const,
  },
];

const TIMELINE_SCHEDULED = [
  {
    id: "created",
    label: "Exam created",
    detail: "Operator assigned vehicle VEH-02",
    time: "10:40:01",
    dot: "online" as const,
  },
  {
    id: "queued",
    label: "Queued for start",
    detail: "Waiting for proctor confirmation",
    time: "10:40:01",
    dot: "standby" as const,
  },
];

const TIMELINE_FINISHED = [
  {
    id: "started",
    label: "Exam started",
    detail: "Route City-A · vehicle VEH-12",
    time: "09:00:11",
    dot: "online" as const,
  },
  {
    id: "minor",
    label: "Minor: stop line",
    detail: "Section 2 · auto-flagged · 1 pt",
    time: "09:09:33",
    dot: "degraded" as const,
  },
  {
    id: "finished",
    label: "Exam finished",
    detail: "Score 4 · proctor confirmed pass",
    time: "09:23:40",
    dot: "online" as const,
  },
];

const TIMELINE_ABORTED = [
  {
    id: "started",
    label: "Exam started",
    detail: "Route Slalom-B · vehicle VEH-21",
    time: "08:14:02",
    dot: "online" as const,
  },
  {
    id: "device-fail",
    label: "Onboard device offline",
    detail: "VEH-21 stopped reporting telemetry",
    time: "08:18:51",
    dot: "offline" as const,
  },
  {
    id: "aborted",
    label: "Exam aborted",
    detail: "Reason: telemetry loss · operator override",
    time: "08:19:04",
    dot: "offline" as const,
  },
];

const EXM_IN_PROGRESS: ConsoleExam = {
  id: "EXM-0118",
  candidate: "A. Nikitin",
  vehicle: "VEH-01",
  route: "Slalom-B",
  state: "inProgress",
  stateLabel: "in progress",
  score: "—",
  started: "11:02:48",
  duration: "00:18:32",
  timeline: TIMELINE_IN_PROGRESS,
};

const EXM_SCHEDULED: ConsoleExam = {
  id: "EXM-0119",
  candidate: "M. Volkova",
  vehicle: "VEH-02",
  route: "City-A",
  state: "scheduled",
  stateLabel: "scheduled",
  score: "—",
  started: "—",
  duration: "—",
  timeline: TIMELINE_SCHEDULED,
};

const EXM_FINISHED: ConsoleExam = {
  id: "EXM-0117",
  candidate: "K. Lazareva",
  vehicle: "VEH-12",
  route: "City-A",
  state: "finished",
  stateLabel: "finished",
  score: "4 / 5",
  started: "09:00:11",
  duration: "00:23:29",
  timeline: TIMELINE_FINISHED,
};

const EXM_ABORTED: ConsoleExam = {
  id: "EXM-0116",
  candidate: "I. Pavlov",
  vehicle: "VEH-21",
  route: "Slalom-B",
  state: "aborted",
  stateLabel: "aborted",
  score: "—",
  started: "08:14:02",
  duration: "00:05:02",
  timeline: TIMELINE_ABORTED,
};

const NORMAL: ConsoleExamsSnapshot = {
  totals: { inProgress: 1, scheduledToday: 1 },
  exams: [EXM_IN_PROGRESS, EXM_SCHEDULED, EXM_FINISHED, EXM_ABORTED],
};

const VIOLATIONS_DETECTED: ConsoleExamsSnapshot = {
  totals: { inProgress: 1, scheduledToday: 1 },
  exams: [
    {
      ...EXM_IN_PROGRESS,
      timeline: [
        ...TIMELINE_IN_PROGRESS,
        {
          id: "critical",
          label: "Critical: stop sign ignored",
          detail: "Section 4 · 3 pt · review required",
          time: "11:11:01",
          dot: "offline",
        },
      ],
    },
    EXM_SCHEDULED,
    EXM_FINISHED,
    EXM_ABORTED,
  ],
};

const EXAM_IN_PROGRESS_SCENARIO: ConsoleExamsSnapshot = {
  totals: { inProgress: 2, scheduledToday: 1 },
  exams: [
    EXM_IN_PROGRESS,
    {
      ...EXM_SCHEDULED,
      id: "EXM-0120",
      candidate: "S. Belov",
      state: "inProgress",
      stateLabel: "in progress",
      started: "11:14:09",
      duration: "00:06:11",
      timeline: TIMELINE_IN_PROGRESS,
    },
    EXM_FINISHED,
    EXM_ABORTED,
  ],
};

const SERVICE_DEGRADED: ConsoleExamsSnapshot = {
  totals: { inProgress: 1, scheduledToday: 1 },
  exams: [
    {
      ...EXM_IN_PROGRESS,
      timeline: [
        ...TIMELINE_IN_PROGRESS.slice(0, 3),
        {
          id: "tel-stale",
          label: "Telemetry broker degraded",
          detail: "Stream queued locally · 14 events buffered",
          time: "11:09:42",
          dot: "degraded",
        },
      ],
    },
    EXM_SCHEDULED,
    EXM_FINISHED,
    EXM_ABORTED,
  ],
};

const EMPTY: ConsoleExamsSnapshot = {
  totals: { inProgress: 0, scheduledToday: 0 },
  exams: [],
};

export function consoleExamsFor(
  scenario: MockScenario,
): ConsoleExamsSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "violations-detected":
      return VIOLATIONS_DETECTED;
    case "exam-in-progress":
      return EXAM_IN_PROGRESS_SCENARIO;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    default:
      return NORMAL;
  }
}
