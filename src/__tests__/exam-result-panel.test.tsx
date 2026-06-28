import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/exams",
}));

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import { ExamResultPanel } from "@/app/(shell)/exams/_components/ExamResultPanel";
import {
  absentExamResult,
  liveExamResultCalculate,
  liveExamResultGet,
  mapExamResultDtoToConsole,
} from "@/app/(shell)/exams/_components/liveExamResultLoader";
import { consoleExamResultFixture } from "@/app/(shell)/exams/_components/consoleExamResultFixtures";
import { outcomeTone } from "@/app/(shell)/exams/_components/consoleExamResult";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapExamResultDtoToConsole", () => {
  it("maps DTO into ready snapshot with operator labels", () => {
    const snap = mapExamResultDtoToConsole("EXM-1", {
      examId: "00000000-0000-0000-0000-000000000001",
      result: "passed",
      score: 88,
      violationCount: 2,
      criticalViolationCount: 0,
      calculatedFromStatus: "finished",
      calculatedAt: "2026-06-28T09:30:00Z",
    });
    expect(snap.status).toBe("ready");
    expect(snap.outcome).toBe("passed");
    expect(snap.outcomeLabel).toBe("Passed");
    expect(snap.score).toBe(88);
    expect(snap.scoreLabel).toBe("88");
    expect(snap.violationCount).toBe(2);
    expect(snap.criticalViolationCount).toBe(0);
    expect(snap.calculatedFromStatus).toBe("finished");
  });
});

describe("outcomeTone", () => {
  it("returns online/offline/standby for passed/failed/undefined", () => {
    expect(outcomeTone("passed")).toBe("online");
    expect(outcomeTone("failed")).toBe("offline");
    expect(outcomeTone(undefined)).toBe("standby");
  });
});

describe("liveExamResultGet", () => {
  it("returns an absent snapshot when backend responds with 404", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 404,
        url: "/exams/EXM-1/result",
        code: "EXAM_RESULT_NOT_FOUND",
        message: "result not calculated",
      });
    });
    const api = makeApi({
      exam: { GET } as unknown as AutodromeApi["exam"],
    });
    const snap = await liveExamResultGet(api, "EXM-1");
    expect(snap).toEqual(absentExamResult("EXM-1"));
  });

  it("rethrows non-404 errors so callers can surface them", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 500,
        url: "/exams/EXM-1/result",
        code: "EXAM_RESULT_FAIL",
        message: "boom",
      });
    });
    const api = makeApi({
      exam: { GET } as unknown as AutodromeApi["exam"],
    });
    await expect(liveExamResultGet(api, "EXM-1")).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("returns a ready snapshot when backend returns a result body", async () => {
    const GET = vi.fn(async () => ({
      data: {
        examId: "00000000-0000-0000-0000-000000000001",
        result: "failed",
        score: 31,
        violationCount: 5,
        criticalViolationCount: 2,
        calculatedFromStatus: "aborted",
        calculatedAt: "2026-06-28T09:30:00Z",
      },
    }));
    const api = makeApi({
      exam: { GET } as unknown as AutodromeApi["exam"],
    });
    const snap = await liveExamResultGet(api, "EXM-1");
    expect(snap.status).toBe("ready");
    expect(snap.outcome).toBe("failed");
    expect(snap.criticalViolationCount).toBe(2);
  });
});

