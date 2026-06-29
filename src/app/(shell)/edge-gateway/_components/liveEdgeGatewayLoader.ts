/**
 * Live vehicle-edge-gateway monitoring loader.
 *
 * Reads `GET /edge/status` (`EdgeRuntimeStatus`) and maps to the
 * operator view-model. Errors land in `snapshot.statusError`
 * (graceful) so the screen renders a single "disconnected"
 * banner instead of throwing.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/vehicle-edge-gateway";

import {
  GATEWAY_PHASE_LABELS,
  type ConsoleEdgeGatewaySnapshot,
  type ConsoleGatewayPhase,
} from "./consoleEdgeGateway";

type EdgeRuntimeStatusDto =
  components["schemas"]["EdgeRuntimeStatus"];

function isKnownPhase(p: string): p is ConsoleGatewayPhase {
  return (
    p === "bootstrapping" ||
    p === "forwarding" ||
    p === "paused" ||
    p === "failed"
  );
}

export function mapEdgeRuntimeStatusDto(
  dto: EdgeRuntimeStatusDto,
): ConsoleEdgeGatewaySnapshot {
  const phase: ConsoleGatewayPhase = isKnownPhase(dto.phase)
    ? dto.phase
    : "failed";
  return {
    gatewayId: dto.gatewayId,
    phase,
    phaseLabel: GATEWAY_PHASE_LABELS[phase],
    parser: {
      name: dto.parser.name,
      version: dto.parser.version,
    },
    queue: {
      pendingBatches: dto.queue.pendingBatches,
      lastForwardedAt: dto.queue.lastForwardedAt,
      lastForwardedBatchId: dto.queue.lastForwardedBatchId,
    },
    upstream: dto.upstream
      ? {
          reachable: dto.upstream.reachable,
          lastHeartbeatAt: dto.upstream.lastHeartbeatAt,
        }
      : undefined,
    observedAt: dto.observedAt,
  };
}

function explain(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "edge gateway fetch failed";
}

export async function liveEdgeGatewayLoader(
  adapter: AutodromeApi,
): Promise<ConsoleEdgeGatewaySnapshot> {
  try {
    const result = await adapter.vehicleEdgeGateway.GET(
      "/edge/status",
      {},
    );
    const dto = result.data as EdgeRuntimeStatusDto | undefined;
    if (!dto) {
      return {
        gatewayId: "—",
        phase: "failed",
        phaseLabel: GATEWAY_PHASE_LABELS.failed,
        parser: { name: "—" },
        queue: { pendingBatches: 0 },
        observedAt: "—",
        statusError: "Edge status endpoint returned no body.",
      };
    }
    return mapEdgeRuntimeStatusDto(dto);
  } catch (error) {
    return {
      gatewayId: "—",
      phase: "failed",
      phaseLabel: GATEWAY_PHASE_LABELS.failed,
      parser: { name: "—" },
      queue: { pendingBatches: 0 },
      observedAt: "—",
      statusError: explain(error),
    };
  }
}
