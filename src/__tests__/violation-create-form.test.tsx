import { describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { ViolationCreateForm } from "@/app/(shell)/violations/_components/ViolationCreateForm";
import type { Violation } from "@/app/(shell)/violations/_components/useViolationsData";

function renderForm(onSuccess?: (v: Violation) => void) {
  const api = createMockAdapter("normal");
  render(
    <ViolationCreateForm
      api={api}
      open
      onClose={() => undefined}
      onSuccess={onSuccess}
    />,
  );
}

describe("ViolationCreateForm", () => {
  it("validates code and title before submit", () => {
    renderForm();
    fireEvent.click(
      screen.getByRole("button", { name: /^create violation$/i }),
    );
    expect(screen.getByText(/Code is required/i)).toBeDefined();
    expect(screen.getByText(/Title is required/i)).toBeDefined();
  });

  it("submits ViolationCreation and returns full contract-shaped Violation", async () => {
    const onSuccess = vi.fn();
    renderForm(onSuccess);

    fireEvent.change(screen.getByRole("textbox", { name: /code/i }), {
      target: { value: "RED_LIGHT_RUN" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /title/i }), {
      target: { value: "Ran a red light" },
    });
    // severity defaults to medium; switch to high
    fireEvent.change(
      screen.getByRole("combobox", { name: /severity/i }),
      { target: { value: "high" } },
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^create violation$/i }),
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const created = onSuccess.mock.calls[0][0] as Violation;
    // Codex R1 lesson: mock POST must return full contract-shape so the
    // workspace insert keeps all required fields visible.
    expect(created.violationId).toBeTruthy();
    expect(created.code).toBe("RED_LIGHT_RUN");
    expect(created.title).toBe("Ran a red light");
    expect(created.severity).toBe("high");
    expect(created.createdAt).toBeTruthy();
  });
});
