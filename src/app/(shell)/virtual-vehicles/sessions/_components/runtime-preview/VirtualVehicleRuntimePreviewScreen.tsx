"use client";

import Link from "next/link";

import {
  ApiErrorView,
  EmptyState,
  Skeleton,
  StatusBadge,
  type StatusBadgeVariant,
  StatusDot,
  type StatusDotVariant,
} from "@/components";
import {
  formatPose,
  formatYawDegrees,
  type ConsoleRuntimePreview,
  type ConsoleRuntimePreviewState,
  type ConsoleRuntimeSensorHealth,
} from "./consoleVirtualVehicleRuntimePreviewSnapshot";
import {
  useConsoleVirtualVehicleRuntimePreview,
  type ConsoleRuntimePreviewLoader,
} from "./useConsoleVirtualVehicleRuntimePreview";
import styles from "./VirtualVehicleRuntimePreview.module.css";

type Props = {
  sessionId: string;
  loader?: ConsoleRuntimePreviewLoader;
};

function stateDot(state: ConsoleRuntimePreviewState): StatusDotVariant {
  switch (state) {
    case "running":
      return "online";
    case "paused":
      return "standby";
    case "degraded":
      return "degraded";
    case "noRuntime":
    case "unknown":
    default:
      return "offline";
  }
}

function stateBadge(state: ConsoleRuntimePreviewState): StatusBadgeVariant {
  switch (state) {
    case "running":
      return "success";
    case "paused":
      return "info";
    case "degraded":
      return "warning";
    case "noRuntime":
      return "neutral";
    case "unknown":
    default:
      return "neutral";
  }
}

function healthDot(
  health: ConsoleRuntimeSensorHealth,
): StatusDotVariant {
  switch (health) {
    case "ok":
      return "online";
    case "degraded":
      return "degraded";
    case "offline":
    default:
      return "offline";
  }
}

export function VirtualVehicleRuntimePreviewScreen({
  sessionId,
  loader,
}: Props) {
  const state = useConsoleVirtualVehicleRuntimePreview(sessionId, loader);

  if (state.loading) {
    return (
      <section
        className={styles.screen}
        aria-label={`Runtime preview for ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <Skeleton lines={6} label="Loading runtime preview" />
        </div>
      </section>
    );
  }

  if (state.fatalError) {
    return (
      <section
        className={styles.screen}
        aria-label={`Runtime preview for ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <ApiErrorView error={state.fatalError} onRetry={state.reload} />
        </div>
      </section>
    );
  }

  const preview = state.snapshot;
  if (!preview) {
    return (
      <section
        className={styles.screen}
        aria-label={`Runtime preview for ${sessionId}`}
      >
        <div className={styles.loadingPad}>
          <EmptyState
            title="Session not found"
            description="No fixture or live runtime snapshot returned for this session id."
          />
        </div>
      </section>
    );
  }

  return renderPreview(preview);
}

function renderPreview(preview: ConsoleRuntimePreview) {
  const showReason = preview.state !== "running";
  const noRuntime = preview.state === "noRuntime";

  return (
    <section
      className={styles.screen}
      aria-label={`Runtime preview for ${preview.sessionId}`}
    >
      <header className={styles.header}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/virtual-vehicles" className={styles.crumbsLink}>
            Virtual Vehicles
          </Link>
          <span aria-hidden="true">›</span>
          <Link
            href={`/virtual-vehicles/sessions/${preview.sessionId}`}
            className={styles.crumbsLink}
          >
            Session · {preview.sessionId}
          </Link>
          <span aria-hidden="true">›</span>
          <span className={styles.crumbsCurrent}>Runtime preview</span>
        </nav>
        <h1 className={styles.title}>Runtime preview</h1>
        <p className={styles.subtitle}>
          {preview.vehicleLabel} ·{" "}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              verticalAlign: "middle",
            }}
          >
            <StatusDot variant={stateDot(preview.state)} halo={false} />
            <StatusBadge variant={stateBadge(preview.state)}>
              {preview.stateLabel}
            </StatusBadge>
          </span>{" "}
          · captured at <strong>{preview.capturedAt}</strong>
        </p>
      </header>

      {showReason && preview.reason ? (
        <p className={styles.reasonBanner} role="status">
          {preview.reason}
        </p>
      ) : null}

      <div className={styles.body}>
        <section
          className={styles.section}
          aria-labelledby="runtime-preview-pose-title"
        >
          <h2
            id="runtime-preview-pose-title"
            className={styles.sectionTitle}
          >
            Pose &amp; motion
          </h2>
          {noRuntime ? (
            <p className={styles.notesText}>
              No pose telemetry has been captured yet for this session.
            </p>
          ) : (
            <dl className={styles.poseGrid}>
              <dt className={styles.poseLabel}>Position</dt>
              <dd className={styles.poseValue}>
                {formatPose(preview.pose)}
              </dd>
              <dt className={styles.poseLabel}>Yaw</dt>
              <dd className={styles.poseValue}>
                {formatYawDegrees(preview.pose.yaw)} (
                {preview.pose.yaw.toFixed(3)} rad)
              </dd>
              <dt className={styles.poseLabel}>Speed</dt>
              <dd className={styles.poseValue}>
                {preview.speedKmh.toFixed(0)} km/h
              </dd>
              <dt className={styles.poseLabel}>Gear</dt>
              <dd className={styles.poseValue}>
                {preview.gearLabel}{" "}
                <span className={styles.badgeCanonical}>
                  ({preview.gear})
                </span>
              </dd>
            </dl>
          )}
        </section>

        <section
          className={styles.section}
          aria-labelledby="runtime-preview-scenario-title"
        >
          <h2
            id="runtime-preview-scenario-title"
            className={styles.sectionTitle}
          >
            Scenario compatibility
          </h2>
          <p className={styles.notesText}>
            Scenario <strong>{preview.compatibility.scenarioId}</strong>{" "}
            ({preview.compatibility.scenarioLabel})
          </p>
          <div
            className={styles.badgeRow}
            role="group"
            aria-label="Scenario compatibility badges"
          >
            <span className={styles.badge}>
              {preview.compatibility.sourceLabel}{" "}
              <span className={styles.badgeCanonical}>
                ({preview.compatibility.source})
              </span>
            </span>
            <span className={styles.badge}>
              Yaw: {preview.compatibility.yawFrameLabel}{" "}
              <span className={styles.badgeCanonical}>
                ({preview.compatibility.yawFrame})
              </span>
            </span>
            <span className={styles.badge}>
              Frame: {preview.compatibility.coordinateFrameLabel}{" "}
              <span className={styles.badgeCanonical}>
                ({preview.compatibility.coordinateFrame})
              </span>
            </span>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.sectionFull}`}
          aria-labelledby="runtime-preview-sensors-title"
        >
          <h2
            id="runtime-preview-sensors-title"
            className={styles.sectionTitle}
          >
            Sensor health
          </h2>
          <ul className={styles.sensorList} aria-label="Sensor health">
            {preview.sensors.map((s) => (
              <li key={s.sensor} className={styles.sensorRow}>
                <span className={styles.sensorLabel}>
                  {s.label}{" "}
                  <span className={styles.sensorCanonical}>
                    ({s.sensor})
                  </span>
                </span>
                <span className={styles.sensorHealth}>
                  <StatusDot
                    variant={healthDot(s.health)}
                    halo={false}
                  />
                  {s.healthLabel}{" "}
                  <span className={styles.sensorCanonical}>
                    ({s.health})
                  </span>
                </span>
                <span className={styles.sensorDetail}>
                  {s.detail ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
