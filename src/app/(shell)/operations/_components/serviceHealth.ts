/**
 * Local frontend shape for the service health/readiness dashboard.
 *
 * There is no canonical aggregator endpoint in the backend OpenAPI
 * (each service exposes its own probe). When such an aggregator is
 * added to the canonical contracts, this type should be replaced with
 * the generated DTO and the loader should switch to a typed adapter
 * call.
 */
export type ServiceKind = "backend" | "edge" | "deploy";

export type ServiceHealthStatus =
  | "healthy"
  | "degraded"
  | "down"
  | "unknown";

export type ServiceHealth = {
  id: string;
  name: string;
  kind: ServiceKind;
  liveness: ServiceHealthStatus;
  readiness: ServiceHealthStatus;
  lastCheckAt: string;
  errorMessage?: string;
  correlationId?: string;
};
