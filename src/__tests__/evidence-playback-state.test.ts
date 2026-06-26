import { describe, expect, it } from "vitest";

import {
  aggregateDetailPlaybackStates,
  assessPlayback,
  classifyPlaybackState,
} from "@/app/(shell)/evidence/_components/evidencePlaybackState";
import type { ConsoleEvidenceMediaRef } from "@/app/(shell)/evidence/_components/consoleEvidenceSnapshot";

function base(over: Partial<ConsoleEvidenceMediaRef> = {}): ConsoleEvidenceMediaRef {
  return {
    recordingId: "REC-X",
    status: "finalized",
    statusLabel: "Finalized",
    sources: ["cabinFront"],
    segmentCount: 1,
    manifestExpiresAt: "2026-06-26T18:00:00Z",
    segments: [
      {
        segmentId: "S1",
        source: "cabinFront",
        sourceLabel: "Cabin front",
        startedAt: "2026-06-25T10:00:00Z",
        endedAt: "2026-06-25T10:01:00Z",
        checksumShort: "aaaa…bbbb",
      },
    ],
    timeline: [],
    ...over,
  };
}

describe("classifyPlaybackState", () => {
  it("finalized recording with segments → recordingMetadataAvailable", () => {
    expect(classifyPlaybackState(base())).toBe(
      "recordingMetadataAvailable",
    );
  });

  it("active recording → manifestUnavailable", () => {
    expect(
      classifyPlaybackState(
        base({
          status: "active",
          statusLabel: "Active",
          segments: [],
          manifestExpiresAt: "—",
          manifestError: "Recording is still active.",
        }),
      ),
    ).toBe("manifestUnavailable");
  });

  it("failed + checksum mismatch → retentionChecksumIssue", () => {
    expect(
      classifyPlaybackState(
        base({
          status: "failed",
          statusLabel: "Failed",
          segments: [],
          manifestError: "Recording finalize failed: checksum mismatch.",
        }),
      ),
    ).toBe("retentionChecksumIssue");
  });

  it("failed + storage error → storageUnavailable", () => {
    expect(
      classifyPlaybackState(
        base({
          status: "failed",
          statusLabel: "Failed",
          segments: [],
          manifestError: "Object storage backend unreachable.",
        }),
      ),
    ).toBe("storageUnavailable");
  });

  it("manifestError mentioning storage (active recording) → storageUnavailable", () => {
    expect(
      classifyPlaybackState(
        base({
          status: "active",
          statusLabel: "Active",
          manifestError: "Storage backend timed out while sealing manifest.",
        }),
      ),
    ).toBe("storageUnavailable");
  });

  it("finalized without segments → exportUnavailable", () => {
    expect(
      classifyPlaybackState(
        base({ segments: [], segmentCount: 0 }),
      ),
    ).toBe("exportUnavailable");
  });

  it("unknown status → exportUnavailable (never claims playback)", () => {
    expect(
      classifyPlaybackState(
        base({ status: "unknown", statusLabel: "Unknown", segments: [] }),
      ),
    ).toBe("exportUnavailable");
  });

  it("manifestError mentioning retention → retentionChecksumIssue", () => {
    expect(
      classifyPlaybackState(
        base({
          status: "finalized",
          statusLabel: "Finalized",
          segments: [],
          manifestError: "Recording dropped due to retention policy.",
        }),
      ),
    ).toBe("retentionChecksumIssue");
  });
});

describe("assessPlayback", () => {
  it("returns canonical state + label + reason for finalized recording", () => {
    const a = assessPlayback(base());
    expect(a.state).toBe("recordingMetadataAvailable");
    expect(a.label).toBe("Recording metadata available");
    expect(a.reason).toMatch(/playback pipeline/i);
  });

  it("falls back manifestError as reason when available", () => {
    const a = assessPlayback(
      base({
        status: "failed",
        statusLabel: "Failed",
        segments: [],
        manifestError: "Object storage backend unreachable.",
      }),
    );
    expect(a.state).toBe("storageUnavailable");
    expect(a.reason).toBe("Object storage backend unreachable.");
  });
});

describe("aggregateDetailPlaybackStates", () => {
  it("always includes exportUnavailable", () => {
    const states = aggregateDetailPlaybackStates([]);
    expect(states).toContain("exportUnavailable");
  });

  it("dedupes mixed states across refs", () => {
    const states = aggregateDetailPlaybackStates([
      base(),
      base({
        status: "failed",
        statusLabel: "Failed",
        segments: [],
        manifestError: "Checksum mismatch.",
      }),
      base({
        status: "active",
        statusLabel: "Active",
        segments: [],
        manifestError: "still active",
      }),
    ]);
    expect(states).toContain("recordingMetadataAvailable");
    expect(states).toContain("retentionChecksumIssue");
    expect(states).toContain("manifestUnavailable");
    expect(states).toContain("exportUnavailable");
    // No duplicates.
    expect(new Set(states).size).toBe(states.length);
  });
});
