import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleVehicle,
  ConsoleVehiclesSnapshot,
} from "./consoleRegistrySnapshot";

const VEH_07: ConsoleVehicle = {
  id: "VEH-07",
  model: "Lada Granta 2024",
  plate: "А 740 ТУ 199",
  category: "Cat B",
  device: { state: "degraded", label: "degraded" },
  firmware: "1.4.2",
  lastSeen: "00:00:42 ago",
  equipment: [
    { name: "Front camera", state: "ok", label: "ok" },
    { name: "Side camera (left)", state: "ok", label: "ok" },
    { name: "Side camera (right)", state: "watch", label: "watch" },
    { name: "GNSS receiver", state: "ok", label: "ok" },
    { name: "Telemetry uplink", state: "watch", label: "stale" },
  ],
};

const NORMAL_VEHICLES: ConsoleVehicle[] = [
  {
    id: "VEH-01",
    model: "Lada Vesta 2024",
    plate: "А 014 ТУ 199",
    category: "Cat B",
    device: { state: "online", label: "online" },
    firmware: "1.4.2",
    lastSeen: "00:00:04 ago",
    equipment: [
      { name: "Front camera", state: "ok", label: "ok" },
      { name: "Side camera (left)", state: "ok", label: "ok" },
      { name: "Side camera (right)", state: "ok", label: "ok" },
      { name: "GNSS receiver", state: "ok", label: "ok" },
      { name: "Telemetry uplink", state: "ok", label: "ok" },
    ],
  },
  {
    id: "VEH-02",
    model: "Lada Granta 2023",
    plate: "В 220 ТО 199",
    category: "Cat B",
    device: { state: "online", label: "online" },
    firmware: "1.4.1",
    lastSeen: "00:00:09 ago",
    equipment: [
      { name: "Front camera", state: "ok", label: "ok" },
      { name: "Side camera (left)", state: "ok", label: "ok" },
      { name: "Side camera (right)", state: "ok", label: "ok" },
      { name: "GNSS receiver", state: "ok", label: "ok" },
      { name: "Telemetry uplink", state: "ok", label: "ok" },
    ],
  },
  VEH_07,
  {
    id: "VEH-12",
    model: "Lada Vesta 2024",
    plate: "Е 412 ОТ 199",
    category: "Cat B",
    device: { state: "online", label: "online" },
    firmware: "1.4.2",
    lastSeen: "00:00:11 ago",
    equipment: [
      { name: "Front camera", state: "ok", label: "ok" },
      { name: "Side camera (left)", state: "ok", label: "ok" },
      { name: "Side camera (right)", state: "ok", label: "ok" },
      { name: "GNSS receiver", state: "ok", label: "ok" },
      { name: "Telemetry uplink", state: "ok", label: "ok" },
    ],
  },
  {
    id: "VEH-21",
    model: "UAZ Patriot 2024",
    plate: "К 321 ОУ 199",
    category: "Cat C",
    device: { state: "offline", label: "offline" },
    firmware: "1.3.9",
    lastSeen: "14m ago",
    equipment: [
      { name: "Front camera", state: "ok", label: "ok" },
      { name: "Side camera (left)", state: "fault", label: "fault" },
      { name: "Side camera (right)", state: "ok", label: "ok" },
      { name: "GNSS receiver", state: "watch", label: "watch" },
      { name: "Telemetry uplink", state: "fault", label: "no data" },
    ],
  },
  {
    id: "VEH-30",
    model: "Lada Vesta 2024",
    plate: "Т 909 ОУ 199",
    category: "Cat B",
    device: { state: "standby", label: "standby" },
    firmware: "1.4.2",
    lastSeen: "1h ago",
    equipment: [
      { name: "Front camera", state: "ok", label: "ok" },
      { name: "Side camera (left)", state: "ok", label: "ok" },
      { name: "Side camera (right)", state: "ok", label: "ok" },
      { name: "GNSS receiver", state: "ok", label: "ok" },
      { name: "Telemetry uplink", state: "ok", label: "ok" },
    ],
  },
];

function totals(vehicles: ConsoleVehicle[]): ConsoleVehiclesSnapshot["totals"] {
  return {
    total: vehicles.length,
    degraded: vehicles.filter((v) => v.device.state === "degraded").length,
    offline: vehicles.filter((v) => v.device.state === "offline").length,
  };
}

const NORMAL: ConsoleVehiclesSnapshot = {
  totals: totals(NORMAL_VEHICLES),
  vehicles: NORMAL_VEHICLES,
};

const EMPTY: ConsoleVehiclesSnapshot = {
  totals: { total: 0, degraded: 0, offline: 0 },
  vehicles: [],
};

const SERVICE_DEGRADED: ConsoleVehiclesSnapshot = {
  totals: totals(NORMAL_VEHICLES),
  vehicles: NORMAL_VEHICLES.map((v) =>
    v.id === "VEH-12"
      ? { ...v, device: { state: "degraded", label: "degraded" } }
      : v,
  ),
};

export function consoleVehiclesFor(
  scenario: MockScenario,
): ConsoleVehiclesSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "violations-detected":
    case "exam-in-progress":
    case "normal":
    default:
      return NORMAL;
  }
}
