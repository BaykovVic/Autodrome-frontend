import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { CandidateRegisterForm } from "@/app/(shell)/candidates/_components/CandidateRegisterForm";

function renderForm() {
  const api = createMockAdapter("normal");
  render(
    <CandidateRegisterForm
      api={api}
      open
      onClose={() => undefined}
    />,
  );
}

describe("CandidateRegisterForm", () => {
  it("blocks submit when required fields are empty and surfaces ValidationErrors", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    expect(screen.getByText(/First name is required/i)).toBeDefined();
    expect(screen.getByText(/Last name is required/i)).toBeDefined();
    expect(screen.getByText(/Birth date is required/i)).toBeDefined();
    expect(screen.getByText(/Document number is required/i)).toBeDefined();
  });

  it("submits a contract-shaped payload through the mock adapter and shows the new id", async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Eve" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Yamamoto" },
    });
    fireEvent.change(screen.getByLabelText(/birth date/i), {
      target: { value: "2001-02-03" },
    });
    fireEvent.change(screen.getByLabelText(/document number/i), {
      target: { value: "P1234567" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    const successBadge = await waitFor(() =>
      screen.getByText(/New candidate id/i),
    );
    expect(successBadge).toBeDefined();
    expect(screen.getByText(/created/i)).toBeDefined();
  });
});
