import { describe, expect, it } from "vitest";

import {
  deriveMediaArchiveHealth,
  MEDIA_ARCHIVE_HEALTH_LABELS,
  type ConsoleEvidenceMediaRef,
  type ConsoleExamMediaIndex,
} from "@/app/(shell)/evidence/_components/consoleEvidenceSnapshot";

function ref(opts: { manifestError?: string }): ConsoleEvidenceMediaRef {
  return {
    recordingId: "REC",
    status: opts.manifestError ? "unknown" : "finalized",
    statusLabel: opts.manifestError ? "Unknown" : "Finalized",
    sources: [],
    segmentCount: 0,
    manifestExpiresAt: "—",
    manifestError: opts.manifestError,
  };
}

function index(error?: string): ConsoleExamMediaIndex {
  return { examId: "EXM-1", recordings: [], indexError: error };
}

describe("deriveMediaArchiveHealth", () => {
  it("returns 'ok' when no mediaRefs and no examMediaIndex error", () => {
    expect(deriveMediaArchiveHealth([])).toBe("ok");
    expect(deriveMediaArchiveHealth([], index())).toBe("ok");
  });
  it("returns 'degraded' when there are no mediaRefs but the exam index failed", () => {
    expect(deriveMediaArchiveHealth([], index("down"))).toBe("degraded");
  });
  it("returns 'ok' when all mediaRefs are healthy and index is healthy", () => {
    expect(
      deriveMediaArchiveHealth([ref({}), ref({})], index()),
    ).toBe("ok");
  });
  it("returns 'partial' when some mediaRefs failed but not all", () => {
    expect(
      deriveMediaArchiveHealth(
        [ref({}), ref({ manifestError: "x" })],
        index(),
      ),
    ).toBe("partial");
  });
  it("returns 'degraded' when ALL mediaRefs failed AND exam index failed", () => {
    expect(
      deriveMediaArchiveHealth(
        [ref({ manifestError: "a" }), ref({ manifestError: "b" })],
        index("down"),
      ),
    ).toBe("degraded");
  });
  it("returns 'partial' when ALL mediaRefs failed but exam index is ok (incomplete picture)", () => {
    expect(
      deriveMediaArchiveHealth(
        [ref({ manifestError: "a" })],
        index(),
      ),
    ).toBe("partial");
  });
});

describe("MEDIA_ARCHIVE_HEALTH_LABELS", () => {
  it("covers every health level", () => {
    expect(MEDIA_ARCHIVE_HEALTH_LABELS.ok).toMatch(/OK/);
    expect(MEDIA_ARCHIVE_HEALTH_LABELS.partial).toMatch(/partial/i);
    expect(MEDIA_ARCHIVE_HEALTH_LABELS.degraded).toMatch(/degraded/i);
  });
});
