import { describe, expect, it } from "vitest";

import {
  applyEvidenceFilters,
  DEFAULT_FILTERS,
  recordingModalities,
} from "@/app/(shell)/evidence/_components/applyEvidenceFilters";
import type { RecordingItem } from "@/app/(shell)/evidence/_components/defaultRecordingsLoader";

const FINALIZED_AV: RecordingItem = {
  recordingId: "70000000-0000-4000-8000-000000000001",
  examRef: { examId: "30000000-0000-4000-8000-000000000001" },
  sources: [
    { sourceId: "cam-cabin-front", kind: "cabinFront" },
    { sourceId: "mic-cabin", kind: "microphone" },
  ],
  status: "finalized",
  startedAt: "2026-06-19T09:00:00Z",
  finalizedAt: "2026-06-19T09:45:00Z",
};

const FINALIZED_VIDEO_ONLY: RecordingItem = {
  recordingId: "70000000-0000-4000-8000-000000000002",
  examRef: { examId: "30000000-0000-4000-8000-000000000002" },
  sources: [
    { sourceId: "cam-cabin-side", kind: "cabinSide" },
    { sourceId: "cam-exterior-rear", kind: "exteriorRear" },
  ],
  status: "finalized",
  startedAt: "2026-06-19T10:00:00Z",
};

const ACTIVE: RecordingItem = {
  recordingId: "70000000-0000-4000-8000-000000000003",
  examRef: { examId: "30000000-0000-4000-8000-000000000003" },
  sources: [{ sourceId: "mic-cabin", kind: "microphone" }],
  status: "active",
  startedAt: "2026-06-19T11:00:00Z",
};

const ALL = [FINALIZED_AV, FINALIZED_VIDEO_ONLY, ACTIVE];

describe("applyEvidenceFilters", () => {
  it("returns all by default", () => {
    expect(applyEvidenceFilters(ALL, DEFAULT_FILTERS)).toEqual(ALL);
  });

  it("filters by status", () => {
    expect(
      applyEvidenceFilters(ALL, { ...DEFAULT_FILTERS, status: "active" }),
    ).toEqual([ACTIVE]);
  });

  it("filters by modality (audio)", () => {
    expect(
      applyEvidenceFilters(ALL, {
        ...DEFAULT_FILTERS,
        modality: "audio",
      }),
    ).toEqual([FINALIZED_AV, ACTIVE]);
  });

  it("filters by modality (video)", () => {
    expect(
      applyEvidenceFilters(ALL, {
        ...DEFAULT_FILTERS,
        modality: "video",
      }),
    ).toEqual([FINALIZED_AV, FINALIZED_VIDEO_ONLY]);
  });

  it("searches by examId substring", () => {
    expect(
      applyEvidenceFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "00000003",
      }),
    ).toEqual([ACTIVE]);
  });

  it("searches by source kind substring", () => {
    expect(
      applyEvidenceFilters(ALL, {
        ...DEFAULT_FILTERS,
        search: "exteriorRear",
      }),
    ).toEqual([FINALIZED_VIDEO_ONLY]);
  });

  it("combines status + modality (no overlap)", () => {
    expect(
      applyEvidenceFilters(ALL, {
        search: "",
        status: "active",
        modality: "video",
      }),
    ).toEqual([]);
  });
});

describe("recordingModalities", () => {
  it("derives audio from microphone source", () => {
    expect(recordingModalities(ACTIVE)).toEqual(["audio"]);
  });

  it("derives video from camera sources", () => {
    expect(recordingModalities(FINALIZED_VIDEO_ONLY)).toEqual(["video"]);
  });

  it("derives both for mixed sources", () => {
    expect(recordingModalities(FINALIZED_AV).sort()).toEqual(
      ["audio", "video"].sort(),
    );
  });
});
