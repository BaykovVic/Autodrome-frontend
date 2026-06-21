import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ConsoleSidebarFooter } from "@/app/(shell)/_components/ConsoleSidebarFooter";

describe("ConsoleSidebarFooter", () => {
  it("renders provided storage, build and version captions", () => {
    render(
      <ConsoleSidebarFooter
        storageLabel="588 / 1000 GB"
        storageProgress={0.59}
        buildLabel="Build 0.7.0 · offline"
        versionLabel="v0.7.0"
      />,
    );
    expect(screen.getByText("588 / 1000 GB")).toBeDefined();
    expect(screen.getByText("Build 0.7.0 · offline")).toBeDefined();
    expect(screen.getByText("v0.7.0")).toBeDefined();
  });

  it("clamps storage progress into [0,100] and exposes aria-valuenow", () => {
    const { rerender } = render(
      <ConsoleSidebarFooter storageProgress={-1} />,
    );
    let bar = screen.getByRole("progressbar", {
      name: /node storage usage/i,
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("0");

    rerender(<ConsoleSidebarFooter storageProgress={2.5} />);
    bar = screen.getByRole("progressbar", {
      name: /node storage usage/i,
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("100");
  });
});
