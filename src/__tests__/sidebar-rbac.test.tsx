import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import type {
  ConsoleSessionResult,
  ConsoleSessionRole,
} from "@/app/(shell)/_session/consoleSession";
import { SidebarNav } from "@/app/(shell)/_components/SidebarNav";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";

function session(
  roles: ConsoleSessionRole[],
  permissions: string[],
): ConsoleSessionResult {
  return {
    status: "authenticated",
    actor: {
      actorId: "x",
      actorType: "user",
      label: "X",
      roles,
      permissions,
    },
  };
}

const ADMIN = session(["admin"], ["identity.manage", "audit.read"]);
const OPERATOR = session(["operator"], ["exam.read"]);
const AUDITOR = session(["auditor"], ["audit.read"]);

function renderNav(result: ConsoleSessionResult) {
  return render(
    <SessionProvider loader={() => result}>
      <SidebarNav />
    </SessionProvider>,
  );
}

describe("SidebarNav role-aware navigation", () => {
  it("admin (identity.manage + audit.read) sees Security and Audit", async () => {
    renderNav(ADMIN);
    expect(
      await screen.findByRole("link", { name: /^security$/i }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: /^audit$/i })).toBeDefined();
  });

  it("operator sees neither Security nor Audit (Dashboard still present)", async () => {
    renderNav(OPERATOR);
    await screen.findByRole("link", { name: /^dashboard$/i });
    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /^security$/i }),
      ).toBeNull();
    });
    expect(screen.queryByRole("link", { name: /^audit$/i })).toBeNull();
  });

  it("auditor (audit.read) sees Audit but not Security", async () => {
    renderNav(AUDITOR);
    expect(
      await screen.findByRole("link", { name: /^audit$/i }),
    ).toBeDefined();
    expect(
      screen.queryByRole("link", { name: /^security$/i }),
    ).toBeNull();
  });
});
