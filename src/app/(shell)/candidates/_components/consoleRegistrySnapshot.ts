/**
 * Console-shaped candidate snapshot.
 *
 * Backend Candidate contract has firstName/lastName/status/etc. The
 * registry visual surface adds two design-only blocks — face
 * verification badge in the table and a richer detail pane (face
 * verification confidence, contact info). These fields live in the
 * snapshot rather than the contract so the UI can render the
 * Autodrome Console reference without changing canonical types.
 */
export type CandidateRegistrationState =
  | "registered"
  | "pending"
  | "incomplete";

export type CandidateFaceState =
  | "verified"
  | "pending"
  | "unverified";

export type ConsoleCandidate = {
  id: string;
  name: string;
  category: string;
  registration: {
    state: CandidateRegistrationState;
    label: string;
  };
  face: {
    state: CandidateFaceState;
    label: string;
    confidence?: string;
  };
  examCount: number;
  dateOfBirth: string;
  phone: string;
  lastActivity: string;
};

export type ConsoleCandidatesSnapshot = {
  totals: {
    total: number;
    awaitingFaceVerification: number;
  };
  candidates: ConsoleCandidate[];
};
