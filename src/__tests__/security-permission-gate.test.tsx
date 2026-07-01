import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/security",
}));

import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SecurityScreen } from "@/app/(shell)/security/_components/SecurityScreen";
import { consoleSecurityFor } from "@/app/(shell)/security/_components/consoleSecurityFixtures";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";

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

const OPERATOR: ConsoleSessionResult = {
  status: "authenticated",
  actor: {
    actorId: "o",
    actorType: "user",
    label: "Operator",
    roles: ["operator"],
    permissions: ["exam.read"],
  },
};

function renderScreen(session: ConsoleSessionResult) {
  return render(
    <SessionProvider loader={() => session}>
      <SecurityScreen loader={() => consoleSecurityFor("normal")} />
    </SessionProvider>,
  );
}

describe("SecurityScreen role-management command gating", () => {
  it("shows Assign/Revoke for an actor holding user.assign", async () => {
    renderScreen(ADMIN);
    const assigns = await screen.findAllByRole("button", {
      name: /^assign$/i,
    });
    expect(assigns.length).toBeGreaterThan(0);
  });

  it("hides Assign/Revoke and shows a permission note for an actor without user.assign", async () => {
    renderScreen(OPERATOR);
    await screen.findByRole("heading", {
      level: 1,
      name: /security & identity/i,
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /^assign$/i }),
      ).toBeNull();
    });
    expect(
      screen.getAllByText(/requires user\.assign/i).length,
    ).toBeGreaterThan(0);
  });
});
