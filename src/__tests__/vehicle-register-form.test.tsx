import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { VehicleRegisterForm } from "@/app/(shell)/vehicles/_components/VehicleRegisterForm";

function renderForm() {
  const api = createMockAdapter("normal");
  render(
    <VehicleRegisterForm
      api={api}
      open
      onClose={() => undefined}
    />,
  );
}

describe("VehicleRegisterForm", () => {
  it("blocks submit when required fields are missing", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
    expect(screen.getByText(/Plate number is required/i)).toBeDefined();
    expect(screen.getByText(/Model is required/i)).toBeDefined();
  });

  it("rejects non-integer manufacture year", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/plate number/i), {
      target: { value: "X777YY77" },
    });
    fireEvent.change(screen.getByLabelText(/^model$/i), {
      target: { value: "Toyota" },
    });
    fireEvent.change(screen.getByLabelText(/manufacture year/i), {
      target: { value: "twenty" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));
    expect(
      screen.getByText(/Manufacture year must be an integer/i),
    ).toBeDefined();
  });

  it("submits a contract-shaped payload and surfaces the new vehicle id", async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText(/plate number/i), {
      target: { value: "X777YY77" },
    });
    fireEvent.change(screen.getByLabelText(/^model$/i), {
      target: { value: "Toyota Camry" },
    });
    fireEvent.change(screen.getByLabelText(/manufacture year/i), {
      target: { value: "2023" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() =>
      expect(screen.getByText(/New vehicle id/i)).toBeDefined(),
    );
    expect(screen.getByText(/created/i)).toBeDefined();
  });
});
