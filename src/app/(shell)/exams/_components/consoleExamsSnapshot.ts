/**
 * Console-shaped exams snapshot.
 *
 * Backend Exam contract has examId/status/candidateRef/vehicleRef/etc.
 * The visual surface adds design-only blocks (route label, score,
 * 4-quadrant metadata grid, lifecycle action affordances, multi-step
 * timeline). Those live in the snapshot until backend ships proper
 * read models for them.
 */
export type ConsoleExamState =
  | "scheduled"
  | "inProgress"
  | "finished"
  | "aborted";

export type ConsoleExamFilter =
  | "all"
  | "scheduled"
  | "inProgress"
  | "finished"
  | "aborted";

export type ConsoleExamTimelineEntry = {
  id: string;
  label: string;
  detail: string;
  time: string;
  dot: "online" | "degraded" | "offline" | "standby";
};

export type ConsoleExam = {
  id: string;
  candidate: string;
  vehicle: string;
  route: string;
  state: ConsoleExamState;
  stateLabel: string;
  score: string;
  started: string;
  duration: string;
  timeline: ConsoleExamTimelineEntry[];
};

export type ConsoleExamsSnapshot = {
  totals: {
    inProgress: number;
    scheduledToday: number;
  };
  exams: ConsoleExam[];
};
