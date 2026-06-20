import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { OperationsTabs } from "@/app/(shell)/operations/_components/OperationsTabs";

describe("OperationsTabs", () => {
  it("renders the four sections and starts on service health", () => {
    render(<OperationsTabs />);
    expect(
      screen.getByRole("tab", { name: /service health/i, selected: true }),
    ).toBeDefined();
    expect(screen.getByRole("tab", { name: /diagnostics/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /backups/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /logs/i })).toBeDefined();
  });

  it("switches to the diagnostics tab on click", () => {
    render(<OperationsTabs />);
    fireEvent.click(screen.getByRole("tab", { name: /diagnostics/i }));
    expect(
      screen.getByRole("region", { name: /diagnostics overview/i }),
    ).toBeDefined();
  });

  it("switches to the backups tab on click", () => {
    render(<OperationsTabs />);
    fireEvent.click(screen.getByRole("tab", { name: /backups/i }));
    expect(
      screen.getByRole("region", { name: /backups overview/i }),
    ).toBeDefined();
  });

  it("switches to the logs tab on click", () => {
    render(<OperationsTabs />);
    fireEvent.click(screen.getByRole("tab", { name: /logs/i }));
    expect(
      screen.getByRole("region", { name: /logs and export/i }),
    ).toBeDefined();
  });
});
