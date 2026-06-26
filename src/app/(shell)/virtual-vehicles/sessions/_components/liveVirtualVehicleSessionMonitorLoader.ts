/**
 * Live Virtual Vehicle Session Monitor loader + DTO→view-model
 * mappers.
 *
 * Wires `/virtual-vehicles/sessions/[sessionId]` to the typed
 * `virtual-vehicle-service` client. Mock mode keeps using
 * fixtures.
 *
 * Coverage vs. canonical contract:
 *   - `GET /virtual-vehicles` → reverse-lookup
 *     `virtualVehicleId` by `currentSessionId === sessionId`.
 *     `virtual-vehicle-service` does not expose a top-level
 *     `/sessions/{sessionId}` resolver, so we use the
 *     parent-resource as the locator. Once an enclosing
 *     contract is wired, this fallback is removed (tech debt).
 *   - `GET /virtual-vehicles/{virtualVehicleId}/sessions/{sessionId}/events`
 *     → session event log.
 *
 * The currently-attached `VirtualVehicle` payload provides
 * pose + speed + gear + sensor state, used to render runtime
 * cards. The events list is mapped to canonical session-event
 * tokens that mirror the existing mock view-model so the
 * screen stays render-stable across mock/live switches.
 *
 * Unknown session ids (the parent vehicle is not currently
 * running this session) return an honest "unknown" state
 * without invented telemetry — the screen renders the same
 * "No runtime telemetry / No events recorded" empty surfaces
 * that mock mode already covers.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/virtual-vehicle";

import {
  SESSION_EVENT_SEVERITY_LABELS,
  SESSION_STATE_LABELS,
  type ConsoleSessionEvent,
  type ConsoleSessionEventSeverity,
  type ConsoleSessionRuntimeCard,
  type ConsoleSessionState,
  type ConsoleVirtualVehicleSessionMonitor,
} from "./consoleVirtualVehicleSessionMonitorSnapshot";
import {
  mapSimulatorSourceDtoToConsole,
  mapVirtualVehicleStatusDtoToConsole,
} from "../../_components/liveVirtualVehiclesLoader";
import { VIRTUAL_VEHICLE_SOURCE_LABELS } from "../../_components/consoleVirtualVehiclesSnapshot";

type VirtualVehicleDto = components["schemas"]["VirtualVehicle"];
type VirtualVehiclesPageDto =
  components["schemas"]["VirtualVehiclesPage"];
type SessionEventDto = components["schemas"]["SessionEvent"];
type SessionEventsPageDto = components["schemas"]["SessionEventsPage"];
type SessionEventTypeDto = components["schemas"]["SessionEventType"];

function vehicleStatusToSessionState(
  status: ReturnType<typeof mapVirtualVehicleStatusDtoToConsole>,
): ConsoleSessionState {
  switch (status) {
    case "running":
      return "running";
    case "paused":
      return "paused";
    case "stopped":
      return "stopped";
    case "degraded":
      return "degraded";
    case "idle":
    default:
      return "unknown";
  }
}

const EVENT_SEVERITY_BY_KIND: Record<
  SessionEventTypeDto,
  ConsoleSessionEventSeverity
> = {
  sessionStarted: "info",
  sessionPaused: "info",
  sessionResumed: "info",
  sessionStopped: "info",
  sessionFailed: "error",
  manualControlApplied: "info",
  replayMilestoneReached: "info",
  sensorStateChanged: "warning",
  resetPosition: "info",
  telemetrySampleEmitted: "telemetry",
};

const EVENT_LABELS: Record<SessionEventTypeDto, string> = {
  sessionStarted: "Session started",
  sessionPaused: "Session paused",
  sessionResumed: "Session resumed",
  sessionStopped: "Session stopped",
  sessionFailed: "Session failed",
  manualControlApplied: "Manual control applied",
  replayMilestoneReached: "Replay milestone reached",
  sensorStateChanged: "Sensor state changed",
  resetPosition: "Position reset",
  telemetrySampleEmitted: "Telemetry sample emitted",
};

export function mapSessionEventDtoToConsole(
  dto: SessionEventDto,
): ConsoleSessionEvent {
  const severity = EVENT_SEVERITY_BY_KIND[dto.type] ?? "info";
  return {
    id: dto.eventId,
    at: dto.occurredAt,
    severity,
    severityLabel: SESSION_EVENT_SEVERITY_LABELS[severity],
    kind: dto.type,
    label: EVENT_LABELS[dto.type] ?? dto.type,
    detail:
      dto.actor?.actorId !== undefined
        ? `Actor: ${dto.actor.actorId}`
        : "—",
  };
}

function runtimeCardsFor(
  dto: VirtualVehicleDto,
): ConsoleSessionRuntimeCard[] {
  const cards: ConsoleSessionRuntimeCard[] = [];
  if (dto.currentPosition) {
    cards.push({
      id: "position",
      title: "Pose",
      value: `${dto.currentPosition.x.toFixed(2)} / ${dto.currentPosition.y.toFixed(2)} m`,
      canonical: "position",
      variant: dto.status === "failed" ? "warning" : "info",
    });
  }
  if (typeof dto.speed === "number") {
    cards.push({
      id: "speed",
      title: "Speed",
      value: `${dto.speed.toFixed(1)} m/s`,
      canonical: "telemetryTick",
      variant: "info",
    });
  }
  if (typeof dto.yaw === "number") {
    cards.push({
      id: "yaw",
      title: "Yaw",
      value: `${dto.yaw.toFixed(3)} rad`,
      canonical: "yaw",
      variant: "info",
    });
  }
  if (dto.gear) {
    cards.push({
      id: "gear",
      title: "Gear",
      value: dto.gear,
      canonical: dto.gear,
      variant: "neutral",
    });
  }
  const source = mapSimulatorSourceDtoToConsole(dto.simulatorSource);
  cards.push({
    id: "source",
    title: "Source",
    value: VIRTUAL_VEHICLE_SOURCE_LABELS[source],
    canonical: source,
    variant: "neutral",
  });
  if (dto.status === "failed") {
    cards.push({
      id: "degraded",
      title: "Runtime",
      value: "Degraded",
      canonical: "degraded",
      variant: "warning",
    });
  }
  return cards;
}

function unknownSession(
  sessionId: string,
): ConsoleVirtualVehicleSessionMonitor {
  return {
    sessionId,
    vehicleLabel: "—",
    state: "unknown",
    stateLabel: SESSION_STATE_LABELS.unknown,
    startedAt: "—",
    lastTelemetryAt: "—",
    scenarioId: "—",
    scenarioLabel: "—",
    source: "simulator",
    sourceLabel: VIRTUAL_VEHICLE_SOURCE_LABELS.simulator,
    runtimeCards: [],
    events: [],
  };
}

export async function liveVirtualVehicleSessionMonitorLoader(
  adapter: AutodromeApi,
  sessionId: string,
): Promise<ConsoleVirtualVehicleSessionMonitor> {
  const listResult = await adapter.virtualVehicle.GET(
    "/virtual-vehicles",
    {},
  );
  const page = (listResult.data ?? {
    items: [],
  }) as VirtualVehiclesPageDto;
  const parent = (page.items ?? []).find(
    (v) => v.currentSessionId === sessionId,
  );
  if (!parent) {
    return unknownSession(sessionId);
  }

  const consoleStatus = mapVirtualVehicleStatusDtoToConsole(parent.status);
  const consoleState = vehicleStatusToSessionState(consoleStatus);
  const consoleSource = mapSimulatorSourceDtoToConsole(
    parent.simulatorSource,
  );

  const eventsResult = await adapter.virtualVehicle.GET(
    "/virtual-vehicles/{virtualVehicleId}/sessions/{sessionId}/events",
    {
      params: {
        path: {
          virtualVehicleId: parent.virtualVehicleId,
          sessionId,
        },
      },
    },
  );
  const eventsPage = (eventsResult.data ?? {
    items: [],
  }) as SessionEventsPageDto;
  const events = (eventsPage.items ?? []).map(
    mapSessionEventDtoToConsole,
  );

  return {
    sessionId,
    vehicleLabel: parent.displayName,
    state: consoleState,
    stateLabel: SESSION_STATE_LABELS[consoleState],
    startedAt: parent.updatedAt ?? parent.createdAt,
    lastTelemetryAt: parent.updatedAt ?? parent.createdAt,
    scenarioId: parent.currentScenarioId ?? "—",
    scenarioLabel: parent.currentScenarioId ?? "—",
    source: consoleSource,
    sourceLabel: VIRTUAL_VEHICLE_SOURCE_LABELS[consoleSource],
    runtimeCards: runtimeCardsFor(parent),
    events,
  };
}
