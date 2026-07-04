import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SessionGate } from "@/app/(shell)/_session/SessionGate";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";

const UNAUTH: ConsoleSessionResult = {
  status: "unauthenticated",
  reason: "No active operator session.",
};

describe("SessionGate auth-required → login", () => {
  it("offers a Sign in link to /login preserving the current route", async () => {
    render(
      <SessionProvider loader={() => UNAUTH}>
        <SessionGate>
          <h1>Dashboard</h1>
        </SessionGate>
      </SessionProvider>,
    );
    const link = await screen.findByRole("link", { name: /sign in/i });
    expect(link.getAttribute("href")).toBe(
      "/login?redirect=%2Fdashboard",
    );
    // Still not a dead end for the raw content.
    expect(
      screen.queryByRole("heading", { name: /dashboard/i }),
    ).toBeNull();
  });
});
