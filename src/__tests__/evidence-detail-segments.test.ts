import { describe, expect, it } from "vitest";

import {
  applyManifestToMediaRef,
  shortChecksum,
} from "@/app/(shell)/evidence/_components/liveEvidenceDetailLoader";
import { consoleEvidenceDetailFor } from "@/app/(shell)/evidence/_components/consoleEvidenceDetailFixtures";

describe("shortChecksum", () => {
  it("preserves short strings unchanged", () => {
    expect(shortChecksum("a1f4")).toBe("a1f4");
    expect(shortChecksum("aaaa…9c20")).toBe("aaaa…9c20");
  });

  it("truncates long hex SHA-256 to 4+ellipsis+4", () => {
    const full = "a".repeat(60) + "z".repeat(4);
    expect(shortChecksum(full)).toBe("aaaa…zzzz");
  });
});

describe("applyManifestToMediaRef: segment + timeline mapping", () => {
  it("flattens nested segments and exposes per-segment metadata", () => {
    const base = {
      recordingId: "REC-1",
      status: "active" as const,
      statusLabel: "Active",
      sources: [],
      segmentCount: 0,
      manifestExpiresAt: "—",
    };
    const result = applyManifestToMediaRef(base, {
      recordingId: "REC-1",
      segments: [
        {
          sourceId: "cabinFront",
          segments: [
            {
              segmentId: "S1",
              recordingId: "REC-1",
              sourceId: "cabinFront",
              startedAt: "2026-06-25T10:00:00Z",
              endedAt: "2026-06-25T10:01:00Z",
              objectKey: "obj-1",
              checksum:
                "a".repeat(60) + "z".repeat(4),
            },
          ],
        },
        {
          sourceId: "microphone",
          segments: [
            {
              segmentId: "S2",
              recordingId: "REC-1",
              sourceId: "microphone",
              startedAt: "2026-06-25T10:00:00Z",
              endedAt: "2026-06-25T10:01:30Z",
              objectKey: "obj-2",
              checksum: "deadbeef…",
            },
          ],
        },
      ],
      timelineMap: [
        {
          timelineFrom: "2026-06-25T10:00:00Z",
          timelineTo: "2026-06-25T10:01:00Z",
          sourceId: "cabinFront",
          segmentId: "S1",
        },
      ],
      expiresAt: "2026-06-26T18:00:00Z",
    });
    expect(result.segmentCount).toBe(2);
    expect(result.segments).toHaveLength(2);
    expect(result.segments?.[0]!.segmentId).toBe("S1");
    expect(result.segments?.[0]!.checksumShort).toBe("aaaa…zzzz");
    expect(result.segments?.[1]!.source).toBe("microphone");
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline?.[0]!.source).toBe("cabinFront");
    expect(result.timeline?.[0]!.segmentId).toBe("S1");
  });

  it("ignores unknown source kinds without throwing", () => {
    const base = {
      recordingId: "REC-1",
      status: "active" as const,
      statusLabel: "Active",
      sources: [],
      segmentCount: 0,
      manifestExpiresAt: "—",
    };
    const result = applyManifestToMediaRef(base, {
      recordingId: "REC-1",
      segments: [
        {
          sourceId: "unknownChannel",
          segments: [
            {
              segmentId: "S-X",
              recordingId: "REC-1",
              sourceId: "unknownChannel",
              startedAt: "2026-06-25T10:00:00Z",
              endedAt: "2026-06-25T10:01:00Z",
              objectKey: "obj-x",
              checksum: "x".repeat(64),
            },
          ],
        },
      ],
      timelineMap: [],
      expiresAt: "2026-06-26T18:00:00Z",
    });
    // Unknown source filtered out of view-model; count still
    // reflects raw segment count for honest UI.
    expect(result.segmentCount).toBe(1);
    expect(result.segments).toEqual([]);
    expect(result.timeline).toEqual([]);
  });
});

describe("consoleEvidenceDetailFor segment fixtures", () => {
  it("EVD-77210 fixture surfaces segments + timeline (canonical source labels)", () => {
    const d = consoleEvidenceDetailFor("EVD-77210");
    expect(d.mediaRefs[0]!.segments).toHaveLength(2);
    expect(d.mediaRefs[0]!.timeline).toHaveLength(2);
    expect(d.mediaRefs[0]!.segments?.[0]!.sourceLabel).toBe(
      "Cabin front",
    );
    expect(d.mediaRefs[0]!.segments?.[1]!.source).toBe("exteriorFront");
  });
});
