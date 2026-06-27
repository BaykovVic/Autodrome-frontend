/**
 * Console-shaped installer / update view-model.
 *
 * Surfaces canonical `deployment-operations-service`:
 *   - `GET /ops/install/state` → `InstallState` →
 *     phase + prerequisites + degraded reasons.
 *   - `POST /ops/update` → `UpdateJob` → status +
 *     started/finished.
 *   - `POST /ops/backup` (через existing
 *     `liveOpsStartBackup`) для backup-before-update
 *     prompt.
 *
 * Per spec rule "Не запускаем shell/docker команды из
 * browser": frontend dispatches canonical commands и
 * рендерит status; никакого client-side shell execution.
 */

export type ConsoleInstallerPhase =
  | "not_installed"
  | "installing"
  | "installed"
  | "failed";

export type ConsoleInstallerOverallStatus =
  | "healthy"
  | "degraded"
  | "offline"
  | "unknown";

export type ConsoleInstallerPrerequisiteStatus =
  | "healthy"
  | "degraded"
  | "offline"
  | "unknown";

export type ConsoleInstallerPrerequisite = {
  name: string;
  status: ConsoleInstallerPrerequisiteStatus;
  /** Human-readable reason for non-healthy statuses. */
  reason?: string;
};

export type ConsoleUpdateJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type ConsoleUpdateJob = {
  jobId: string;
  packageId: string;
  version: string;
  status: ConsoleUpdateJobStatus;
  statusLabel: string;
  startedAt: string;
};

export type ConsoleInstallerSnapshot = {
  phase: ConsoleInstallerPhase;
  phaseLabel: string;
  version: string;
  overallStatus: ConsoleInstallerOverallStatus;
  overallStatusLabel: string;
  prerequisites: ConsoleInstallerPrerequisite[];
  degradedReasons: string[];
  checkedAt: string;
  /** Last dispatched update job (mock seeds null until dispatched). */
  lastUpdateJob: ConsoleUpdateJob | null;
};

export const INSTALLER_PHASE_LABELS: Record<
  ConsoleInstallerPhase,
  string
> = {
  not_installed: "Not installed",
  installing: "Installing",
  installed: "Installed",
  failed: "Failed",
};

export const INSTALLER_OVERALL_STATUS_LABELS: Record<
  ConsoleInstallerOverallStatus,
  string
> = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
  unknown: "Unknown",
};

export const UPDATE_JOB_STATUS_LABELS: Record<
  ConsoleUpdateJobStatus,
  string
> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};
