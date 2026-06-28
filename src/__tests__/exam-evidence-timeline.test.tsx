import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/exams/EXM-1/evidence-timeline",
}));

import type { AutodromeApi } from "@/api/adapter";
import { ExamEvidenceTimelineScreen } from "@/app/(shell)/exams/_components/ExamEvidenceTimelineScreen";
import {
  consoleExamEvidenceTimelineFor,
  consoleExamEvidenceTimelineEmpty,
} from "@/app/(shell)/exams/_components/consoleExamEvidenceTimelineFixtures";
import {
  evidenceLinkHref,
  evidenceToneForSeverity,
  EVIDENCE_SOURCE_LABELS,
  normalizeEvidenceSource,
} from "@/app/(shell)/exams/_components/consoleExamEvidenceTimeline";
import {
  liveExamEvidenceTimeline,
  mapEvidenceTimelineEntry,
} from "@/app/(shell)/exams/_components/liveExamEvidenceTimelineLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("normalizeEvidenceSource", () => {
  it("maps canonical sourceTypes to console buckets", () => {
    expect(normalizeEvidenceSource("lifecycle")).toBe("lifecycle");
    expect(normalizeEvidenceSource("violation-rule")).toBe("violation");
    expect(normalizeEvidenceSource("vehicle-telemetry")).toBe("telemetry");
    expect(normalizeEvidenceSource("media-archive")).toBe("media");
    expect(normalizeEvidenceSource("biometry-service")).toBe("biometry");
    expect(normalizeEvidenceSource("audio-trigger")).toBe("audio");
  });
  it("falls back to 'other' for unknown sourceTypes", () => {
    expect(normalizeEvidenceSource("weird-source")).toBe("other");
  });
});

describe("evidenceToneForSeverity", () => {
  it("maps severity strings to status dot tones", () => {
    expect(evidenceToneForSeverity("critical")).toBe("offline");
    expect(evidenceToneForSeverity("warning")).toBe("degraded");
    expect(evidenceToneForSeverity("info")).toBe("online");
    expect(evidenceToneForSeverity(undefined)).toBe("standby");
  });
});

describe("evidenceLinkHref", () => {
  it("maps media refKind to /evidence/{id} deep link", () => {
    expect(evidenceLinkHref("media-segment", "MED-1")).toBe(
      "/evidence/MED-1",
    );
    expect(evidenceLinkHref("evidence", "MED-1")).toBe("/evidence/MED-1");
  });
  it("returns undefined when refId missing or refKind unknown", () => {
    expect(evidenceLinkHref("violationOccurrence", "VIO-1")).toBeUndefined();
    expect(evidenceLinkHref("media-segment", undefined)).toBeUndefined();
  });
});

describe("EVIDENCE_SOURCE_LABELS", () => {
  it("covers every canonical source bucket", () => {
    expect(EVIDENCE_SOURCE_LABELS.lifecycle).toBe("Lifecycle");
    expect(EVIDENCE_SOURCE_LABELS.violation).toBe("Violation");
    expect(EVIDENCE_SOURCE_LABELS.telemetry).toBe("Telemetry");
    expect(EVIDENCE_SOURCE_LABELS.media).toBe("Media");
    expect(EVIDENCE_SOURCE_LABELS.biometry).toBe("Biometry");
    expect(EVIDENCE_SOURCE_LABELS.audio).toBe("Audio trigger");
    expect(EVIDENCE_SOURCE_LABELS.other).toBe("Other");
  });
});

