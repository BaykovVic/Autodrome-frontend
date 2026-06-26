import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/security",
}));

import { SecurityScreen } from "@/app/(shell)/security/_components/SecurityScreen";
import { consoleSecurityFor } from "@/app/(shell)/security/_components/consoleSecurityFixtures";

describe("SecurityScreen", () => {
  it("renders heading + current actor + role matrix in normal scenario", async () => {
    render(
      <SecurityScreen loader={() => consoleSecurityFor("normal")} />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });
    // Current actor section visible (multiple occurrences:
    // header subtitle + operator table row).
    expect(screen.getAllByText(/Anna Petrova/).length).toBeGreaterThan(0);
    // Role matrix table.
    expect(
      screen.getByRole("table", { name: /operator role matrix/i }),
    ).toBeDefined();
    // 6 canonical role columns rendered as chips.
    for (const role of [
      "admin",
      "operator",
      "inspector",
      "dispatcher",
      "auditor",
      "techAdmin",
    ]) {
      expect(screen.getAllByText(`(${role})`).length).toBeGreaterThan(0);
    }
  });

  it("Assign/Revoke buttons are disabled per spec degraded note", async () => {
    render(
      <SecurityScreen loader={() => consoleSecurityFor("normal")} />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });
    const groups = screen.getAllByRole("group", {
      name: /role actions for/i,
    });
    expect(groups.length).toBeGreaterThan(0);
    const firstGroup = groups[0]!;
    expect(
      (
        within(firstGroup).getByRole("button", {
          name: /assign/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        within(firstGroup).getByRole("button", {
          name: /revoke/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("service-degraded scenario surfaces degraded banner", async () => {
    render(
      <SecurityScreen
        loader={() => consoleSecurityFor("service-degraded")}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });
    expect(
      screen.getByLabelText(/security degraded note/i),
    ).toBeDefined();
  });

  it("empty scenario shows 'no authenticated actor' fallback", async () => {
    render(<SecurityScreen loader={() => consoleSecurityFor("empty")} />);
    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });
    expect(screen.getAllByText(/no authenticated actor/i).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText(/no operators returned from identity service/i),
    ).toBeDefined();
  });

  it("role matrix renders has-role / no-role state per cell", async () => {
    render(
      <SecurityScreen loader={() => consoleSecurityFor("normal")} />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });
    // Anna has admin role.
    expect(
      screen.getByLabelText(/Anna Petrova has role admin/i),
    ).toBeDefined();
    // Anna does not have operator role.
    expect(
      screen.getByLabelText(/Anna Petrova does not have role operator/i),
    ).toBeDefined();
  });
});
