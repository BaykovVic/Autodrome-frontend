import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { ExamLifecycleActions } from "@/app/(shell)/exams/_components/ExamLifecycleActions";
import type { ExamItem } from "@/app/(shell)/exams/_components/defaultExamsLoader";

const SCHEDULED: ExamItem = {
  examId: "11111111-2222-4333-8444-777777777777",
  candidateRef: { candidateId: "cand-anna" },
  vehicleRef: { vehicleId: "veh-renault" },
  examType: "autodromeBasic",
  status: "scheduled",
  scheduledAt: "2026-06-19T12:00:00Z",
  createdAt: "2026-06-19T10:00:00Z",
};

const IN_PROGRESS: ExamItem = { ...SCHEDULED, status: "inProgress" };
const FINISHED: ExamItem = { ...SCHEDULED, status: "finished" };

function renderActions(initial: ExamItem) {
  const api = createMockAdapter("normal");
  const onUpdated = vi.fn();
  render(<ExamLifecycleActions api={api} exam={initial} onUpdated={onUpdated} />);
  return { onUpdated };
}

describe("ExamLifecycleActions", () => {
  it("calls start endpoint and reports inProgress for a scheduled exam", async () => {
    const { onUpdated } = renderActions(SCHEDULED);
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
    const next = onUpdated.mock.calls[0][0] as ExamItem;
    expect(next.status).toBe("inProgress");
  });

  it("requires reason before submitting abort", async () => {
    const { onUpdated } = renderActions(SCHEDULED);
    fireEvent.click(screen.getByRole("button", { name: /^abort…$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^submit abort$/i }));
    expect(screen.getByText(/Reason is required/i)).toBeDefined();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("submits finish with outcome and reports finished status", async () => {
    const { onUpdated } = renderActions(IN_PROGRESS);
    fireEvent.click(screen.getByRole("button", { name: /^finish…$/i }));
    fireEvent.change(screen.getByLabelText(/^outcome$/i), {
      target: { value: "passed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^submit finish$/i }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
    const next = onUpdated.mock.calls[0][0] as ExamItem;
    expect(next.status).toBe("finished");
  });

  it("disables actions for a finished exam", () => {
    renderActions(FINISHED);
    expect(
      (screen.getByRole("button", { name: /^start$/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /^finish…$/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /^abort…$/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
