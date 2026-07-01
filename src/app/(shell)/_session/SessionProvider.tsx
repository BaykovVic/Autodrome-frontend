"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useConsoleSession,
  type ConsoleSessionLoader,
  type UseConsoleSession,
} from "./useConsoleSession";

const SessionContext = createContext<UseConsoleSession | null>(null);

/**
 * Provides the console session view-model to the shell. A `loader`
 * can be injected for tests/storybook; production uses the runtime
 * mode (mock fixture or live `/auth/me`).
 */
export function SessionProvider({
  children,
  loader,
}: {
  children: ReactNode;
  loader?: ConsoleSessionLoader;
}) {
  const session = useConsoleSession(loader);
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Reads the current session. Throws if used outside a
 * `SessionProvider` so a missing provider fails loudly in dev/tests
 * instead of silently rendering an empty session.
 */
export function useSession(): UseConsoleSession {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}

/**
 * Reads the current session, returning `null` when used outside a
 * `SessionProvider` instead of throwing. Used by RBAC gating
 * primitives (nav filtering, `PermissionGate`) so a component can be
 * rendered in isolation (unit tests, storybook) without a provider
 * and fail open rather than crash.
 */
export function useOptionalSession(): UseConsoleSession | null {
  return useContext(SessionContext);
}
