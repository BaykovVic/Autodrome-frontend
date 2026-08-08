"use client";

import { getApiAdapter } from "@/api/get-api-adapter";

import {
  ConsoleTopbar,
  type TopbarOperator,
} from "../_components/ConsoleTopbar";
import { actorInitials, primaryRoleLabel } from "./consoleSession";
import { performLogout } from "./sessionAuth";
import { useSession } from "./SessionProvider";

/**
 * Renders the console topbar with the operator cluster bound to the
 * current session actor, plus a Sign out action when authenticated.
 * Logout revokes the refresh token (best-effort), clears the stored
 * session, and reloads the session so the shell drops to the
 * auth-required state (which routes to `/login`). When the session is
 * not authenticated the topbar falls back to its placeholder operator.
 */
export function SessionTopbar() {
  const session = useSession();

  let operator: TopbarOperator | undefined;
  let onLogout: (() => void) | undefined;
  if (session.phase === "authenticated") {
    operator = {
      initials: actorInitials(session.actor.label),
      name: session.actor.label,
      role: primaryRoleLabel(session.actor),
    };
    onLogout = () => {
      void performLogout(getApiAdapter({ mode: "live" })).finally(() => {
        session.reload();
      });
    };
  }

  return <ConsoleTopbar operator={operator} onLogout={onLogout} />;
}
