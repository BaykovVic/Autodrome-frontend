import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Tabs } from "@/components/Tabs";

const items = [
  { id: "a", label: "Alpha", content: <p>alpha-body</p> },
  { id: "b", label: "Beta", content: <p>beta-body</p> },
  { id: "c", label: "Gamma", content: <p>gamma-body</p> },
];

describe("Tabs", () => {
  it("selects the first tab by default and reveals only its panel", () => {
    render(<Tabs ariaLabel="Test tabs" items={items} />);
    const alphaTab = screen.getByRole("tab", { name: /alpha/i });
    expect(alphaTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("alpha-body")).toBeDefined();

    const betaPanel = screen
      .getAllByRole("tabpanel", { hidden: true })
      .find((panel) => panel.textContent === "beta-body");
    expect(betaPanel?.hasAttribute("hidden")).toBe(true);
  });

  it("activates a different tab on click", () => {
    render(<Tabs ariaLabel="Test tabs" items={items} />);
    const betaTab = screen.getByRole("tab", { name: /beta/i });
    fireEvent.click(betaTab);
    expect(betaTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByRole("tab", { name: /alpha/i }).getAttribute("aria-selected"),
    ).toBe("false");
  });
});
