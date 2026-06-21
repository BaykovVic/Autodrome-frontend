/**
 * Console-shaped evidence snapshot.
 *
 * Canonical media-archive-service OpenAPI contract has no
 * `GET /evidence` list operation today; the inspector surface
 * stays fixture-driven until a list read model lands.
 *
 * The visual surface adds design-only blocks (per-evidence
 * SHA-256 short form, modality chip palette, offline preview
 * placeholder, sealed/pending/failed status). All evidence here is
 * sealed reference metadata only — no real binary playback or
 * export ever fires.
 */
export type ConsoleEvidenceType =
  | "telemetry"
  | "video"
  | "photo"
  | "audio"
  | "biometry";

export type ConsoleEvidenceStatus = "sealed" | "pending" | "failed";

export type ConsoleEvidence = {
  id: string;
  examId: string;
  type: ConsoleEvidenceType;
  typeLabel: string;
  captured: string;
  size: string;
  status: ConsoleEvidenceStatus;
  statusLabel: string;
  sha256: string;
  previewAvailable: boolean;
};

export type ConsoleEvidenceSnapshot = {
  totals: {
    evidence: number;
    sealed: number;
    failed: number;
  };
  degraded: boolean;
  evidence: ConsoleEvidence[];
};
