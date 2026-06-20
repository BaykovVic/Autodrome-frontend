import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { LogsPanel } from "@/app/(shell)/operations/_components/LogsPanel";

describe("LogsPanel", () => {
  it("renders the not-connected empty state by default", () => {
    render(<LogsPanel />);
    expect(
      screen.getByText(/Recent logs are not connected yet/i),
    ).toBeDefined();
    expect(
      screen.getByText(/No export has been requested in this session/i),
    ).toBeDefined();
  });

  it("records a preview export request with pending-wiring badge", () => {
    render(<LogsPanel />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /record log export request/i,
      }),
    );
    expect(screen.getByText(/pending wiring/i)).toBeDefined();
    expect(
      screen.getByText(/Nothing was downloaded/i),
    ).toBeDefined();
  });
});
