import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the provided label", () => {
    render(<StatusBadge variant="success">online</StatusBadge>);
    expect(screen.getByText("online")).toBeDefined();
  });

  it("applies different class names per variant", () => {
    const { rerender } = render(
      <StatusBadge variant="success">ok</StatusBadge>,
    );
    const ok = screen.getByText("ok");
    const successClass = ok.className;

    rerender(<StatusBadge variant="danger">bad</StatusBadge>);
    const bad = screen.getByText("bad");
    const dangerClass = bad.className;

    expect(successClass).not.toBe(dangerClass);
    expect(successClass.length).toBeGreaterThan(0);
    expect(dangerClass.length).toBeGreaterThan(0);
  });
});
