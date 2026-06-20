/**
 * Local frontend shape for the operator-facing backup snapshots list.
 *
 * The backend does not yet expose a backup/restore endpoint; this type
 * lives next to the workspace until a canonical DTO is added to the
 * contracts.
 */
export type BackupKind = "full" | "incremental";

export type BackupStatus = "completed" | "running" | "failed";

export type BackupSnapshot = {
  id: string;
  createdAt: string;
  kind: BackupKind;
  status: BackupStatus;
  sizeMb: number;
  description?: string;
};

const DEFAULT_BACKUPS: BackupSnapshot[] = [
  {
    id: "snap-2026-06-18-night",
    createdAt: "2026-06-18T22:00:00Z",
    kind: "full",
    status: "completed",
    sizeMb: 1840,
    description: "Scheduled nightly snapshot.",
  },
  {
    id: "snap-2026-06-19-morning",
    createdAt: "2026-06-19T07:00:00Z",
    kind: "incremental",
    status: "completed",
    sizeMb: 96,
  },
  {
    id: "snap-2026-06-19-pre-update",
    createdAt: "2026-06-19T09:30:00Z",
    kind: "full",
    status: "failed",
    sizeMb: 0,
    description: "Pre-update snapshot failed; investigate disk space.",
  },
];

export function defaultBackups(): BackupSnapshot[] {
  return DEFAULT_BACKUPS;
}
