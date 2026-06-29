"use client";

import { useCallback, useState } from "react";

import { getApiAdapter } from "@/api/get-api-adapter";
import { resolveRuntimeMode } from "@/api/runtime-config";
import {
  ApiErrorView,
  Button,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";

import {
  isPlaybackActionAllowed,
  type ConsoleRpiEmulatorSnapshot,
  type ConsoleSimulatorBridgeConnection,
  type ConsoleSimulatorPhase,
} from "./consoleRpiEmulator";
import {
  liveRpiPlaybackPause,
  liveRpiPlaybackResume,
  liveRpiPlaybackStart,
  liveRpiPlaybackStop,
} from "./liveRpiEmulatorLoader";
import {
  useConsoleRpiEmulator,
  type ConsoleRpiEmulatorLoader,
} from "./useConsoleRpiEmulator";

import styles from "./RpiEmulatorScreen.module.css";

type Props = {
  loader?: ConsoleRpiEmulatorLoader;
  /**
   * Optional command overrides for tests. Defaults dispatch via the
   * live adapter when runtime mode is live; in mock mode they are
   * no-ops so the operator can demo the UI without a backend.
   */
  commands?: {
    start: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
};

function phaseDot(p: ConsoleSimulatorPhase): StatusDotVariant {
  if (p === "playing") return "online";
  if (p === "paused" || p === "loaded") return "degraded";
  if (p === "failed") return "offline";
  return "standby";
}

function phaseBadge(p: ConsoleSimulatorPhase): StatusBadgeVariant {
  if (p === "playing") return "success";
  if (p === "paused" || p === "loaded") return "warning";
  if (p === "failed") return "danger";
  return "neutral";
}

function bridgeDot(
  c: ConsoleSimulatorBridgeConnection,
): StatusDotVariant {
  if (c === "connected") return "online";
  if (c === "connecting") return "degraded";
  if (c === "degraded") return "degraded";
  return "offline";
}

function bridgeBadge(
  c: ConsoleSimulatorBridgeConnection,
): StatusBadgeVariant {
  if (c === "connected") return "success";
  if (c === "connecting" || c === "degraded") return "warning";
  return "danger";
}

function defaultCommands() {
  return {
    start: async () => {
      if (resolveRuntimeMode() !== "live") return;
      await liveRpiPlaybackStart(getApiAdapter({ mode: "live" }));
    },
    pause: async () => {
      if (resolveRuntimeMode() !== "live") return;
      await liveRpiPlaybackPause(getApiAdapter({ mode: "live" }));
    },
    resume: async () => {
      if (resolveRuntimeMode() !== "live") return;
      await liveRpiPlaybackResume(getApiAdapter({ mode: "live" }));
    },
    stop: async () => {
      if (resolveRuntimeMode() !== "live") return;
      await liveRpiPlaybackStop(getApiAdapter({ mode: "live" }));
    },
  };
}

export function RpiEmulatorScreen({ loader, commands }: Props) {
  const state = useConsoleRpiEmulator(loader);
  const [commandError, setCommandError] = useState<unknown | null>(null);
  const [inFlight, setInFlight] = useState<
    "start" | "pause" | "resume" | "stop" | null
  >(null);

  const dispatch = useCallback(
    async (action: "start" | "pause" | "resume" | "stop") => {
      const cmd = commands ?? defaultCommands();
      setCommandError(null);
      setInFlight(action);
      try {
        await cmd[action]();
        // Reload so the new phase reflects post-dispatch.
        state.reload();
      } catch (error) {
        setCommandError(error);
      } finally {
        setInFlight(null);
      }
    },
    [commands, state],
  );

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label="RPi emulator workspace"
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading RPi emulator" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label="RPi emulator workspace"
      >
        <div className={styles.loadingPad}>
          <ApiErrorView
            error={state.fatalError}
            onRetry={state.reload}
          />
        </div>
      </section>
    );
  }

  if (!state.snapshot) return null;
  const snapshot: ConsoleRpiEmulatorSnapshot = state.snapshot;
  const { runtime, bridge } = snapshot;

  return (
    <section
      className={styles.screen}
      aria-label="RPi emulator workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>
          RPi hardware emulator
          <span
            className={styles.sourceChip}
            aria-label="Vehicle source — RPi hardware emulator"
          >
            (rpiHardware)
          </span>
        </h1>
        <p className={styles.subtitle}>
          Thin-client control surface for the Raspberry-Pi-hosted
          hardware emulator. Web VirtualVehicle sessions are a
          separate runtime and do not share state with this view.
        </p>
      </header>

      <div className={styles.body}>
        <section
          className={styles.card}
          aria-label="Emulator runtime status"
        >
          <div className={styles.cardTitle}>Runtime</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusDot variant={phaseDot(runtime.phase)} halo={false} />
            <StatusBadge variant={phaseBadge(runtime.phase)}>
              {runtime.phaseLabel}
            </StatusBadge>
          </div>
          <dl className={styles.metaGrid}>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Emulator id</span>
              <span className={styles.metaValue}>{runtime.emulatorId}</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Observed at</span>
              <span className={styles.metaValue}>{runtime.observedAt}</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Loaded scenario</span>
              <span className={styles.metaValue}>
                {runtime.loadedScenarioId ?? "—"}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Scenario format</span>
              <span className={styles.metaValue}>
                {runtime.loadedScenarioFormatLabel
                  ? `${runtime.loadedScenarioFormatLabel} (${runtime.loadedScenarioFormat})`
                  : "—"}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Playback session</span>
              <span className={styles.metaValue}>
                {runtime.playbackSessionId ?? "—"}
              </span>
            </div>
          </dl>
          {snapshot.runtimeError ? (
            <p
              className={styles.error}
              role="alert"
              aria-label="Runtime status error"
            >
              {snapshot.runtimeError}
            </p>
          ) : null}

          <div
            className={styles.actions}
            role="group"
            aria-label="Playback controls"
          >
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => void dispatch("start")}
              disabled={
                inFlight !== null ||
                !isPlaybackActionAllowed(runtime.phase, "start")
              }
              title={
                isPlaybackActionAllowed(runtime.phase, "start")
                  ? "POST /simulator/playback/start (Idempotency-Key)."
                  : "Start requires a loaded or stopped scenario."
              }
            >
              {inFlight === "start" ? "Starting…" : "Start"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => void dispatch("pause")}
              disabled={
                inFlight !== null ||
                !isPlaybackActionAllowed(runtime.phase, "pause")
              }
              title={
                isPlaybackActionAllowed(runtime.phase, "pause")
                  ? "POST /simulator/playback/pause (Idempotency-Key)."
                  : "Pause is only available during playback."
              }
            >
              {inFlight === "pause" ? "Pausing…" : "Pause"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => void dispatch("resume")}
              disabled={
                inFlight !== null ||
                !isPlaybackActionAllowed(runtime.phase, "resume")
              }
              title={
                isPlaybackActionAllowed(runtime.phase, "resume")
                  ? "POST /simulator/playback/resume (Idempotency-Key)."
                  : "Resume is only available from paused playback."
              }
            >
              {inFlight === "resume" ? "Resuming…" : "Resume"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={() => void dispatch("stop")}
              disabled={
                inFlight !== null ||
                !isPlaybackActionAllowed(runtime.phase, "stop")
              }
              title={
                isPlaybackActionAllowed(runtime.phase, "stop")
                  ? "POST /simulator/playback/stop (Idempotency-Key)."
                  : "Stop requires an active or paused playback."
              }
            >
              {inFlight === "stop" ? "Stopping…" : "Stop"}
            </Button>
          </div>
          {commandError ? (
            <p className={styles.error} role="alert">
              Command failed:{" "}
              {commandError instanceof Error
                ? commandError.message
                : String(commandError)}
            </p>
          ) : null}
        </section>

        <section
          className={styles.card}
          aria-label="Tablet/web bridge status"
        >
          <div className={styles.cardTitle}>Tablet / Web bridge</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusDot
              variant={bridgeDot(bridge.connection)}
              halo={false}
            />
            <StatusBadge variant={bridgeBadge(bridge.connection)}>
              {bridge.connectionLabel}
            </StatusBadge>
          </div>
          <dl className={styles.metaGrid}>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Bound tablet</span>
              <span className={styles.metaValue}>
                {bridge.boundTabletDeviceId ?? "—"}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Active playback</span>
              <span className={styles.metaValue}>
                {bridge.activePlaybackSessionId ?? "—"}
              </span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Observed at</span>
              <span className={styles.metaValue}>{bridge.observedAt}</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.metaLabel}>Reason</span>
              <span className={styles.metaValue}>
                {bridge.reason ?? "—"}
              </span>
            </div>
          </dl>
          {snapshot.bridgeError ? (
            <p
              className={styles.error}
              role="alert"
              aria-label="Bridge status error"
            >
              {snapshot.bridgeError}
            </p>
          ) : null}
        </section>
      </div>
    </section>
  );
}
