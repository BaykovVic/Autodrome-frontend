import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/audit",
}));

import { AuditScreen } from "@/app/(shell)/audit/_components/AuditScreen";
import { consoleAuditFor } from "@/app/(shell)/audit/_components/consoleAuditFixtures";

describe("AuditScreen", () => {
  it("renders heading + actions + recent events table", async () => {
    render(<AuditScreen loader={() => consoleAuditFor("normal")} />);
    await screen.findByRole("heading", {
      level: 1,
      name: /audit & integrity/i,
    });
    expect(
      screen.getByRole("group", { name: /audit integrity actions/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /audit event log/i }),
    ).toBeDefined();
  });

  it("verification + export buttons are enabled and dispatch via mock fallback", async () => {
    render(<AuditScreen loader={() => consoleAuditFor("normal")} />);
    await screen.findByRole("heading", {
      level: 1,
      name: /audit & integrity/i,
    });
    const verify = screen.getByRole("button", {
      name: /run verification/i,
    }) as HTMLButtonElement;
    const exportJ = screen.getByRole("button", {
      name: /export jsonl/i,
    }) as HTMLButtonElement;
    expect(verify.disabled).toBe(false);
    expect(exportJ.disabled).toBe(false);
    fireEvent.click(verify);
    fireEvent.click(exportJ);
  });

  it("violation-detected scenario surfaces failed verification first error", async () => {
    render(
      <AuditScreen
        loader={() => consoleAuditFor("violations-detected")}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /audit & integrity/i,
    });
    expect(
      screen.getByLabelText(/first verification error/i),
    ).toBeDefined();
    expect(screen.getByText(/blockHash mismatch/i)).toBeDefined();
  });

  it("service-degraded scenario shows degraded banner + no events", async () => {
    render(
      <AuditScreen loader={() => consoleAuditFor("service-degraded")} />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /audit & integrity/i,
    });
    expect(screen.getByLabelText(/audit degraded note/i)).toBeDefined();
    expect(screen.getByText(/no audit events visible/i)).toBeDefined();
  });

  it("empty scenario shows 'no audit events visible' fallback", async () => {
    render(<AuditScreen loader={() => consoleAuditFor("empty")} />);
    await screen.findByRole("heading", {
      level: 1,
      name: /audit & integrity/i,
    });
    expect(screen.getByText(/no audit events visible/i)).toBeDefined();
  });
});
