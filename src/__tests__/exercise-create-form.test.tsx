import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { ExerciseCreateForm } from "@/app/(shell)/exercises/_components/ExerciseCreateForm";

function renderForm() {
  const api = createMockAdapter("normal");
  render(
    <ExerciseCreateForm
      api={api}
      open
      onClose={() => undefined}
    />,
  );
}

describe("ExerciseCreateForm", () => {
  it("validates code and title before submit", () => {
    renderForm();
    fireEvent.click(
      screen.getByRole("button", { name: /^create exercise$/i }),
    );
    expect(screen.getByText(/Code is required/i)).toBeDefined();
    expect(screen.getByText(/Title is required/i)).toBeDefined();
  });

  it("submits ExerciseCreation payload and reports new id", async () => {
    renderForm();
    fireEvent.change(screen.getByRole("textbox", { name: /code/i }), {
      target: { value: "EX-NEW-01" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /title/i }), {
      target: { value: "Lane keeping" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^create exercise$/i }),
    );
    await waitFor(() =>
      expect(screen.getByText(/New exercise id/i)).toBeDefined(),
    );
    expect(screen.getByText(/created/i)).toBeDefined();
  });
});
