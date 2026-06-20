import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { ExamCreateForm } from "@/app/(shell)/exams/_components/ExamCreateForm";

function renderForm() {
  const api = createMockAdapter("normal");
  render(
    <ExamCreateForm
      api={api}
      open
      onClose={() => undefined}
    />,
  );
}

describe("ExamCreateForm", () => {
  it("validates UUID and scheduledAt before submit", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/candidate id/i), {
      target: { value: "not-a-uuid" },
    });
    fireEvent.change(screen.getByLabelText(/vehicle id/i), {
      target: { value: "also-not" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create exam$/i }));

    expect(
      screen.getByText(/Candidate id must be a UUID/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Vehicle id must be a UUID/i),
    ).toBeDefined();
    expect(
      screen.getByText(/Scheduled time is required/i),
    ).toBeDefined();
  });

  it("submits a contract-shaped payload and surfaces the new exam id", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/candidate id/i), {
      target: { value: "11111111-2222-4333-8444-555555555555" },
    });
    fireEvent.change(screen.getByLabelText(/vehicle id/i), {
      target: { value: "11111111-2222-4333-8444-666666666666" },
    });
    fireEvent.change(screen.getByLabelText(/scheduled at/i), {
      target: { value: "2026-07-01T09:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^create exam$/i }));

    await waitFor(() =>
      expect(screen.getByText(/New exam id/i)).toBeDefined(),
    );
    expect(screen.getByText(/created/i)).toBeDefined();
  });
});
