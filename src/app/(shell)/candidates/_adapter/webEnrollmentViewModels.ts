/**
 * Web enrollment view-model barrel.
 *
 * This module is the single published surface for **typed view-models**
 * the Web enrollment screens consume. Every type below is a
 * UI-shaped read model derived from (and intentionally decoupled
 * from) canonical OpenAPI DTOs in `@/contracts/types/*`.
 *
 * Keeping view-models out of UI components and behind this barrel
 * gives us three things:
 *
 *   1. The render layer never imports raw generated DTOs — so OpenAPI
 *      drift cannot reshape the screens. The adapter
 *      (`webEnrollmentAdapter.ts`) is the only file allowed to bridge
 *      contract DTOs to these view-models.
 *
 *   2. Each view-model captures design-only blocks (masked DOB,
 *      eligibility chip, enrollment state, capture progress, audit
 *      timeline, etc.) that have no canonical backend equivalent
 *      yet. Missing contracts are documented in `README.md` in this
 *      folder.
 *
 *   3. Future live-binding plugs in by implementing
 *      `WebEnrollmentAdapter` against real services. The render layer
 *      and tests do not need to change.
 *
 * The eight enrollment view-models named in the spec are listed
 * below with the surface that owns them:
 *
 *   - candidate registry row     → ConsoleCandidate (CandidatesScreen)
 *   - candidate detail           → ConsoleCandidate identity + enrollment block
 *                                  (CandidatesScreen detail aside)
 *   - enrollment state           → CandidateEnrollmentState (9 values)
 *   - enrollment channel         → EnrollmentChannelsSnapshot
 *                                  (StartEnrollmentDialog)
 *   - registrar device           → RegistrarChannelState
 *   - local camera station       → CameraStationSnapshot
 *                                  (CameraStationScreen +
 *                                  CaptureWindowSurface)
 *   - enrollment session         → EnrollmentSession
 *                                  (EnrollmentSessionMonitor)
 *   - session timeline event     → EnrollmentSessionTimelineEntry
 */

// --- Candidate registry row + detail + enrollment state ----------------
export type {
  ConsoleCandidatesSnapshot,
  ConsoleCandidate,
  CandidateRegistrationState,
  CandidateEligibilityState,
  CandidateEnrollmentState,
} from "../_components/consoleRegistrySnapshot";

// --- Enrollment channel + registrar device + local camera channel state
export type {
  EnrollmentChannelsSnapshot,
  EnrollmentScenario,
  EnrollmentRegistrarState,
  RegistrarChannelState,
  LocalCameraStateKind,
  LocalCameraChannelState,
  EnrollmentAttempt,
} from "../_components/consoleEnrollmentChannels";

// --- Enrollment session + session timeline event -----------------------
export type {
  EnrollmentSession,
  EnrollmentSessionSnapshot,
  EnrollmentSessionState,
  EnrollmentSessionScenario,
  EnrollmentSessionChannel,
  EnrollmentSessionTimelineEntry,
} from "../_components/consoleEnrollmentSession";

// --- Camera station + capture window -----------------------------------
export type {
  CameraStationSnapshot,
  CameraStationScenario,
  CameraDevice,
  CameraStatusKind,
  CameraPermissionState,
  CaptureWindowState,
  CaptureWindowKind,
  QualityProgressItem,
  CaptureFrameSummary,
  CaptureCheck,
} from "../_components/consoleCameraStation";

// Eligibility / retry / cancel / terminal sets are part of the
// view-model contract too — adapters that change session state must
// honour the same eligibility rules.
export {
  TERMINAL_STATES as ENROLLMENT_SESSION_TERMINAL_STATES,
  RETRY_ELIGIBLE as ENROLLMENT_SESSION_RETRY_ELIGIBLE,
  CANCEL_ELIGIBLE as ENROLLMENT_SESSION_CANCEL_ELIGIBLE,
} from "../_components/consoleEnrollmentSession";
export {
  STATION_ACTIVE as CAMERA_STATION_ACTIVE,
  STATION_TERMINAL as CAMERA_STATION_TERMINAL,
} from "../_components/consoleCameraStation";
