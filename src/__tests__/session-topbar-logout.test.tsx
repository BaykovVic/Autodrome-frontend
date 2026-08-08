import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ConsoleTopbar } from "@/app/(shell)/_components/ConsoleTopbar";
import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";
import { SessionTopbar } from "@/app/(shell)/_session/SessionTopbar";

const OPERATOR = { initials: "AP", name: "Anna Petrova", role: "Administrator" };

describe("ConsoleTopbar Sign out", () => {
  it("renders a Sign out action and invokes onLogout", () => {
    const onLogout = vi.fn();
    render(<ConsoleTopbar operator={OPERATOR} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("omits Sign out when no onLogout is provided", () => {
    render(<ConsoleTopbar operator={OPERATOR} />);
    expect(
      screen.queryByRole("button", { name: /sign out/i }),
    ).toBeNull();
  });
});

const ADMIN: ConsoleSessionResult = {
  status: "authenticated",
  actor: {
    actorId: "a",
    actorType: "user",
    label: "Anna Petrova",
    roles: ["admin"],
    permissions: ["identity.manage"],
  },
};

describe("SessionTopbar", () => {
  it("shows the Sign out action for an authenticated session", async () => {
    render(
      <SessionProvider loader={() => ADMIN}>
        <SessionTopbar />
      </SessionProvider>,
    );
    expect(await screen.findByText("Anna Petrova")).toBeDefined();
    expect(
      await screen.findByRole("button", { name: /sign out/i }),
    ).toBeDefined();
  });
});
