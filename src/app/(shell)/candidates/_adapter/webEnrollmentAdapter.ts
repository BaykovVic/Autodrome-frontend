import type { MockScenario } from "@/api/mock/scenarios";

import { consoleCandidatesFor } from "../_components/consoleRegistryFixtures";
import { consoleEnrollmentChannelsFor } from "../_components/consoleEnrollmentChannelsFixtures";
import {
  consoleEnrollmentSessionFor,
  cancelAppendedTimeline,
  retryAppendedTimeline,
} from "../_components/consoleEnrollmentSessionFixtures";
import { consoleCameraStationFor } from "../_components/consoleCameraStationFixtures";

import type {
  CameraStationScenario,
  CameraStationSnapshot,
  ConsoleCandidatesSnapshot,
  EnrollmentChannelsSnapshot,
  EnrollmentScenario,
  EnrollmentSessionScenario,
  EnrollmentSessionSnapshot,
} from "./webEnrollmentViewModels";

/**
 * `WebEnrollmentAdapter` is the **single boundary** between the Web
 * enrollment UI and whatever backs the data — currently the
 * `MockWebEnrollmentAdapter`, eventually a typed live adapter
 * against `candidate-service` / `biometry-service` /
 * `media-archive-service` / Android registrar transport.
 *
 * Method shape rules:
 *
 *   - **Read methods** return UI view-models (snapshots), never raw
 *     OpenAPI DTOs. The adapter owns the mapping.
 *   - **Command methods** take and return view-models / view-model
 *     deltas. Their job is to drive a state transition that the UI
 *     can render directly (e.g. an appended timeline entry).
 *   - Promises are used everywhere so the live adapter can do
 *     network calls; the mock adapter resolves synchronously.
 *
 * Hooks (`useConsoleCandidates`, `useConsoleEnrollmentSession`, …)
 * currently consume a `loader` prop instead of a whole adapter — that
 * keeps existing tests stable and lets each hook accept its own DI.
 * The adapter interface here documents the canonical method shape so
 * a future refactor can wire hooks to the adapter without rethinking
 * the boundary.
 *
 * Missing canonical contracts the adapter currently masks (full
 * notes in `README.md`):
 *
 *   - `GET /candidates` list operation;
 *   - `GET /enrollment-channels` device discovery;
 *   - `GET /enrollment-sessions/{id}` session read model;
 *   - `POST /enrollment-sessions/{id}/commands/{retry|cancel}` action
 *     endpoints;
 *   - `GET /camera-stations/{id}` station + capture state.
 */
export interface WebEnrollmentAdapter {
  // -- Reads -----------------------------------------------------------

  /** Candidate registry rows + detail-pane data. */
  loadCandidates(): Promise<ConsoleCandidatesSnapshot>;

  /** Channel discovery for the Start enrollment dialog. */
  loadEnrollmentChannels(): Promise<EnrollmentChannelsSnapshot>;

  /** A specific enrollment session monitor + audit timeline. */
  loadEnrollmentSession(
    sessionId: string,
  ): Promise<EnrollmentSessionSnapshot>;

  /** Camera station device + capture window state. */
  loadCameraStation(): Promise<CameraStationSnapshot>;

  // -- Commands --------------------------------------------------------
  //
  // Command surface is declared on the interface so live
  // implementations have a deterministic contract. The mock adapter
  // performs the same state transitions the screen overrides already
  // do today — that way swapping in a live adapter does not change
  // operator UX.

  /** Re-send the enrollment command for the given session. */
  retryEnrollmentSession(
    sessionId: string,
  ): Promise<EnrollmentSessionSnapshot>;

  /** Cancel the given enrollment session. */
  cancelEnrollmentSession(
    sessionId: string,
  ): Promise<EnrollmentSessionSnapshot>;
}

/**
 * Scenario keys the mock adapter accepts at construction time.
 * Defaults are picked to mirror the env-driven defaults each hook
 * already uses (`NEXT_PUBLIC_MOCK_SCENARIO=normal`, etc.) so test
 * behaviour without explicit scenario stays identical.
 */
