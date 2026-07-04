"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { classifyError } from "@/api/error-taxonomy";
import {
  Button,
  buttonClassName,
  DegradedState,
  ErrorState,
  LoadingState,
  State,
} from "@/components";

import { useSession } from "./SessionProvider";
import styles from "./SessionGate.module.css";

/**
 * Gates the shell content on the session phase:
 *
 *   - `loading`        → transient session-restore state.
 *   - `unauthenticated`→ auth-required state (no operator session).
 *   - `error`          → transport error (identity service down) with
 *                        retry; classified through the shared error
 *                        taxonomy.
 *   - `authenticated`  → renders the workspace children.
 *
 * The default `normal` mock scenario authenticates immediately, so
 * the existing console renders unchanged behind the gate.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();

  if (session.phase === "loading") {
    return (
      <div className={styles.gate}>
        <LoadingState
          title="Restoring session…"
          description="Checking the current operator session."
        />
      </div>
    );
  }

  if (session.phase === "error") {
    // The session loader threw a non-auth transport error. Classify it
    // through the shared taxonomy: a degraded/unreachable identity or
    // BFF renders an honest degraded state; a forbidden (403) or any
    // other error renders the error panel — never a generic fallback.
    const classification = classifyError(session.error);
    return (
      <div className={styles.gate}>
        {classification.uiKind === "degraded-banner" ? (
          <DegradedState
            service="identity-security"
            description={classification.description}
            onRetry={session.reload}
          />
        ) : (
          <ErrorState
            title={classification.title}
            description={classification.description}
            action={
              <Button variant="secondary" onClick={session.reload}>
                Retry
              </Button>
            }
          />
        )}
      </div>
    );
  }

  if (session.phase === "unauthenticated") {
    // Not a dead end: route the operator to /login, preserving where
    // they were headed so login can send them back.
    const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;
    return (
      <div className={styles.gate}>
        <State
          tone="empty"
          title="Authentication required"
          description={
            session.reason ??
            "No active operator session. Sign in to continue."
          }
          action={
            <div className={styles.gateActions}>
              <Link
                href={loginHref}
                className={buttonClassName({ variant: "primary" })}
              >
                Sign in
              </Link>
              <Button variant="secondary" onClick={session.reload}>
                Retry
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
