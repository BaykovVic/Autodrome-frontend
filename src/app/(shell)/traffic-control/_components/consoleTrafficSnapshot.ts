/**
 * Console-shaped traffic control view-model.
 *
 * Surfaces canonical `traffic-control-service` v1:
 *   - `GET /traffic` → TrafficState → controllers +
 *     lights.
 *   - `POST /traffic/commands` → TrafficCommandAccepted.
 *
 * Per spec rules:
 *   - "Frontend не управляет железом напрямую" — UI
 *     dispatches только canonical POST commands; backend
 *     взаимодействует с физическими контроллерами.
 *   - "Dangerous actions требуют явного confirmation UI"
 *     — `reset` и `blink` команды gated через
 *     `ConfirmDestructiveDialog` pattern.
 *   - "Все команды идут через `traffic-control-service`".
 */

export type ConsoleControllerStatus =
  | "healthy"
  | "degraded"
  | "offline"
  | "unknown";

export type ConsoleCommandType =
  | "setProgram"
  | "setState"
  | "reset"
  | "blink";

export type ConsoleTrafficController = {
  controllerId: string;
  status: ConsoleControllerStatus;
  statusLabel: string;
  address: string;
  capabilities: string[];
};

export type ConsoleTrafficLight = {
  lightId: string;
  controllerId: string;
  positionRef: string;
  state: string;
};

export type ConsoleCommandAccepted = {
  commandId: string;
  controllerId: string;
  commandType: ConsoleCommandType;
  acceptedAt: string;
};

export type ConsoleTrafficSnapshot = {
  controllers: ConsoleTrafficController[];
  lights: ConsoleTrafficLight[];
  recentCommands: ConsoleCommandAccepted[];
  degradedNote?: string;
};

export const CONTROLLER_STATUS_LABELS: Record<
  ConsoleControllerStatus,
  string
> = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
  unknown: "Unknown",
};

/**
 * Whether the command needs operator confirmation per spec
 * rule "Dangerous actions требуют явного confirmation UI".
 * `setProgram` / `setState` — routine; `reset` / `blink` —
 * dangerous (interrupts running program, may flash for
 * drivers).
 */
export function isDestructiveCommand(t: ConsoleCommandType): boolean {
  return t === "reset" || t === "blink";
}
