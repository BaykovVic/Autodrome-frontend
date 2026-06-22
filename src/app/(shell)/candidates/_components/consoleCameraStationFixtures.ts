import type {
  CameraStationScenario,
  CameraStationSnapshot,
} from "./consoleCameraStation";

const BASE_CANDIDATE = {
  candidate: "Irina Volkova",
  candidateId: "CND-2026-0144",
  maskedDob: "**.**.2002",
};

const BASE_SESSION_ID = "ENR-9F41";

const QUALITY_CAPTURING = [
  {
    id: "lighting",
    label: "Lighting",
    percent: 78,
    tone: "online" as const,
  },
  {
    id: "sharpness",
    label: "Sharpness",
    percent: 84,
    tone: "online" as const,
  },
  {
    id: "face-position",
    label: "Face position",
    percent: 92,
    tone: "online" as const,
  },
  {
    id: "stability",
    label: "Stability",
    percent: 65,
    tone: "degraded" as const,
  },
];

const QUALITY_READY = QUALITY_CAPTURING.map((q) => ({ ...q, percent: 0 }));

const QUALITY_DONE = QUALITY_CAPTURING.map((q) => ({ ...q, percent: 100 }));

const CHECKS_CAPTURING = [
  {
    id: "face-in-oval",
    label: "Face in oval",
    iconKind: "ok" as const,
    tone: "online" as const,
  },
  {
    id: "eyes-open",
    label: "Eyes open",
    iconKind: "ok" as const,
    tone: "online" as const,
  },
  {
    id: "stay-still",
    label: "Hold still",
    iconKind: "warn" as const,
    tone: "degraded" as const,
  },
];

const CHECKS_DONE = CHECKS_CAPTURING.map((c) => ({
  ...c,
  iconKind: "ok" as const,
  tone: "online" as const,
}));

const READY: CameraStationSnapshot = {
  scenario: "ready",
  sessionId: BASE_SESSION_ID,
  ...BASE_CANDIDATE,
  device: {
    id: "cam-brio-01",
    name: "Logitech BRIO — station camera",
    meta: "selected · 1080p · permission granted",
    status: "selected",
    permission: "granted",
  },
  captureWindow: {
    kind: "closed",
    label: "Capture window not opened yet",
  },
  quality: QUALITY_READY,
  capture: {
    framesCaptured: 0,
    progressPercent: 0,
    bestFrameLabel: "No frames captured yet",
  },
  captureChecks: CHECKS_CAPTURING.map((c) => ({
    ...c,
    iconKind: "wait" as const,
    tone: "standby" as const,
  })),
};

const CAPTURING: CameraStationSnapshot = {
  scenario: "capturing",
  sessionId: BASE_SESSION_ID,
  ...BASE_CANDIDATE,
  device: {
    id: "cam-brio-01",
    name: "Logitech BRIO — station camera",
    meta: "selected · 1080p · permission granted",
    status: "selected",
    permission: "granted",
  },
  captureWindow: {
    kind: "open",
    label: "Capture window open on the second monitor",
  },
  quality: QUALITY_CAPTURING,
  capture: {
    framesCaptured: 18,
    progressPercent: 72,
    bestFrameLabel: "capturing · 18 frames · best frame selected",
  },
  captureChecks: CHECKS_CAPTURING,
};

const DONE: CameraStationSnapshot = {
  scenario: "done",
  sessionId: BASE_SESSION_ID,
  ...BASE_CANDIDATE,
  device: {
    id: "cam-brio-01",
    name: "Logitech BRIO — station camera",
    meta: "selected · 1080p · permission granted",
    status: "selected",
    permission: "granted",
  },
  captureWindow: {
    kind: "done",
    label: "Capture finished — template sealed on NODE-A2",
  },
  quality: QUALITY_DONE,
  capture: {
    framesCaptured: 24,
    progressPercent: 100,
    bestFrameLabel: "capturing · 24 frames · best frame sealed",
  },
  captureChecks: CHECKS_DONE,
};

const CANCELLED: CameraStationSnapshot = {
  scenario: "cancelled",
  sessionId: BASE_SESSION_ID,
  ...BASE_CANDIDATE,
  device: {
    id: "cam-brio-01",
    name: "Logitech BRIO — station camera",
    meta: "selected · 1080p · permission granted",
    status: "selected",
    permission: "granted",
  },
  captureWindow: {
    kind: "cancelled",
    label: "Operator cancelled capture from the station",
  },
  quality: QUALITY_CAPTURING.map((q) => ({ ...q, percent: 40 })),
  capture: {
    framesCaptured: 7,
    progressPercent: 30,
    bestFrameLabel: "capturing · 7 frames · cancelled before sealing",
  },
  captureChecks: CHECKS_CAPTURING,
};

const PERMISSION_DENIED: CameraStationSnapshot = {
  scenario: "permission-denied",
  sessionId: BASE_SESSION_ID,
  ...BASE_CANDIDATE,
  device: {
    id: "cam-brio-01",
    name: "Logitech BRIO — station camera",
    meta: "selected · permission denied by operator",
    status: "permission-denied",
    permission: "denied",
  },
  captureWindow: {
    kind: "closed",
    label: "Capture window blocked — grant browser permission to proceed",
  },
  quality: QUALITY_READY,
  capture: {
    framesCaptured: 0,
    progressPercent: 0,
    bestFrameLabel: "Permission required",
  },
  captureChecks: CHECKS_CAPTURING.map((c) => ({
    ...c,
    iconKind: "wait" as const,
    tone: "offline" as const,
  })),
};

const SCENARIOS: Record<CameraStationScenario, CameraStationSnapshot> = {
  ready: READY,
  capturing: CAPTURING,
  done: DONE,
  cancelled: CANCELLED,
  "permission-denied": PERMISSION_DENIED,
};

export const CAMERA_STATION_SCENARIOS: readonly CameraStationScenario[] = [
  "ready",
  "capturing",
  "done",
  "cancelled",
  "permission-denied",
] as const;

export function consoleCameraStationFor(
  scenario: CameraStationScenario,
): CameraStationSnapshot {
  return SCENARIOS[scenario];
}

export function isCameraStationScenario(
  value: unknown,
): value is CameraStationScenario {
  return (
    typeof value === "string" &&
    (CAMERA_STATION_SCENARIOS as readonly string[]).includes(value)
  );
}
