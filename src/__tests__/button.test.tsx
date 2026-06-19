import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "@/components/Button";

describe("Button", () => {
  it("renders provided children", () => {
    render(<Button>Save</Button>);
    expect(
      screen.getByRole("button", { name: /save/i }).textContent,
    ).toBe("Save");
  });

  it("invokes onClick handler when activated", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Trigger</Button>);
    fireEvent.click(screen.getByRole("button", { name: /trigger/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
