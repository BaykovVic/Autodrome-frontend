import type {
  EnrollmentChannelsSnapshot,
  EnrollmentScenario,
} from "./consoleEnrollmentChannels";

const REGISTRAR_ONLINE = {
  state: "online-assigned" as const,
  deviceId: "REG-TAB-02",
  station: "Registration B · NODE-A2",
  deviceName: "Registrar tablet — Station B",
  lastSeen: "2s ago",
  batteryNetwork: "84% · Wi-Fi local",
};

const REGISTRAR_OFFLINE = {
  state: "offline" as const,
  deviceId: "REG-TAB-02",
  station: "Registration B · NODE-A2",
  deviceName: "Registrar tablet — Station B",
  lastSeen: "14m ago",
  batteryNetwork: "no contact",
};

const LOCAL_AVAILABLE = {
  state: "available" as const,
  cameraName: "Logitech BRIO",
  statusLabel: "Camera detected",
  permissionGranted: true,
  secondMonitorCopy:
    "Permission granted on this PC. Capture opens in the second-monitor window — the console stays on this screen.",
};

const LOCAL_UNAVAILABLE = {
  state: "unavailable" as const,
  cameraName: "—",
  statusLabel: "No camera detected",
  permissionGranted: false,
  secondMonitorCopy:
    "No USB camera detected on the operator PC. Plug a supported camera or send the candidate to the registrar tablet.",
};

const ATTEMPT_IDLE = {
  active: false,
  reason: "",
};

const ATTEMPT_ACTIVE = {
  active: true,
  reason:
    "Retry is unavailable until the current enrollment attempt completes or expires.",
};

const REGISTRAR_ONLINE_SCENARIO: EnrollmentChannelsSnapshot = {
  scenario: "registrar-online",
  registrar: REGISTRAR_ONLINE,
  local: LOCAL_AVAILABLE,
  currentAttempt: ATTEMPT_IDLE,
};

const REGISTRAR_OFFLINE_SCENARIO: EnrollmentChannelsSnapshot = {
  scenario: "registrar-offline",
  registrar: REGISTRAR_OFFLINE,
  local: LOCAL_AVAILABLE,
  currentAttempt: ATTEMPT_IDLE,
};

const LOCAL_AVAILABLE_SCENARIO: EnrollmentChannelsSnapshot = {
  scenario: "local-camera-available",
  registrar: REGISTRAR_ONLINE,
  local: LOCAL_AVAILABLE,
  currentAttempt: ATTEMPT_IDLE,
};

const LOCAL_UNAVAILABLE_SCENARIO: EnrollmentChannelsSnapshot = {
  scenario: "local-camera-unavailable",
  registrar: REGISTRAR_ONLINE,
  local: LOCAL_UNAVAILABLE,
  currentAttempt: ATTEMPT_IDLE,
};

const ATTEMPT_ACTIVE_SCENARIO: EnrollmentChannelsSnapshot = {
  scenario: "attempt-active",
  registrar: REGISTRAR_ONLINE,
  local: LOCAL_AVAILABLE,
  currentAttempt: ATTEMPT_ACTIVE,
};

export function consoleEnrollmentChannelsFor(
  scenario: EnrollmentScenario,
): EnrollmentChannelsSnapshot {
  switch (scenario) {
    case "registrar-online":
      return REGISTRAR_ONLINE_SCENARIO;
    case "registrar-offline":
      return REGISTRAR_OFFLINE_SCENARIO;
    case "local-camera-available":
      return LOCAL_AVAILABLE_SCENARIO;
    case "local-camera-unavailable":
      return LOCAL_UNAVAILABLE_SCENARIO;
    case "attempt-active":
      return ATTEMPT_ACTIVE_SCENARIO;
  }
}

export const ENROLLMENT_SCENARIOS: readonly EnrollmentScenario[] = [
  "registrar-online",
  "registrar-offline",
  "local-camera-available",
  "local-camera-unavailable",
  "attempt-active",
] as const;
