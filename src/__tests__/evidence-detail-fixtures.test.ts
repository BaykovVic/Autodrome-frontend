import { describe, expect, it } from "vitest";

import {
  __EVIDENCE_DETAIL_FIXTURE_KEYS__,
  consoleEvidenceDetailFor,
} from "@/app/(shell)/evidence/_components/consoleEvidenceDetailFixtures";

describe("consoleEvidenceDetailFor: linked refs", () => {
  it("returns telemetry evidence with media + report refs", () => {
    const d = consoleEvidenceDetailFor("EVD-77210");
    expect(d.evidence.id).toBe("EVD-77210");
    expect(d.evidence.examId).toBe("EXM-2026-0337");
    expect(d.mediaRefs).toHaveLength(1);
    expect(d.mediaRefs[0]!.status).toBe("finalized");
    expect(d.reportRefs).toHaveLength(1);
    expect(d.reportRefs[0]!.status).toBe("ready");
    expect(d.notes).toMatch(/sealed/i);
  });

  it("returns failed evidence with media manifestError + report reportError", () => {
    const d = consoleEvidenceDetailFor("EVD-77204");
    expect(d.evidence.status).toBe("failed");
    expect(d.mediaRefs[0]!.manifestError).toMatch(/checksum mismatch/i);
    expect(d.reportRefs[0]!.reportError).toMatch(/blocked/i);
  });

  it("returns multi-recording evidence (cabin finalized + ext active)", () => {
    const d = consoleEvidenceDetailFor("EVD-77211");
    expect(d.mediaRefs).toHaveLength(2);
    expect(d.mediaRefs[0]!.status).toBe("finalized");
    expect(d.mediaRefs[1]!.status).toBe("active");
    expect(d.mediaRefs[1]!.manifestError).toMatch(/still active/i);
  });

  it("returns biometry-only evidence with no media refs", () => {
    const d = consoleEvidenceDetailFor("EVD-77198");
    expect(d.mediaRefs).toEqual([]);
    expect(d.reportRefs).toHaveLength(1);
  });

  it("returns pending evidence with active recording + no report", () => {
    const d = consoleEvidenceDetailFor("EVD-77212");
    expect(d.evidence.status).toBe("pending");
    expect(d.mediaRefs[0]!.status).toBe("active");
    expect(d.reportRefs).toEqual([]);
  });

  it("returns honest not-found detail for unknown evidence id", () => {
    const d = consoleEvidenceDetailFor("EVD-DOES-NOT-EXIST");
    expect(d.evidence.id).toBe("EVD-DOES-NOT-EXIST");
    expect(d.evidence.examId).toBe("—");
    expect(d.mediaRefs).toEqual([]);
    expect(d.reportRefs).toEqual([]);
    expect(d.notes).toMatch(/not present in any fixture/i);
  });

  it("exposes canonical fixture keys for cross-reference", () => {
    expect(__EVIDENCE_DETAIL_FIXTURE_KEYS__).toEqual(
      expect.arrayContaining([
        "EVD-77210",
        "EVD-77211",
        "EVD-77204",
        "EVD-77205",
        "EVD-77198",
        "EVD-77212",
      ]),
    );
  });

  it("media source kinds use canonical camelCase tokens (no raw bitmask)", () => {
    for (const key of __EVIDENCE_DETAIL_FIXTURE_KEYS__) {
      const d = consoleEvidenceDetailFor(key);
      for (const ref of d.mediaRefs) {
        for (const s of ref.sources) {
          expect(s).toMatch(/^[a-z][a-zA-Z]*$/);
        }
      }
    }
  });
});