describe("liveExamEvidenceTimeline", () => {
  it("dispatches GET /exams/{examId}/evidence-timeline and maps the page", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          {
            sourceType: "media-archive",
            refKind: "media-segment",
            refId: "MED-9F",
            occurredAt: "2026-06-26T10:00:00Z",
            label: "Cabin segment attached",
            severity: "info",
          },
          {
            sourceType: "violation-rule",
            refKind: "violationOccurrence",
            refId: "VIO-1",
            occurredAt: "2026-06-26T10:01:00Z",
            label: "Stop line crossed",
            severity: "warning",
          },
        ],
        nextPageToken: "tok-2",
      },
    }));
    const api = makeApi({
      exam: { GET } as unknown as AutodromeApi["exam"],
    });
    const snap = await liveExamEvidenceTimeline(api, "EXM-1", {
      pageSize: 50,
    });
    expect(GET).toHaveBeenCalledWith(
      "/exams/{examId}/evidence-timeline",
      {
        params: {
          path: { examId: "EXM-1" },
          query: { pageSize: 50 },
        },
      },
    );
    expect(snap.entries).toHaveLength(2);
    expect(snap.entries[0].source).toBe("media");
    expect(snap.entries[0].linkHref).toBe("/evidence/MED-9F");
    expect(snap.entries[1].source).toBe("violation");
    expect(snap.entries[1].tone).toBe("degraded");
    expect(snap.nextPageToken).toBe("tok-2");
  });

  it("propagates fetch errors instead of swallowing them", async () => {
    const GET = vi.fn(async () => {
      throw new Error("exam-service offline");
    });
    const api = makeApi({
      exam: { GET } as unknown as AutodromeApi["exam"],
    });
    await expect(
      liveExamEvidenceTimeline(api, "EXM-1"),
    ).rejects.toThrow(/offline/i);
  });

  it("falls back to a label assembled from refKind when DTO label missing", () => {
    const entry = mapEvidenceTimelineEntry({
      sourceType: "lifecycle",
      refKind: "examStarted",
      occurredAt: "2026-06-26T10:00:00Z",
    });
    expect(entry.label).toBe("examStarted (lifecycle)");
  });
});

describe("ExamEvidenceTimelineScreen", () => {
  it("renders breadcrumb, title and event list from fixtures", async () => {
    render(
      <ExamEvidenceTimelineScreen
        examId="EXM-1"
        loader={() => consoleExamEvidenceTimelineFor("EXM-1")}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /evidence timeline/i,
    });
    expect(screen.getByText(/^EXM-1$/)).toBeDefined();
    const list = screen.getByLabelText(/evidence timeline events/i);
    expect(within(list).getByText(/Exam created/i)).toBeDefined();
    expect(within(list).getByText(/Stop line crossed/i)).toBeDefined();
    expect(within(list).getByText(/Wrong-lane drift/i)).toBeDefined();
  });

  it("filter chips narrow the list to a single source bucket", async () => {
    render(
      <ExamEvidenceTimelineScreen
        examId="EXM-1"
        loader={() => consoleExamEvidenceTimelineFor("EXM-1")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(
      screen.getByRole("button", { name: /^Violation \(2\)$/ }),
    );
    const list = screen.getByLabelText(/evidence timeline events/i);
    expect(within(list).queryByText(/Exam created/i)).toBeNull();
    expect(within(list).getByText(/Stop line crossed/i)).toBeDefined();
    expect(within(list).getByText(/Wrong-lane drift/i)).toBeDefined();
  });

  it("filter chip showing zero count yields an empty filter message", async () => {
    render(
      <ExamEvidenceTimelineScreen
        examId="EXM-1"
        loader={() => ({
          examId: "EXM-1",
          entries: [
            {
              key: "lifecycle:examStarted:T",
              sourceType: "lifecycle",
              source: "lifecycle" as const,
              sourceLabel: "Lifecycle",
              refKind: "examStarted",
              occurredAt: "2026-06-26T10:00:00Z",
              label: "Exam started",
              tone: "online" as const,
            },
          ],
        })}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    fireEvent.click(
      screen.getByRole("button", { name: /^Violation \(0\)$/ }),
    );
    expect(
      screen.getByText(/No events for the Violation filter/i),
    ).toBeDefined();
  });

  it("media events render as deep links to /evidence/{refId}", async () => {
    render(
      <ExamEvidenceTimelineScreen
        examId="EXM-1"
        loader={() => consoleExamEvidenceTimelineFor("EXM-1")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const link = screen.getByRole("link", {
      name: /Front camera segment attached/i,
    });
    expect(link.getAttribute("href")).toBe("/evidence/MED-0001");
  });

  it("renders an EmptyState when exam-service reports no events", async () => {
    render(
      <ExamEvidenceTimelineScreen
        examId="EXM-1"
        loader={() => consoleExamEvidenceTimelineEmpty("EXM-1")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    expect(
      screen.getByText(/exam-service has no evidence events/i),
    ).toBeDefined();
  });

  it("renders Skeleton while loader is pending", () => {
    const pending = new Promise<never>(() => {});
    render(
      <ExamEvidenceTimelineScreen
        examId="EXM-1"
        loader={() =>
          pending as unknown as ReturnType<
            typeof consoleExamEvidenceTimelineFor
          >
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading evidence timeline/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "EVIDENCE_TIMELINE_FAIL",
      status: 500,
    });
    render(
      <ExamEvidenceTimelineScreen
        examId="EXM-1"
        loader={() => Promise.reject(error)}
      />,
    );
    expect(await screen.findByText(/loader failed/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });
});
