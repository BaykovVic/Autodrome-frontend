/**
 * Console-shaped candidate snapshot, reworked for the Web Operator
 * Console reference (`design/web-operator-console/Web Operator
 * Console.dc.html`, REGISTRY section).
 *
 * Backend Candidate contract has firstName/lastName/status/etc.
 * The registry visual surface adds design-only blocks: masked DOB
 * for privacy, license/document number, eligibility decision, face
 * enrollment panel (template status + source device + 9 enrollment
 * states). These live in the snapshot rather than the canonical
 * contract so the UI can render without changing OpenAPI types.
 *
 * Important separation: this surface tracks face *enrollment* — the
 * one-time capture of a candidate's biometric template. Per-exam
 * face verification / passive liveness checks live elsewhere and
 * are NOT mixed into this UI.
 */

export type CandidateRegistrationState =
  | "registered"
  | "pending"
  | "incomplete";

export type CandidateEligibilityState =
  | "approved"
  | "pending"
  | "denied"
  | "expired";

/**
 * Face enrollment lifecycle. Nine states from the spec — captured
 * here as a closed union so widgets can switch on every variant.
 */
export type CandidateEnrollmentState =
  | "enrolled"
  | "capturing"
  | "command-sent"
  | "ready-to-enroll"
  | "not-enrolled"
  | "quality-failed"
  | "needs-retry"
  | "device-unavailable"
  | "session-expired";

export type ConsoleCandidate = {
  id: string;
  name: string;
  category: string;
  registration: {
    state: CandidateRegistrationState;
    label: string;
  };
  /**
   * Privacy-friendly display string for DOB. Day/month masked,
   * year visible (per reference, e.g. `**.**.2001`).
   */
  maskedDob: string;
  document: string;
  eligibility: {
    state: CandidateEligibilityState;
    label: string;
  };
  enrollment: {
    state: CandidateEnrollmentState;
    label: string;
    /** Template revision / capture moniker, e.g. `tpl-7` or `—`. */
    templateStatus: string;
    /** Originating device, e.g. `CAM-A2-01` or `—`. */
    sourceDevice: string;
    /** Timestamp string for the last enrollment, e.g. `today 09:30`. */
    lastEnrollment: string;
  };
};

export type ConsoleCandidatesSnapshot = {
  totals: {
    total: number;
    awaitingEnrollment: number;
  };
  candidates: ConsoleCandidate[];
};
