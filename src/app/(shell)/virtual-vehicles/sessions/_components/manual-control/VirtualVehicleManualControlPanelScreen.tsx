"use client";

import Link from "next/link";

import {
  ApiErrorView,
  Button,
  EmptyState,
  Skeleton,
} from "@/components";
import {
  manualControlsAllowed,
  type ConsoleManualControlPanel,
} from "./consoleVirtualVehicleManualControlSnapshot";
import {
  useConsoleVirtualVehicleManualControl,
  type ConsoleManualControlLoader,
} from "./useConsoleVirtualVehicleManualControl";
import styles from "./VirtualVehicleManualControlPanel.module.css";

type Props = {
  sessionId: string;
  loader?: ConsoleManualControlLoader;
};

function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(0)} km/h`;
}

function formatSteering(value: number): string {
  const clamped = Math.max(-1, Math.min(1, value));
  const sign = clamped > 0 ? "+" : "";
  return `${sign}${clamped.toFixed(2)}`;
}

export function VirtualVehicleManualControlPanelScreen({
  sessionId,
  loader,
}: Props) {
  const state = useConsoleVirtualVehicleManualControl(sessionId, loader);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label={`Manual control for ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading manual control" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label={`Manual control for ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const panel = state.snapshot;
  if (!panel) {
    return (
      <section
        className={styles.screen}
        aria-label={`Manual control for ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <EmptyState
            title="Session not found"
            description="No fixture or live manual control snapshot returned for this session id."
          />
        </div>
      </section>
    );
  }

  return renderPanel(panel);
}

function renderPanel(panel: ConsoleManualControlPanel) {
  const controlsAllowed = manualControlsAllowed(panel.sessionState);
  const liveTooltip =
    "Live command flow lands with the upcoming virtual-vehicle live API integration feature.";
  const disabledHint = panel.disabledReason ?? "";

  return (
    <section
      className={styles.screen}
      aria-label={`Manual control for ${panel.sessionId}`}
    >
      <header className={styles.header}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/virtual-vehicles" className={styles.crumbsLink}>
            Virtual Vehicles
          </Link>
          <span aria-hidden="true">›</span>
          <Link
            href={`/virtual-vehicles/sessions/${panel.sessionId}`}
            className={styles.crumbsLink}
          >
            Session · {panel.sessionId}
          </Link>
          <span aria-hidden="true">›</span>
          <span className={styles.crumbsCurrent}>Manual control</span>
        </nav>
        <h1 className={styles.title}>Manual control</h1>
        <p className={styles.subtitle}>
          {panel.vehicleLabel} · session state{" "}
          <strong>{panel.sessionStateLabel}</strong> ({panel.sessionState})
        </p>
      </header>

      {!controlsAllowed ? (
        <p className={styles.disabledBanner} role="status">
          {disabledHint}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="manual-control-drive-title"
        >
          <h2
            id="manual-control-drive-title"
            className={styles.sectionTitle}
          >
            Drive controls
          </h2>

          <div className={styles.controlRow}>
            <label className={styles.controlLabel} htmlFor="manual-speed">
              <span>Speed</span>
              <span className={styles.controlValue}>
                {formatSpeed(panel.speedKmh)}
              </span>
            </label>
            <input
              id="manual-speed"
              className={styles.controlSlider}
              type="range"
              min={0}
              max={200}
              step={1}
              defaultValue={panel.speedKmh}
              disabled={!controlsAllowed}
              aria-label="Target speed in km/h"
              title={controlsAllowed ? liveTooltip : disabledHint}
            />
            <span className={styles.controlHint}>
              Range 0–200 km/h. Live transport binds in Track 3.
            </span>
          </div>

          <div className={styles.controlRow}>
            <label
              className={styles.controlLabel}
              htmlFor="manual-steering"
            >
              <span>Steering</span>
              <span className={styles.controlValue}>
                {formatSteering(panel.steering)}
              </span>
            </label>
            <input
              id="manual-steering"
              className={styles.controlSlider}
              type="range"
              min={-1}
              max={1}
              step={0.01}
              defaultValue={panel.steering}
              disabled={!controlsAllowed}
              aria-label="Steering normalized −1 (left) to +1 (right)"
              title={controlsAllowed ? liveTooltip : disabledHint}
            />
            <span className={styles.controlHint}>
              Normalized −1 (full left) to +1 (full right).
            </span>
          </div>

          <div
            className={styles.actionsRow}
            role="group"
            aria-label="Pose and command actions"
          >
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title={controlsAllowed ? liveTooltip : disabledHint}
            >
              Reset position
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled
              title={controlsAllowed ? liveTooltip : disabledHint}
            >
              Send command
            </Button>
          </div>

          <p className={styles.lastCommand}>
            Last command at: {panel.lastCommandAt}
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="manual-control-sensors-title"
        >
          <h2
            id="manual-control-sensors-title"
            className={styles.sectionTitle}
          >
            Sensor toggles
          </h2>
          <ul className={styles.sensorList} aria-label="Sensor toggles">
            {panel.sensors.map((s) => {
              const inputId = `manual-sensor-${s.sensor}`;
              return (
                <li key={s.sensor} className={styles.sensorRow}>
                  <input
                    id={inputId}
                    className={styles.sensorCheckbox}
                    type="checkbox"
                    defaultChecked={s.enabled}
                    disabled={!controlsAllowed}
                    aria-label={`${s.label} (${s.sensor})`}
                    title={controlsAllowed ? liveTooltip : disabledHint}
                  />
                  <label
                    htmlFor={inputId}
                    className={styles.sensorLabel}
                  >
                    {s.label}{" "}
                    <span className={styles.sensorCanonical}>
                      ({s.sensor})
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <span className={styles.controlHint}>
            Sensor toggles use canonical capability tokens; no raw bitmask
            UI is exposed.
          </span>
        </section>
      </div>
    </section>
  );
}
