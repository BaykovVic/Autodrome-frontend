import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/security",
}));

import { ApiError } from "@/api/errors";
import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";
import { SecurityScreen } from "@/app/(shell)/security/_components/SecurityScreen";
import { consoleSecurityFor } from "@/app/(shell)/security/_components/consoleSecurityFixtures";
import type { RoleManagementActions } from "@/app/(shell)/security/_components/useRoleManagement";

const ADMIN: ConsoleSessionResult = {
  status: "authenticated",
  actor: {
    actorId: "a",
    actorType: "user",
    label: "Admin",
    roles: ["admin"],
    permissions: ["user.assign"],
  },
};

// Boris Ivanov from the `normal` fixture — operator, single role.
const BORIS = "20000000-0000-4000-8000-000000000002";

function renderInteractive(actions: RoleManagementActions) {
  return render(
    <SessionProvider loader={() => ADMIN}>
      <SecurityScreen
        loader={() => consoleSecurityFor("normal")}
        roleManagement={actions}
      />
    </SessionProvider>,
  );
}

describe("SecurityScreen live role management", () => {
  it("assigns a role through the canonical action and applies the returned set", async () => {
    const assign = vi.fn(async (userId: string, role: string) => ({
      userId,
      roles: ["operator", role] as never,
    }));
    const revoke = vi.fn();
    renderInteractive({ assign, revoke });

    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });

    const assignCell = await screen.findByRole("button", {
      name: /assign role inspector to Boris Ivanov/i,
    });
    fireEvent.click(assignCell);

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(BORIS, "inspector"),
    );
    // The returned set is applied: the cell flips to a revoke control.
    await screen.findByRole("button", {
      name: /revoke role inspector from Boris Ivanov/i,
    });
  });

  it("surfaces a classified access-denied error when assign is forbidden (403)", async () => {
    const assign = vi.fn(async () => {
      throw new ApiError({
        status: 403,
        code: "FORBIDDEN",
        message: "denied",
        url: "/api/identity-security/v1/users/x/roles",
      });
    });
    renderInteractive({ assign, revoke: vi.fn() });

    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });
    fireEvent.click(
      await screen.findByRole("button", {
        name: /assign role auditor to Boris Ivanov/i,
      }),
    );

    const alert = await screen.findByRole("alert", {
      name: /role management error/i,
    });
    expect(alert.textContent).toMatch(/access denied/i);
  });
});
