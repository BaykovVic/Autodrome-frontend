import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SessionGate } from "@/app/(shell)/_session/SessionGate";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";
import { SessionTopbar } from "@/app/(shell)/_session/SessionTopbar";

const AUTHENTICATED: ConsoleSessionResult = {
  status: "authenticated",
  actor: {
    actorId: "id-1",
    actorType: "user",
    label: "Anna Petrova",
    roles: ["admin"],
    permissions: ["identity.manage"],
  },
};

const UNAUTHENTICATED: ConsoleSessionResult = {
  status: "unauthenticated",
  reason: "No active operator session.",
};

describe("SessionGate", () => {
  it("renders children once the session is authenticated", async () => {
    render(
      <SessionProvider loader={() => AUTHENTICATED}>
        <SessionGate>
          <h1>Dashboard</h1>
        </SessionGate>
      </SessionProvider>,
    );
    await screen.findByRole("heading", { level: 1, name: /dashboard/i });
  });

  it("shows the auth-required state when unauthenticated", async () => {
    render(
      <SessionProvider loader={() => UNAUTHENTICATED}>
        <SessionGate>
          <h1>Dashboard</h1>
        </SessionGate>
      </SessionProvider>,
    );
    await screen.findByText(/authentication required/i);
    expect(screen.getByText(/no active operator session/i)).toBeDefined();
    expect(screen.queryByRole("heading", { name: /dashboard/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeDefined();
  });

  it("shows a transport error state with retry when the loader throws", async () => {
    render(
      <SessionProvider
        loader={() => {
          throw new Error("identity unavailable");
        }}
      >
        <SessionGate>
          <h1>Dashboard</h1>
        </SessionGate>
      </SessionProvider>,
    );
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeDefined();
    expect(screen.queryByRole("heading", { name: /dashboard/i })).toBeNull();
  });

  it("shows the loading state while the session resolves", () => {
    render(
      <SessionProvider loader={() => new Promise<ConsoleSessionResult>(() => {})}>
        <SessionGate>
          <h1>Dashboard</h1>
        </SessionGate>
      </SessionProvider>,
    );
    expect(screen.getByText(/restoring session/i)).toBeDefined();
    expect(screen.queryByRole("heading", { name: /dashboard/i })).toBeNull();
  });
});

describe("SessionTopbar", () => {
  it("binds the topbar operator cluster to the session actor", async () => {
    render(
      <SessionProvider loader={() => AUTHENTICATED}>
        <SessionTopbar />
      </SessionProvider>,
    );
    expect(await screen.findByText("Anna Petrova")).toBeDefined();
    expect(screen.getByText("Administrator")).toBeDefined();
  });
});
