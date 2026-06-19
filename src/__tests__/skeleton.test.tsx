import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Skeleton } from "@/components/Skeleton";

describe("Skeleton", () => {
  it("renders an aria-busy status region", () => {
    render(<Skeleton lines={3} label="Loading candidates" />);
    const region = screen.getByRole("status", {
      name: /loading candidates/i,
    });
    expect(region.getAttribute("aria-busy")).toBe("true");
  });

  it("renders the requested number of placeholder lines", () => {
    const { container } = render(<Skeleton lines={5} />);
    expect(container.querySelectorAll("span").length).toBe(5);
  });

  it("clamps line count to a safe range", () => {
    const { container, rerender } = render(<Skeleton lines={0} />);
    expect(container.querySelectorAll("span").length).toBe(1);

    rerender(<Skeleton lines={42} />);
    expect(container.querySelectorAll("span").length).toBe(10);
  });
});
