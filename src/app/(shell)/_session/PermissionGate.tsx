"use client";

import type { ReactNode } from "react";

import { canAccess } from "./consolePermissions";
import { useOptionalSession } from "./SessionProvider";

/**
 * Renders `children` only when the current session actor holds
 * `permission`; otherwise renders `fallback` (nothing by default).
 *
 * Fail-open outside a `SessionProvider` (see `canAccess`) so command
 * surfaces gated with this primitive keep working in isolated tests /
 * storybook. Backend authorization remains the security boundary —
 * this only decides whether the UI offers the action.
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const session = useOptionalSession();
  return canAccess(session, permission) ? <>{children}</> : <>{fallback}</>;
}
