import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Toolbar, ToolbarSection } from "@/components/Toolbar";

describe("Toolbar", () => {
  it("renders a toolbar landmark with provided aria-label", () => {
    render(
      <Toolbar ariaLabel="Test toolbar">
        <ToolbarSection>
          <button type="button">Action</button>
        </ToolbarSection>
      </Toolbar>,
    );
    expect(
      screen.getByRole("toolbar", { name: /test toolbar/i }),
    ).toBeDefined();
  });

  it("renders nested children", () => {
    render(
      <Toolbar ariaLabel="Test toolbar">
        <ToolbarSection>
          <span data-testid="left">L</span>
        </ToolbarSection>
        <ToolbarSection>
          <span data-testid="right">R</span>
        </ToolbarSection>
      </Toolbar>,
    );
    expect(screen.getByTestId("left").textContent).toBe("L");
    expect(screen.getByTestId("right").textContent).toBe("R");
  });
});
