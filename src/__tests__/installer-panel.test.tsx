import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/operations",
}));

import { InstallerPanel } from "@/app/(shell)/operations/_components/InstallerPanel";

describe("InstallerPanel", () => {
  it("renders heading + prerequisites + actions on default scenario", async () => {
    render(<InstallerPanel />);
    await screen.findByLabelText(/installer overview/i);
    expect(
      screen.getByRole("heading", { name: /installer & update/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /installer prerequisites/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("group", { name: /installer actions/i }),
    ).toBeDefined();
  });

  it("dispatch update is gated until backup is acknowledged", async () => {
    render(<InstallerPanel />);
    await screen.findByLabelText(/installer overview/i);
    const updateBtn = screen.getByRole("button", {
      name: /dispatch update/i,
    }) as HTMLButtonElement;
    expect(updateBtn.disabled).toBe(true);
    // Acknowledge backup in mock fallback.
    const backupBtn = screen.getByRole("button", {
      name: /run pre-update backup/i,
    });
    fireEvent.click(backupBtn);
    // After mock backup, update should be enabled.
    const updateBtnAfter = screen.getByRole("button", {
      name: /dispatch update/i,
    }) as HTMLButtonElement;
    expect(updateBtnAfter.disabled).toBe(false);
  });

  it("backup prompt explicitly states gate behavior", async () => {
    render(<InstallerPanel />);
    await screen.findByLabelText(/installer overview/i);
    const status = screen.getByRole("status", {
      name: /backup before update prompt/i,
    });
    expect(status.textContent).toMatch(/pre-update backup/i);
  });
});
