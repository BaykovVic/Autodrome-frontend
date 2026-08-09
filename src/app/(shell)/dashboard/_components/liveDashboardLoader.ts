/**
 * Live dashboard loader over the canonical `api-gateway-bff` read
 * models:
 *
 *   - `GET /dashboard/admin`      → `AdminDashboard`
 *     (`serviceHealth[]` + `alerts[]`);
 *   - `GET /dashboard/dispatcher` → `DispatcherDashboard`
 *     (`exams[]`, `vehicles[]`, `equipmentHealth[]`, `alerts[]`).
 *
 * Which read model is used is decided by the CURRENT SESSION ROLES,
 * not by an env flag: an actor holding `admin` / `techAdmin` reads the
 * admin model, otherwise the dispatcher model.
 *
 * Honesty rule: the BFF exposes no database-readiness, media-storage,
 * telemetry or outbox read model, so those blocks resolve to `null`
 * and the dashboard renders an explicit "no data from backend" tile.
 * Nothing is back-filled from fixtures in live mode.
 *
 * Errors bubble up as `ApiError` and are classified by the shared
 * taxonomy at the call site: 401 → session flow, 403 → forbidden,
 * unreachable backend → degraded banner over the last known snapshot.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/api-gateway-bff";

import type {
  ConsoleDashboardSnapshot,
  DashboardDegradedNotice,
  DashboardServiceRow,
  NodeOperationsItem,
  ServiceHealthState,
} from "./consoleDashboardSnapshot";

type AdminDashboardDto = components["schemas"]["AdminDashboard"];
type DispatcherDashboardDto = components["schemas"]["DispatcherDashboard"];
type DashboardAlertDto = components["schemas"]["DashboardAlert"];

/** Roles that read the admin dashboard read model. */
const ADMIN_ROLES = ["admin", "techAdmin"];

export function prefersAdminDashboard(roles: readonly string[]): boolean {
  return roles.some((role) => ADMIN_ROLES.includes(role));
}

/**
 * Map a free-form backend status string onto the canonical widget
 * state. Unknown values map to `unknown` rather than being guessed
 * into a healthy state.
 */
export function mapServiceState(status: string): ServiceHealthState {
  const normalized = status.trim().toLowerCase();
  if (["healthy", "ok", "up", "operational", "online"].includes(normalized)) {
    return "healthy";
  }
  if (["degraded", "warning", "warn", "partial"].includes(normalized)) {
    return "degraded";
  }
  if (["down", "offline", "unavailable", "critical", "failed"].includes(normalized)) {
    return "down";
  }
  return "unknown";
}

function serviceRow(service: string, status: string): DashboardServiceRow {
  return {
    id: service,
    name: service,
    state: mapServiceState(status),
    // Show exactly what the backend reported, not a prettified guess.
    badgeLabel: status,
  };
}

/**
 * Fold backend alerts into the dashboard degraded notice. The most
 * severe alert wins; the rest are summarised in the detail line.
 */
export function alertsToNotice(
  alerts: readonly DashboardAlertDto[],
): DashboardDegradedNotice | undefined {
  if (alerts.length === 0) return undefined;
  const rank = { critical: 3, warning: 2, info: 1 } as const;
  const top = [...alerts].sort(
    (a, b) => (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0),
  )[0];
  const others = alerts.length - 1;
  return {
    title: `${top.severity.toUpperCase()}: ${top.code}`,
    detail:
      others > 0
        ? `${top.message} (+${others} more alert${others > 1 ? "s" : ""})`
        : top.message,
  };
}

function emptyBlocks() {
  // Blocks with no BFF read model — explicitly absent, never faked.
  return {
    database: null,
    media: null,
    vehicleTelemetry: null,
    outbox: null,
  } as const;
}

function nowLabel(now: () => Date): string {
  return now().toISOString().slice(11, 19);
}

export async function liveAdminDashboard(
  adapter: AutodromeApi,
  now: () => Date = () => new Date(),
): Promise<ConsoleDashboardSnapshot> {
  const result = await adapter.apiGatewayBff.GET("/dashboard/admin", {});
  const dto = result.data as AdminDashboardDto | undefined;
  const serviceHealth = (dto?.serviceHealth ?? []).map((s) =>
    serviceRow(s.service, s.status),
  );
  return {
    node: { id: null, site: null, lastRefresh: nowLabel(now) },
    degradedNotice: alertsToNotice(dto?.alerts ?? []),
    serviceHealth,
    ...emptyBlocks(),
    nodeOps: null,
  };
}

export async function liveDispatcherDashboard(
  adapter: AutodromeApi,
  now: () => Date = () => new Date(),
): Promise<ConsoleDashboardSnapshot> {
  const result = await adapter.apiGatewayBff.GET(
    "/dashboard/dispatcher",
    {},
  );
  const dto = result.data as DispatcherDashboardDto | undefined;
  const serviceHealth = (dto?.equipmentHealth ?? []).map((e) =>
    serviceRow(e.equipmentId, e.status),
  );
  // Counts come straight from the returned collections — reported
  // data, not derived guesses.
  const nodeOps: NodeOperationsItem[] = [
    { label: "Exams", value: String((dto?.exams ?? []).length) },
    { label: "Vehicles", value: String((dto?.vehicles ?? []).length) },
  ];
  return {
    node: { id: null, site: null, lastRefresh: nowLabel(now) },
    degradedNotice: alertsToNotice(dto?.alerts ?? []),
    serviceHealth,
    ...emptyBlocks(),
    nodeOps,
  };
}

/** Role-driven live dashboard read. */
export async function liveDashboardLoader(
  adapter: AutodromeApi,
  roles: readonly string[],
  now: () => Date = () => new Date(),
): Promise<ConsoleDashboardSnapshot> {
  return prefersAdminDashboard(roles)
    ? liveAdminDashboard(adapter, now)
    : liveDispatcherDashboard(adapter, now);
}
