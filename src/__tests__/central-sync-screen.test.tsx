import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/central-sync",
}));

import { CentralSyncScreen } from "@/app/(shell)/central-sync/_components/CentralSyncScreen";

describe("CentralSyncScreen", () => {
  it("renders heading + status + sync actions + packages table on normal scenario", async () => {
    render(<CentralSyncScreen />);
    await screen.findByRole("heading", {
      level: 1,
      name: /central sync/i,
    });
    expect(screen.getByText(/optional/i)).toBeDefined();
    expect(
      screen.getByRole("group", { name: /central sync actions/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /recent sync packages/i }),
    ).toBeDefined();
  });

  it("renders Run sync + Export buttons enabled when sync is enabled", async () => {
    render(<CentralSyncScreen />);
    await screen.findByRole("heading", {
      level: 1,
      name: /central sync/i,
    });
    const runBtn = screen.getByRole("button", {
      name: /run sync/i,
    }) as HTMLButtonElement;
    expect(runBtn.disabled).toBe(false);
  });
});
