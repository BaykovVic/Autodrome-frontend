import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ConsoleCard } from "@/components";

describe("ConsoleCard", () => {
  it("renders header text + aside in default header layout", () => {
    render(
      <ConsoleCard header="Service health" headerAside="6 services">
        <p>body</p>
      </ConsoleCard>,
    );
    expect(screen.getByText("Service health")).toBeDefined();
    expect(screen.getByText("6 services")).toBeDefined();
    expect(screen.getByText("body")).toBeDefined();
  });

  it("renders body without padding when flush is set", () => {
    const { container } = render(
      <ConsoleCard flush header="Recordings">
        <table><tbody><tr><td>row</td></tr></tbody></table>
      </ConsoleCard>,
    );
    // The body div is the second child of the section (after header).
    const section = container.firstChild as HTMLElement;
    const bodyDiv = section.children[1] as HTMLElement;
    expect(bodyDiv.className).toMatch(/bodyFlush/);
  });

  it("renders no header when header prop is absent", () => {
    const { container } = render(
      <ConsoleCard>
        <p>no-header body</p>
      </ConsoleCard>,
    );
    const section = container.firstChild as HTMLElement;
    // Only one child (the body) — no header element.
    expect(section.children).toHaveLength(1);
  });
});
