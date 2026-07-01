import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type {
  ConsoleSessionActor,
  ConsoleSessionResult,
} from "@/app/(shell)/_session/consoleSession";
import { canAccess } from "@/app/(shell)/_session/consolePermissions";
import { PermissionGate } from "@/app/(shell)/_session/PermissionGate";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";

const ADMIN_ACTOR: ConsoleSessionActor = {
  actorId: "a",
  actorType: "user",
  label: "Admin",
  roles: ["admin"],
  permissions: ["identity.manage"],
};

const OPERATOR_ACTOR: ConsoleSessionActor = {
  actorId: "o",
  actorType: "user",
  label: "Operator",
  roles: ["operator"],
  permissions: ["exam.read"],
};

const ADMIN: ConsoleSessionResult = {
  status: "authenticated",
  actor: ADMIN_ACTOR,
};

const OPERATOR: ConsoleSessionResult = {
  status: "authenticated",
  actor: OPERATOR_ACTOR,
};

describe("canAccess", () => {
  it("allows ungated actions", () => {
    expect(canAccess(null, undefined)).toBe(true);
  });
  it("fails open without a session context", () => {
    expect(canAccess(null, "identity.manage")).toBe(true);
  });
  it("denies loading / unauthenticated sessions for gated actions", () => {
    expect(
      canAccess({ phase: "loading", reload: () => {} }, "identity.manage"),
    ).toBe(false);
    expect(
      canAccess(
        { phase: "unauthenticated", reload: () => {} },
        "identity.manage",
      ),
    ).toBe(false);
  });
  it("allows an authenticated actor holding the permission", () => {
    expect(
      canAccess(
        { phase: "authenticated", actor: ADMIN_ACTOR, reload: () => {} },
        "identity.manage",
      ),
    ).toBe(true);
  });
  it("denies an authenticated actor missing the permission", () => {
    expect(
      canAccess(
        { phase: "authenticated", actor: OPERATOR_ACTOR, reload: () => {} },
        "identity.manage",
      ),
    ).toBe(false);
  });
});

describe("PermissionGate", () => {
  it("renders children when the actor holds the permission", async () => {
    render(
      <SessionProvider loader={() => ADMIN}>
        <PermissionGate permission="identity.manage">
          <button>Assign</button>
        </PermissionGate>
      </SessionProvider>,
    );
    expect(
      await screen.findByRole("button", { name: /assign/i }),
    ).toBeDefined();
  });

  it("renders the fallback when the actor lacks the permission", async () => {
    render(
      <SessionProvider loader={() => OPERATOR}>
        <PermissionGate
          permission="identity.manage"
          fallback={<span>denied</span>}
        >
          <button>Assign</button>
        </PermissionGate>
      </SessionProvider>,
    );
    expect(await screen.findByText(/denied/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: /assign/i })).toBeNull();
  });

  it("fails open when rendered without a SessionProvider", () => {
    render(
      <PermissionGate permission="identity.manage">
        <button>Assign</button>
      </PermissionGate>,
    );
    expect(screen.getByRole("button", { name: /assign/i })).toBeDefined();
  });
});
