/**
 * Honest degraded-state taxonomy для media playback / export
 * / storage в evidence detail. Per spec rule "no video player
 * pretending real playback" — UI отображает explicit state
 * label и operator-visible reason, никогда не enabled
 * playback affordance до появления реального pipeline.
 *
 * Состояния выводятся detereministically из канонического
 * `ConsoleEvidenceMediaRef` view-model (status + segments +
 * manifestExpiresAt + manifestError) и не требуют отдельного
 * backend API.
 *
 * Состояния:
 *   - `recordingMetadataAvailable` — recording metadata
 *     известна (finalized + segments seal-able), но playback
 *     pipeline ещё не доступен.
 *   - `storageUnavailable` — manifestError содержит индикатор
 *     storage gap (backend unreachable, recording finalize
 *     failed для storage causes).
 *   - `manifestUnavailable` — recording still active или
 *     manifest endpoint returned no body / 409.
 *   - `exportUnavailable` — recording finalized но export
 *     pipeline ещё не shipped; этот state always применим
 *     для export action независимо от других ref states.
 *   - `retentionChecksumIssue` — recording failed после
 *     checksum mismatch / retention issue (manifestError
 *     mentions checksum, retention, integrity).
 *
 * Каждый state несёт canonical token + operator-visible label
 * + reason для tooltip / banner.
 */

import type {
  ConsoleEvidenceMediaRef,
  ConsoleEvidenceMediaRecordingStatus,
} from "./consoleEvidenceSnapshot";

export type ConsoleEvidencePlaybackState =
  | "recordingMetadataAvailable"
  | "storageUnavailable"
  | "manifestUnavailable"
  | "exportUnavailable"
  | "retentionChecksumIssue";

export type ConsoleEvidencePlaybackAssessment = {
  state: ConsoleEvidencePlaybackState;
  label: string;
  /** Operator-visible explanation for tooltip / banner. */
  reason: string;
};

export const PLAYBACK_STATE_LABELS: Record<
  ConsoleEvidencePlaybackState,
  string
> = {
  recordingMetadataAvailable: "Recording metadata available",
  storageUnavailable: "Storage unavailable",
  manifestUnavailable: "Manifest unavailable",
  exportUnavailable: "Export unavailable",
  retentionChecksumIssue: "Retention or checksum issue",
};

const CHECKSUM_KEYWORDS = [
  "checksum",
  "retention",
  "integrity",
];

const STORAGE_KEYWORDS = [
  "storage",
  "object",
  "s3",
  "blob",
  "filesystem",
];

function manifestErrorMentions(
  ref: ConsoleEvidenceMediaRef,
  keywords: readonly string[],
): boolean {
  const msg = ref.manifestError?.toLowerCase();
  if (!msg) return false;
  return keywords.some((k) => msg.includes(k));
}

/**
 * Resolves the playback-related state for the given media ref.
 *
 * Precedence:
 *   1. `retentionChecksumIssue` — strongest signal, blocks all
 *      downstream rendering.
 *   2. `storageUnavailable` — manifest error mentions storage.
 *   3. `manifestUnavailable` — manifest error без storage/
 *      checksum keywords, или status `active` (manifest не
 *      sealed yet).
 *   4. `recordingMetadataAvailable` — finalized recording с
 *      segments, playback pipeline ещё не shipped.
 *   5. `exportUnavailable` — fallback для finalized recording
 *      без segments / manifest TTL expired.
 */
export function classifyPlaybackState(
  ref: ConsoleEvidenceMediaRef,
): ConsoleEvidencePlaybackState {
  if (ref.status === "failed") {
    if (manifestErrorMentions(ref, CHECKSUM_KEYWORDS)) {
      return "retentionChecksumIssue";
    }
    if (manifestErrorMentions(ref, STORAGE_KEYWORDS)) {
      return "storageUnavailable";
    }
    return "retentionChecksumIssue";
  }
  if (ref.manifestError) {
    if (manifestErrorMentions(ref, CHECKSUM_KEYWORDS)) {
      return "retentionChecksumIssue";
    }
    if (manifestErrorMentions(ref, STORAGE_KEYWORDS)) {
      return "storageUnavailable";
    }
    return "manifestUnavailable";
  }
  if (ref.status === "active") {
    return "manifestUnavailable";
  }
  if (ref.status === "finalized") {
    if (ref.segments && ref.segments.length > 0) {
      return "recordingMetadataAvailable";
    }
    return "exportUnavailable";
  }
  // `unknown` status (or any unanticipated) collapses to
  // exportUnavailable — playback never pretends to be ready.
  return "exportUnavailable";
}

function reasonFor(
  state: ConsoleEvidencePlaybackState,
  ref: ConsoleEvidenceMediaRef,
): string {
  switch (state) {
    case "recordingMetadataAvailable":
      return `Recording metadata sealed (${ref.segments?.length ?? 0} segments). Playback pipeline ships with the dedicated playback feature.`;
    case "storageUnavailable":
      return (
        ref.manifestError ??
        "Storage backend is unreachable; manifest cannot be served."
      );
    case "manifestUnavailable":
      return (
        ref.manifestError ??
        "Playback manifest is not yet sealed for this recording."
      );
    case "retentionChecksumIssue":
      return (
        ref.manifestError ??
        "Recording marked failed for retention or checksum reasons."
      );
    case "exportUnavailable":
    default:
      return "Export pipeline ships with the dedicated reporting export feature.";
  }
}

export function assessPlayback(
  ref: ConsoleEvidenceMediaRef,
): ConsoleEvidencePlaybackAssessment {
  const state = classifyPlaybackState(ref);
  return {
    state,
    label: PLAYBACK_STATE_LABELS[state],
    reason: reasonFor(state, ref),
  };
}

/**
 * Top-level assessment for a whole detail: aggregates per-ref
 * playback states. Used for screen-level "what works" banner.
 */
export function aggregateDetailPlaybackStates(
  refs: readonly ConsoleEvidenceMediaRef[],
): ConsoleEvidencePlaybackState[] {
  const seen = new Set<ConsoleEvidencePlaybackState>();
  for (const ref of refs) {
    seen.add(classifyPlaybackState(ref));
  }
  // `exportUnavailable` is always present at the screen level
  // (no fake export readiness).
  seen.add("exportUnavailable");
  return Array.from(seen);
}

/** For test introspection — keep statuses enumerable. */
export const __KNOWN_RECORDING_STATUSES__: ConsoleEvidenceMediaRecordingStatus[] = [
  "active",
  "finalized",
  "failed",
  "unknown",
];
