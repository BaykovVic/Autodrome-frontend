import {
  DEFAULT_SCENARIO,
  isMockScenario,
  type MockScenario,
} from "./mock/scenarios";

/**
 * Runtime API mode for the frontend.
 *
 * - `mock` is the development-safe default: workspaces and smoke
 *   tests use fixtures, no real backend is required.
 * - `live` is opted into via `NEXT_PUBLIC_API_ADAPTER=live` and
 *   talks to real backend services using configured base URLs.
 *
 * Per-service base URLs are read from environment variables; when
 * unset, sensible local defaults (`/api/<service>/v1`) keep the
 * existing gateway routing convention working. Invalid base URLs
 * produce a structured issue list rather than throwing — consumers
 * (the diagnostics panel, the adapter factory) decide how to
 * surface the degraded state.
 */
export type RuntimeMode = "mock" | "live";

export type ServiceName =
  | "candidate"
  | "vehicle"
  | "exam"
  | "exercise"
  | "violationRule"
  | "mediaArchive"
  | "androidDevice"
  | "virtualVehicle"
  | "reportingDocument"
  | "deploymentOperations"
  | "vehicleTelemetry";

export const SERVICE_NAMES: readonly ServiceName[] = [
  "candidate",
  "vehicle",
  "exam",
  "exercise",
  "violationRule",
  "mediaArchive",
  "androidDevice",
  "virtualVehicle",
  "reportingDocument",
  "deploymentOperations",
  "vehicleTelemetry",
] as const;

export const DEFAULT_LIVE_BASE_URLS: Record<ServiceName, string> = {
  candidate: "/api/candidate/v1",
  vehicle: "/api/vehicle/v1",
  exam: "/api/exam/v1",
  exercise: "/api/exercise/v1",
  violationRule: "/api/violation-rule/v1",
  mediaArchive: "/api/media-archive/v1",
  androidDevice: "/api/android-device-management/v1",
  virtualVehicle: "/api/virtual-vehicle/v1",
  reportingDocument: "/api/reporting-document/v1",
  deploymentOperations: "/api/deployment-operations/v1",
  vehicleTelemetry: "/api/vehicle-telemetry/v1",
};

export const SERVICE_ENV_KEYS: Record<ServiceName, string> = {
  candidate: "NEXT_PUBLIC_API_CANDIDATE_BASE_URL",
  vehicle: "NEXT_PUBLIC_API_VEHICLE_BASE_URL",
  exam: "NEXT_PUBLIC_API_EXAM_BASE_URL",
  exercise: "NEXT_PUBLIC_API_EXERCISE_BASE_URL",
  violationRule: "NEXT_PUBLIC_API_VIOLATION_RULE_BASE_URL",
  mediaArchive: "NEXT_PUBLIC_API_MEDIA_ARCHIVE_BASE_URL",
  androidDevice: "NEXT_PUBLIC_API_ANDROID_DEVICE_BASE_URL",
  virtualVehicle: "NEXT_PUBLIC_API_VIRTUAL_VEHICLE_BASE_URL",
  reportingDocument: "NEXT_PUBLIC_API_REPORTING_DOCUMENT_BASE_URL",
  deploymentOperations: "NEXT_PUBLIC_API_DEPLOYMENT_OPERATIONS_BASE_URL",
  vehicleTelemetry: "NEXT_PUBLIC_API_VEHICLE_TELEMETRY_BASE_URL",
};

export type RuntimeConfigIssue = {
  field: string;
  message: string;
};

export type RuntimeConfig =
  | {
      ok: true;
      mode: "mock";
      scenario: MockScenario;
    }
  | {
      ok: true;
      mode: "live";
      baseUrls: Record<ServiceName, string>;
    }
  | {
      ok: false;
      mode: "live";
      baseUrls: Record<ServiceName, string>;
      issues: RuntimeConfigIssue[];
    };

type EnvShape = Record<string, string | undefined>;

function readEnv(env?: EnvShape): EnvShape {
  return env ?? (process.env as EnvShape);
}

/**
 * Reads `NEXT_PUBLIC_API_ADAPTER`. Any value other than `"live"`
 * resolves to mock — including missing or unknown — so a fresh
 * `pnpm dev` on a machine without env defaults to fixtures rather
 * than to a non-existent backend.
 */
export function resolveRuntimeMode(env?: EnvShape): RuntimeMode {
  const value = readEnv(env).NEXT_PUBLIC_API_ADAPTER;
  return value === "live" ? "live" : "mock";
}

function isValidBaseUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("/")) return true;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function resolveLiveBaseUrls(env?: EnvShape): {
  baseUrls: Record<ServiceName, string>;
  issues: RuntimeConfigIssue[];
} {
  const e = readEnv(env);
  const baseUrls = { ...DEFAULT_LIVE_BASE_URLS };
  const issues: RuntimeConfigIssue[] = [];
  for (const name of SERVICE_NAMES) {
    const key = SERVICE_ENV_KEYS[name];
    const raw = e[key];
    if (raw === undefined || raw === "") continue;
    if (!isValidBaseUrl(raw)) {
      issues.push({
        field: key,
        message: `Invalid base URL for ${name}-service. Expected an absolute URL or a path starting with "/".`,
      });
      continue;
    }
    baseUrls[name] = raw.trim();
  }
  return { baseUrls, issues };
}

function resolveScenario(env?: EnvShape): MockScenario {
  const value = readEnv(env).NEXT_PUBLIC_MOCK_SCENARIO;
  return isMockScenario(value) ? value : DEFAULT_SCENARIO;
}

export function resolveRuntimeConfig(env?: EnvShape): RuntimeConfig {
  const mode = resolveRuntimeMode(env);
  if (mode === "mock") {
    return { ok: true, mode, scenario: resolveScenario(env) };
  }
  const { baseUrls, issues } = resolveLiveBaseUrls(env);
  if (issues.length > 0) {
    return { ok: false, mode: "live", baseUrls, issues };
  }
  return { ok: true, mode: "live", baseUrls };
}

export type RuntimeDiagnostics =
  | {
      mode: "mock";
      scenario: MockScenario;
    }
  | {
      mode: "live";
      ok: true;
      baseUrls: Record<ServiceName, string>;
    }
  | {
      mode: "live";
      ok: false;
      baseUrls: Record<ServiceName, string>;
      issues: RuntimeConfigIssue[];
    };

/**
 * Returns a UI-safe snapshot of the current runtime config. Used by
 * the diagnostics panel and tests. There are no secrets in the
 * runtime config today; the function still goes through an explicit
 * mapping so future credential-bearing fields cannot leak by
 * accident.
 */
export function summarizeRuntimeConfig(
  config: RuntimeConfig,
): RuntimeDiagnostics {
  if (config.mode === "mock") {
    return { mode: "mock", scenario: config.scenario };
  }
  if (config.ok) {
    return { mode: "live", ok: true, baseUrls: config.baseUrls };
  }
  return {
    mode: "live",
    ok: false,
    baseUrls: config.baseUrls,
    issues: config.issues,
  };
}
