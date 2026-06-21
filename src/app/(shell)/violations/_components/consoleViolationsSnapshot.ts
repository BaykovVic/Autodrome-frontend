/**
 * Console-shaped violations snapshot.
 *
 * Backend Violation contract has violationId/severity/penalty/ruleId.
 * The visual surface adds design-only blocks (active-rule banner,
 * severity legend, required-evidence chips). Lives in snapshot until
 * backend ships a richer read model.
 */
export type ConsoleViolationSeverity = "critical" | "major" | "minor";
export type ConsoleViolationStatus = "active" | "deprecated";
export type ConsoleViolationEvidenceKind = "telemetry" | "video" | "photo" | "audio";

export type ConsoleViolation = {
  id: string;
  code: string;
  name: string;
  severity: ConsoleViolationSeverity;
  severityLabel: string;
  penalty: string;
  status: ConsoleViolationStatus;
  statusLabel: string;
  ruleId: string;
  requiredEvidence: ConsoleViolationEvidenceKind[];
};

export type ConsoleViolationsSnapshot = {
  activeRule: {
    id: string;
    version: string;
  };
  totals: {
    violations: number;
    active: number;
    deprecated: number;
  };
  violations: ConsoleViolation[];
};