describe("liveExamResultCalculate", () => {
  it("POSTs calculate-result with Idempotency-Key header and maps the snapshot", async () => {
    const POST = vi.fn(async () => ({
      data: {
        examId: "00000000-0000-0000-0000-000000000001",
        result: "passed",
        score: 91,
        violationCount: 1,
        criticalViolationCount: 0,
        calculatedFromStatus: "finished",
        calculatedAt: "2026-06-28T09:31:00Z",
      },
    }));
    const api = makeApi({
      exam: { POST } as unknown as AutodromeApi["exam"],
    });
    const snap = await liveExamResultCalculate(api, "EXM-1");
    expect(POST).toHaveBeenCalledTimes(1);
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe("/exams/{examId}/calculate-result");
    const opts = call[1] as {
      params: {
        path: { examId: string };
        header: { "Idempotency-Key": string };
      };
    };
    expect(opts.params.path.examId).toBe("EXM-1");
    expect(opts.params.header["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(snap.status).toBe("ready");
    expect(snap.outcome).toBe("passed");
  });
});

describe("ExamResultPanel", () => {
  it("renders ready snapshot with outcome badge + score + violations + Recalculate", async () => {
    render(
      <ExamResultPanel
        examId="EXM-1"
        canCalculate={true}
        getter={() => consoleExamResultFixture("EXM-1", "passed")}
      />,
    );
    expect(
      await screen.findByLabelText(/Exam EXM-1 result/i),
    ).toBeDefined();
    expect(screen.getByText("Passed")).toBeDefined();
    expect(screen.getByText("92")).toBeDefined();
    // Critical-violation pair: "1 (critical 0)"
    expect(screen.getByText(/1 \(critical 0\)/)).toBeDefined();
    const btn = screen.getByRole("button", {
      name: /^Recalculate$/i,
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("renders absent snapshot + Calculate button when no result yet", async () => {
    render(
      <ExamResultPanel
        examId="EXM-1"
        canCalculate={true}
        getter={() => consoleExamResultFixture("EXM-1", "absent")}
      />,
    );
    expect(
      await screen.findByText(/No result calculated yet/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /^Calculate result$/i }),
    ).toBeDefined();
  });

  it("disables Calculate when canCalculate=false and surfaces the reason in title", async () => {
    render(
      <ExamResultPanel
        examId="EXM-1"
        canCalculate={false}
        getter={() => consoleExamResultFixture("EXM-1", "absent")}
      />,
    );
    const btn = (await screen.findByRole("button", {
      name: /^Calculate result$/i,
    })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("title")).toMatch(
      /after the exam lifecycle reaches finished or aborted/i,
    );
  });

  it("Calculate click invokes calculator and updates the snapshot", async () => {
    let calls = 0;
    const calculator = vi.fn(() => {
      calls += 1;
      return consoleExamResultFixture("EXM-1", "passed");
    });
    render(
      <ExamResultPanel
        examId="EXM-1"
        canCalculate={true}
        getter={() => consoleExamResultFixture("EXM-1", "absent")}
        calculator={calculator}
      />,
    );
    const btn = await screen.findByRole("button", {
      name: /^Calculate result$/i,
    });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(calls).toBe(1);
    // After resolve the snapshot flips to ready and the button
    // label becomes Recalculate.
    expect(
      screen.getByRole("button", { name: /^Recalculate$/i }),
    ).toBeDefined();
  });

  it("surfaces calculator rejection in an alert without losing existing snapshot", async () => {
    const calculator = vi.fn(async () => {
      throw new Error("backend rejected calculate-result");
    });
    render(
      <ExamResultPanel
        examId="EXM-1"
        canCalculate={true}
        getter={() => consoleExamResultFixture("EXM-1", "passed")}
        calculator={calculator}
      />,
    );
    const btn = await screen.findByRole("button", {
      name: /^Recalculate$/i,
    });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(
      screen.getByRole("alert"),
    ).toHaveProperty("textContent");
    expect(
      screen.getByText(/backend rejected calculate-result/i),
    ).toBeDefined();
    // Snapshot preserved: outcome badge still rendered.
    expect(screen.getByText("Passed")).toBeDefined();
  });

  it("renders ApiErrorView with retry when getter rejects fatally", async () => {
    const error = Object.assign(new Error("getter failed"), {
      code: "RESULT_GET_FAIL",
      status: 500,
    });
    render(
      <ExamResultPanel
        examId="EXM-1"
        canCalculate={true}
        getter={() => Promise.reject(error)}
      />,
    );
    expect(await screen.findByText(/getter failed/i)).toBeDefined();
  });
});
