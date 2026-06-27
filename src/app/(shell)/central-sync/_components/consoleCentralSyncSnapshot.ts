/**
 * Console-shaped central sync workspace snapshot.
 *
 * Surfaces canonical `optional-central-sync-service`:
 *   - `GET /sync/status` → SyncStatus (enabled + pending +
 *     license).
 *   - `POST /sync/run` → SyncJob (run pass).
 *   - `POST /sync/packages/export` / `import` → SyncPackage.
 *
 * Per spec rule "Central sync не должен блокировать
 * offline local node": когда enabled=false или central
 * unreachable, frontend явно показывает "offline /
 * disabled" state и НЕ блокирует local operations. UI
 * helps operator понимать что central sync optional.
 */

export type ConsoleSyncJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type ConsoleSyncScopeItem =
  | "read_models"
  | "analytics"
  | "license"
  | "update_metadata";

export type ConsoleLicenseStatus =
  | "valid"
  | "expired"
  | "grace"
  | "unknown";

export type ConsolePackageType =
  | "read_models"
  | "analytics"
  | "audit";

export type ConsoleCentralSyncStatus = {
  enabled: boolean;
  pendingItems: number;
  lastSuccessAt: string;
  lastError?: string;
  licenseStatus: ConsoleLicenseStatus;
  licenseStatusLabel: string;
  licenseExpiresAt?: string;
  offlineGraceUntil?: string;
};

export type ConsoleSyncPackage = {
  packageId: string;
  type: ConsolePackageType;
  typeLabel: string;
  schemaVersion: number;
  /** Short hash (`aaaa…bbbb`) for compact rendering. */
  checksumShort: string;
  createdAt: string;
};

export type ConsoleSyncJob = {
  jobId: string;
  status: ConsoleSyncJobStatus;
  statusLabel: string;
  scope: ConsoleSyncScopeItem[];
  pendingItems: number;
  startedAt: string;
};

export type ConsoleCentralSyncSnapshot = {
  status: ConsoleCentralSyncStatus;
  recentPackages: ConsoleSyncPackage[];
  lastSyncJob: ConsoleSyncJob | null;
  /** Honest offline note when central contour unavailable. */
  degradedNote?: string;
};

export const SYNC_JOB_STATUS_LABELS: Record<
  ConsoleSyncJobStatus,
  string
> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};

export const LICENSE_STATUS_LABELS: Record<
  ConsoleLicenseStatus,
  string
> = {
  valid: "Valid",
  expired: "Expired",
  grace: "Grace period",
  unknown: "Unknown",
};

export const PACKAGE_TYPE_LABELS: Record<
  ConsolePackageType,
  string
> = {
  read_models: "Read models",
  analytics: "Analytics",
  audit: "Audit",
};
