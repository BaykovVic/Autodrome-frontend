/**
 * Live traffic-control access over canonical `traffic-control-service`
 * v1:
 *
 *   - `GET  /traffic`          → `TrafficState` (controllers + lights)
 *   - `POST /traffic/commands` → `TrafficCommandAccepted`
 *
 * Command results are NOT applied optimistically: the accepted command
 * returned by the backend is what the UI records. The frontend never
 * talks to hardware — every command goes through the service, and the
 * backend authorizes it (the console only decides whether to *offer*
 * the control).
 *
 * `TrafficState` carries no command history, so a freshly loaded
 * snapshot starts with an empty `recentCommands` list — the console
 * shows commands accepted in this session, not an invented history.
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/traffic-control";

import type {
  ConsoleCommandAccepted,
  ConsoleCommandType,
  ConsoleControllerStatus,
  ConsoleTrafficController,
  ConsoleTrafficLight,
  ConsoleTrafficSnapshot,
} from "./consoleTrafficSnapshot";
import { CONTROLLER_STATUS_LABELS } from "./consoleTrafficSnapshot";

type TrafficStateDto = components["schemas"]["TrafficState"];
type TrafficControllerDto = components["schemas"]["TrafficController"];
type TrafficLightDto = components["schemas"]["TrafficLight"];
type TrafficCommandAcceptedDto =
  components["schemas"]["TrafficCommandAccepted"];

export function mapController(
  dto: TrafficControllerDto,
): ConsoleTrafficController {
  const status = dto.status as ConsoleControllerStatus;
  return {
    controllerId: dto.controllerId,
    status,
    statusLabel: CONTROLLER_STATUS_LABELS[status] ?? dto.status,
    address: dto.address,
    capabilities: dto.capabilities ?? [],
  };
}

export function mapLight(dto: TrafficLightDto): ConsoleTrafficLight {
  return {
    lightId: dto.lightId,
    controllerId: dto.controllerId,
    positionRef: dto.positionRef,
    state: dto.state,
  };
}

export function mapAcceptedCommand(
  dto: TrafficCommandAcceptedDto,
): ConsoleCommandAccepted {
  return {
    commandId: dto.commandId,
    controllerId: dto.controllerId,
    commandType: dto.commandType as ConsoleCommandType,
    acceptedAt: dto.acceptedAt,
  };
}

export async function liveTrafficLoader(
  adapter: AutodromeApi,
): Promise<ConsoleTrafficSnapshot> {
  const result = await adapter.trafficControl.GET("/traffic", {});
  const dto = result.data as TrafficStateDto | undefined;
  return {
    controllers: (dto?.controllers ?? []).map(mapController),
    lights: (dto?.lights ?? []).map(mapLight),
    // No command history in the read model — see file docstring.
    recentCommands: [],
  };
}

export type TrafficCommandSender = (
  controllerId: string,
  commandType: ConsoleCommandType,
) => Promise<ConsoleCommandAccepted>;

/** Bind the canonical command endpoint to a sender. */
export function liveTrafficCommandSender(
  adapter: AutodromeApi,
): TrafficCommandSender {
  return async (controllerId, commandType) => {
    const result = await adapter.trafficControl.POST("/traffic/commands", {
      body: { controllerId, commandType },
      params: {
        // Mutating command: the contract requires an idempotency key.
        header: { "Idempotency-Key": newCorrelationId() },
      },
    });
    const dto = result.data as TrafficCommandAcceptedDto | undefined;
    if (!dto) {
      throw new Error("Traffic command endpoint returned no acceptance.");
    }
    return mapAcceptedCommand(dto);
  };
}
