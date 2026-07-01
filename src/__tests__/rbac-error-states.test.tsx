import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ApiError } from "@/api/errors";
import { ApiErrorView } from "@/components";
import { SessionGate } from "@/app/(shell)/_session/SessionGate";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";

function apiError(status: number, code: string): ApiError {
  return new ApiError({
    status,
    code,
    message: `boom ${status}`,
    url: "/api/identity-security/v1/auth/me",
  });
}

describe("ApiErrorView forbidden (403)", () => {
  it("renders the forbidden category + access-denied hint distinctly", () => {
    render(<ApiErrorView error={apiError(403, "HTTP_403")} />);
    expect(
      screen.getByLabelText(/error category forbidden/i),
    ).toBeDefined();
    expect(screen.getByText(/not authorized for this action/i)).toBeDefined();
  });
});

describe("SessionGate error surfaces", () => {
  it("renders a degraded state when identity/BFF is unavailable (503)", async () => {
    render(
      <SessionProvider
        loader={() => {
          throw apiError(503, "SERVICE_DEGRADED");
        }}
      >
        <SessionGate>
          <h1>Dashboard</h1>
        </SessionGate>
      </SessionProvider>,
    );
    expect(await screen.findByText("identity-security")).toBeDefined();
    expect(screen.getByText("degraded")).toBeDefined();
    expect(
      screen.queryByRole("heading", { name: /dashboard/i }),
    ).toBeNull();
  });

  it("renders an access-denied error state on a forbidden session (403)", async () => {
    render(
      <SessionProvider
        loader={() => {
          throw apiError(403, "FORBIDDEN");
        }}
      >
        <SessionGate>
          <h1>Dashboard</h1>
        </SessionGate>
      </SessionProvider>,
    );
    expect(await screen.findByText(/access denied/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeDefined();
    expect(
      screen.queryByRole("heading", { name: /dashboard/i }),
    ).toBeNull();
  });
});