export type MockWebEnrollmentAdapterOptions = {
  candidatesScenario?: MockScenario;
  enrollmentChannelsScenario?: EnrollmentScenario;
  enrollmentSessionScenario?: EnrollmentSessionScenario;
  cameraStationScenario?: CameraStationScenario;
};

export const MOCK_WEB_ENROLLMENT_DEFAULTS = {
  candidatesScenario: "normal" as const satisfies MockScenario,
  enrollmentChannelsScenario:
    "registrar-online" as const satisfies EnrollmentScenario,
  enrollmentSessionScenario:
    "capturing" as const satisfies EnrollmentSessionScenario,
  cameraStationScenario:
    "capturing" as const satisfies CameraStationScenario,
};

/**
 * Mock implementation of `WebEnrollmentAdapter`. Wraps the per-surface
 * scenario fixtures that the screens already use today. No live API
 * calls, no `getUserMedia`, no WebSocket/SSE.
 */
export function createMockWebEnrollmentAdapter(
  options: MockWebEnrollmentAdapterOptions = {},
): WebEnrollmentAdapter {
  const candidatesScenario =
    options.candidatesScenario ??
    MOCK_WEB_ENROLLMENT_DEFAULTS.candidatesScenario;
  const enrollmentChannelsScenario =
    options.enrollmentChannelsScenario ??
    MOCK_WEB_ENROLLMENT_DEFAULTS.enrollmentChannelsScenario;
  const enrollmentSessionScenario =
    options.enrollmentSessionScenario ??
    MOCK_WEB_ENROLLMENT_DEFAULTS.enrollmentSessionScenario;
  const cameraStationScenario =
    options.cameraStationScenario ??
    MOCK_WEB_ENROLLMENT_DEFAULTS.cameraStationScenario;

  return {
    loadCandidates: async () => consoleCandidatesFor(candidatesScenario),
    loadEnrollmentChannels: async () =>
      consoleEnrollmentChannelsFor(enrollmentChannelsScenario),
    loadEnrollmentSession: async (sessionId) => {
      // The mock adapter has a single canonical reference session id
      // (`ENR-9F41`) — propagate the caller's id into the returned
      // snapshot so deeplinks render with the requested id while
      // staying on the chosen scenario's fixture.
      const base = consoleEnrollmentSessionFor(enrollmentSessionScenario);
      return {
        ...base,
        session: { ...base.session, id: sessionId },
      };
    },
    loadCameraStation: async () =>
      consoleCameraStationFor(cameraStationScenario),

    // Command surface: the mock adapter replays the same overlay
    // behaviour the screens use today (timeline append + state
    // transition).
    retryEnrollmentSession: async (sessionId) => {
      const base = consoleEnrollmentSessionFor(enrollmentSessionScenario);
      return {
        ...base,
        session: {
          ...base.session,
          id: sessionId,
          state: "queued",
          stateLabel: "Queued · retry",
          ttl: "04:55",
          lastEventAt: "—",
          timeline: retryAppendedTimeline(base.session.timeline),
        },
      };
    },
    cancelEnrollmentSession: async (sessionId) => {
      const base = consoleEnrollmentSessionFor(enrollmentSessionScenario);
      return {
        ...base,
        session: {
          ...base.session,
          id: sessionId,
          state: "cancelled",
          stateLabel: "Cancelled",
          ttl: "—",
          lastEventAt: "—",
          timeline: cancelAppendedTimeline(base.session.timeline),
        },
      };
    },
  };
}

/**
 * Default mock adapter instance — production-by-default for the
 * mock baseline. Tests should construct their own adapter via
 * `createMockWebEnrollmentAdapter({ ... })` when they need a
 * specific scenario combination.
 */
export const mockWebEnrollmentAdapter: WebEnrollmentAdapter =
  createMockWebEnrollmentAdapter();
