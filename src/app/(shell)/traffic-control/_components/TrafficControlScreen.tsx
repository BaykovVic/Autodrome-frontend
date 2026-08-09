"use client";

import { useMemo, useState } from "react";

import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components";
import {
  canAccess,
  CONSOLE_PERMISSIONS,
} from "../../_session/consolePermissions";
import { useOptionalSession } from "../../_session/SessionProvider";
import { ConfirmDestructiveDialog } from "../../operations/_components/ConfirmDestructiveDialog";
import {
  useConsoleTrafficControl,
  type ConsoleTrafficLoader,
} from "./useConsoleTrafficControl";
import type { TrafficCommandSender } from "./liveTrafficControl";
import {
  isDestructiveCommand,
  type ConsoleCommandType,
  type ConsoleControllerStatus,
  type ConsoleTrafficSnapshot,
} from "./consoleTrafficSnapshot";
import styles from "../../reference-data/_components/ReferenceDataScreen.module.css";

function controllerBadge(
  s: ConsoleControllerStatus,
): StatusBadgeVariant {
  switch (s) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "offline":
      return "danger";
    default:
      return "neutral";
  }
}

type Props = {
  snapshotOverride?: ConsoleTrafficSnapshot;
  /** Injected loader (tests). Live reads traffic-control-service. */
  loader?: ConsoleTrafficLoader;
  /** Injected command sender (tests). Live posts /traffic/commands. */
  commandSender?: TrafficCommandSender;
};

/** Shown on a disabled control so the reason is never silent. */
const NO_COMMAND_PERMISSION = `Requires ${CONSOLE_PERMISSIONS.trafficCommand}`;

