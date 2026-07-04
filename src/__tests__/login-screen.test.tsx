import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { ApiError } from "@/api/errors";
import type { SessionTokens } from "@/api/session-tokens";
import { LoginScreen } from "@/app/login/_components/LoginScreen";

const TOKENS: SessionTokens = {
  accessToken: "a",
  refreshToken: "r",
  expiresAt: "2026-01-01T00:00:00Z",
  scopes: ["operator"],
};

function fill(login: string, password: string) {
  fireEvent.change(screen.getByLabelText("Login"), {
    target: { value: login },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
}

describe("LoginScreen", () => {
  it("renders the sign-in form", () => {
    render(<LoginScreen loginAction={vi.fn()} onAuthenticated={vi.fn()} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /sign in/i }),
    ).toBeDefined();
    expect(screen.getByLabelText("Login")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeDefined();
  });

  it("validates that both fields are filled before calling the action", () => {
    const loginAction = vi.fn();
    render(<LoginScreen loginAction={loginAction} onAuthenticated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText(/enter both login and password/i)).toBeDefined();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it("on success stores the session and navigates to the redirect target", async () => {
    const loginAction = vi.fn(async () => TOKENS);
    const onAuthenticated = vi.fn();
    render(
      <LoginScreen
        loginAction={loginAction}
        onAuthenticated={onAuthenticated}
      />,
    );
    fill("pilot.operator", "Pilot-operator-123");
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(loginAction).toHaveBeenCalledWith({
        login: "pilot.operator",
        password: "Pilot-operator-123",
      }),
    );
    expect(onAuthenticated).toHaveBeenCalledWith(TOKENS);
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows an invalid-credentials error on a 401 without navigating", async () => {
    const loginAction = vi.fn(async () => {
      throw new ApiError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "bad",
        url: "/x",
      });
    });
    render(
      <LoginScreen loginAction={loginAction} onAuthenticated={vi.fn()} />,
    );
    fill("pilot.operator", "wrong");
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid login or password/i),
    ).toBeDefined();
  });
});
