import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ApiError } from "@/api/errors";
import { ApiErrorView } from "@/components/ApiErrorView";

function makeApiError(): ApiError {
  return new ApiError({
    status: 404,
    code: "CANDIDATE_NOT_FOUND",
    message: "Candidate does not exist",
    correlationId: "11111111-2222-4333-8444-555555555555",
    timestamp: "2026-06-19T12:00:00Z",
    url: "/api/candidate/v1/candidates/abc",
  });
}

describe("ApiErrorView", () => {
  it("renders code, message and correlationId from ApiError", () => {
    render(<ApiErrorView error={makeApiError()} />);
    expect(screen.getByText("CANDIDATE_NOT_FOUND")).toBeDefined();
    expect(screen.getByText("Candidate does not exist")).toBeDefined();
    expect(
      screen.getByText("11111111-2222-4333-8444-555555555555"),
    ).toBeDefined();
  });

  it("copies correlationId to clipboard when copy button is pressed", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(globalThis, {
      navigator: { clipboard: { writeText } },
    });

    render(<ApiErrorView error={makeApiError()} />);

    const copyBtn = screen.getByRole("button", {
      name: /copy correlation-id/i,
    });
    fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith(
      "11111111-2222-4333-8444-555555555555",
    );
  });

  it("invokes onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ApiErrorView error={makeApiError()} onRetry={onRetry} />);

    const retry = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retry);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("falls back gracefully for a generic Error without correlationId", () => {
    render(<ApiErrorView error={new Error("Plain boom")} />);
    expect(screen.getByText("Error")).toBeDefined();
    expect(screen.getByText("Plain boom")).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /copy correlation-id/i }),
    ).toBeNull();
  });
});
