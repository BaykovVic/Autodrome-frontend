import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DegradedState } from "@/components/DegradedState";

describe("DegradedState", () => {
  it("renders the service name and a default description", () => {
    render(<DegradedState service="vehicle-service" />);
    expect(screen.getByText("vehicle-service")).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("uses provided description when supplied", () => {
    render(
      <DegradedState
        service="vehicle-service"
        description="Returning cached data only."
      />,
    );
    expect(
      screen.getByText("Returning cached data only."),
    ).toBeDefined();
  });

  it("triggers onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(
      <DegradedState service="vehicle-service" onRetry={onRetry} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
