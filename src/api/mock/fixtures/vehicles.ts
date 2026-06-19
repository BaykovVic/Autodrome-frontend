import type { components } from "@/contracts/types/vehicle";
import type { MockScenario } from "../scenarios";

type Vehicle = components["schemas"]["Vehicle"];

const NOW = "2026-06-19T10:00:00Z";

const RENAULT: Vehicle = {
  vehicleId: "20000000-0000-4000-8000-000000000001",
  plateNumber: "A123BC77",
  type: "passenger",
  model: "Renault Logan",
  manufactureYear: 2021,
  status: "active",
  createdAt: NOW,
};

const LADA: Vehicle = {
  vehicleId: "20000000-0000-4000-8000-000000000002",
  plateNumber: "B234DE77",
  type: "passenger",
  model: "Lada Vesta",
  manufactureYear: 2023,
  status: "active",
  createdAt: NOW,
};

const TRUCK: Vehicle = {
  vehicleId: "20000000-0000-4000-8000-000000000003",
  plateNumber: "T567FG77",
  type: "truck",
  model: "GAZon Next",
  manufactureYear: 2019,
  status: "maintenance",
  createdAt: NOW,
};

export function vehiclesFor(scenario: MockScenario): Vehicle[] {
  switch (scenario) {
    case "empty":
      return [];
    case "exam-in-progress":
      return [RENAULT, LADA];
    case "violations-detected":
      return [RENAULT, LADA, TRUCK];
    case "service-degraded":
      return [RENAULT];
    case "normal":
    default:
      return [RENAULT, LADA, TRUCK];
  }
}