export function TrafficControlScreen({
  snapshotOverride,
  loader,
  commandSender,
}: Props) {
  const session = useOptionalSession();
  const canCommand = canAccess(
    session,
    CONSOLE_PERMISSIONS.trafficCommand,
  );
  // Memoised so a fresh identity per render cannot retrigger the hook.
  const effectiveLoader = useMemo(
    () => (snapshotOverride ? () => snapshotOverride : loader),
    [snapshotOverride, loader],
  );
  const state = useConsoleTrafficControl(effectiveLoader, commandSender);
  const [confirm, setConfirm] = useState<{
    controllerId: string;
    address: string;
    commandType: ConsoleCommandType;
  } | null>(null);

  function dispatchCommand(
    controllerId: string,
    address: string,
    commandType: ConsoleCommandType,
  ) {
    if (isDestructiveCommand(commandType)) {
      setConfirm({ controllerId, address, commandType });
      return;
    }
    // Result comes from the backend acceptance — no optimistic entry.
    void state.sendCommand(controllerId, commandType);
  }

  function onConfirm() {
    if (!confirm) return;
    void state.sendCommand(confirm.controllerId, confirm.commandType);
    setConfirm(null);
  }

  if (state.loading) {
    return (
      <section className={styles.screen} aria-label="Traffic control workspace">
        <Skeleton lines={6} label="Loading traffic control" />
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section className={styles.screen} aria-label="Traffic control workspace">
        <ApiErrorView error={state.fatalError} onRetry={state.reload} />
      </section>
    );
  }

  const snapshot = state.snapshot;
  if (!snapshot) {
    return (
      <section className={styles.screen} aria-label="Traffic control workspace">
        <EmptyState
          title="No traffic control data"
          description="Live and mock loaders both returned no data."
        />
      </section>
    );
  }

  return (
    <section
      className={styles.screen}
      aria-label="Traffic control workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>Traffic control</h1>
        <p className={styles.subtitle}>
          {snapshot.controllers.length} controllers ·{" "}
          {snapshot.lights.length} lights · canonical
          `traffic-control-service`. Frontend dispatches
          commands; backend talks to hardware.
        </p>
      </header>

      {state.commandError ? (
        <div style={{ margin: "12px 20px 0" }}>
          {/* A rejected command (e.g. backend 403) is never silent. */}
          <ApiErrorView
            error={state.commandError}
            onRetry={state.clearCommandError}
            retryLabel="Dismiss"
          />
        </div>
      ) : null}

      {snapshot.degradedNote ? (
        <p
          role="status"
          aria-label="Traffic degraded note"
          style={{
            margin: "12px 20px 0",
            padding: "10px 12px",
            border: "var(--border-width) solid var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface-soft)",
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          {snapshot.degradedNote}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="controllers-title"
        >
          <h2 id="controllers-title" className={styles.sectionTitle}>
            Controllers ({snapshot.controllers.length})
          </h2>
          {snapshot.controllers.length === 0 ? (
            <p className={styles.notesText}>
              No controllers registered.
            </p>
          ) : (
            <table
              className={styles.table}
              aria-label="Traffic controllers"
            >
              <thead>
                <tr>
                  <th>Controller id</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Capabilities</th>
                  <th>Commands</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.controllers.map((c) => (
                  <tr key={c.controllerId}>
                    <td className={styles.cellMono}>{c.controllerId}</td>
                    <td className={styles.cellMono}>{c.address}</td>
                    <td>
                      <StatusBadge variant={controllerBadge(c.status)}>
                        {c.statusLabel}
                      </StatusBadge>
                    </td>
                    <td className={styles.cellMono}>
                      {c.capabilities.join(", ")}
                    </td>
                    <td>
                      <div
                        role="group"
                        aria-label={`Commands for ${c.controllerId}`}
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {!canCommand ? (
                          <span className={styles.notesText}>
                            {NO_COMMAND_PERMISSION}
                          </span>
                        ) : null}
                        {(
                          ["setProgram", "setState", "reset", "blink"] as ConsoleCommandType[]
                        )
                          .filter((cmd) => c.capabilities.includes(cmd))
                          .map((cmd) => {
                            const danger = isDestructiveCommand(cmd);
                            return (
                              <Button
                                key={cmd}
                                variant={
                                  danger ? "secondary" : "secondary"
                                }
                                size="sm"
                                type="button"
                                disabled={
                                  c.status === "offline" || !canCommand
                                }
                                onClick={() =>
                                  dispatchCommand(
                                    c.controllerId,
                                    c.address,
                                    cmd,
                                  )
                                }
                                title={
                                  !canCommand
                                    ? NO_COMMAND_PERMISSION
                                    : danger
                                      ? "Dangerous: requires confirmation."
                                      : undefined
                                }
                              >
                                {cmd}
                                {danger ? " ⚠" : ""}
                              </Button>
                            );
                          })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="lights-title"
        >
          <h2 id="lights-title" className={styles.sectionTitle}>
            Traffic lights ({snapshot.lights.length})
          </h2>
          {snapshot.lights.length === 0 ? (
            <p className={styles.notesText}>
              No lights registered.
            </p>
          ) : (
            <table className={styles.table} aria-label="Traffic lights">
              <thead>
                <tr>
                  <th>Light id</th>
                  <th>Controller</th>
                  <th>Position</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.lights.map((l) => (
                  <tr key={l.lightId}>
                    <td className={styles.cellMono}>{l.lightId}</td>
                    <td className={styles.cellMono}>{l.controllerId}</td>
                    <td className={styles.cellMono}>{l.positionRef}</td>
                    <td className={styles.cellMono}>{l.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {snapshot.recentCommands.length > 0 ? (
          <section
            className={styles.section}
            aria-labelledby="recent-commands-title"
          >
            <h2
              id="recent-commands-title"
              className={styles.sectionTitle}
            >
              Recent commands ({snapshot.recentCommands.length})
            </h2>
            <ul
              aria-label="Recent traffic commands"
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {snapshot.recentCommands.map((c) => (
                <li
                  key={c.commandId}
                  className={styles.notesText}
                >
                  <span className={styles.cellMono}>
                    {c.acceptedAt}
                  </span>{" "}
                  ·{" "}
                  <span className={styles.cellMono}>
                    {c.controllerId}
                  </span>{" "}
                  ·{" "}
                  <strong>{c.commandType}</strong>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <ConfirmDestructiveDialog
        open={!!confirm}
        title={`Confirm ${confirm?.commandType ?? "command"}?`}
        description={
          confirm ? (
            <span>
              Send <strong>{confirm.commandType}</strong> to controller{" "}
              <span className={styles.cellMono}>
                {confirm.address}
              </span>{" "}
              (<span className={styles.cellMono}>
                {confirm.controllerId}
              </span>
              )?
            </span>
          ) : null
        }
        warning="This is a destructive command. It may interrupt the running program or visually distract drivers. Confirm before continuing."
        confirmLabel="Send dangerous command"
        onCancel={() => setConfirm(null)}
        onConfirm={onConfirm}
      />
    </section>
  );
}
