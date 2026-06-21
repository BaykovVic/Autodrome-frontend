import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusDot } from "@/components";

describe("StatusDot", () => {
  it("renders a labelled dot as an image role by default", () => {
    render(<StatusDot variant="online" label="Node NODE-A2 ONLINE" />);
    const dot = screen.getByRole("img", {
      name: /Node NODE-A2 ONLINE/i,
    });
    expect(dot).toBeDefined();
  });

  it("renders an aria-hidden decorative dot when no label is given", () => {
    const { container } = render(<StatusDot variant="degraded" />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(
      screen.queryByRole("img"),
    ).toBeNull();
  });

  it("accepts every documented variant", () => {
    const variants = [
      "online",
      "degraded",
      "offline",
      "standby",
      "unknown",
    ] as const;
    for (const v of variants) {
      const { container } = render(<StatusDot variant={v} label={v} />);
      expect(container.firstChild).not.toBeNull();
    }
  });
});
