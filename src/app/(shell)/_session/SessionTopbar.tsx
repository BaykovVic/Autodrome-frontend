"use client";

import {
  ConsoleTopbar,
  type TopbarOperator,
} from "../_components/ConsoleTopbar";
import { actorInitials, primaryRoleLabel } from "./consoleSession";
import { useSession } from "./SessionProvider";

/**
 * Renders the console topbar with the operator cluster bound to the
 * current session actor. When the session is not authenticated the
 * topbar falls back to its built-in placeholder operator, so the
 * shell chrome stays intact on the loading / auth-required states.
 */
export function SessionTopbar() {
  const session = useSession();

  let operator: TopbarOperator | undefined;
  if (session.phase === "authenticated") {
    operator = {
      initials: actorInitials(session.actor.label),
      name: session.actor.label,
      role: primaryRoleLabel(session.actor),
    };
  }

  return <ConsoleTopbar operator={operator} />;
}
