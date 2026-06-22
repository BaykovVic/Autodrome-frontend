"use client";

import { useState } from "react";

import type {
  CameraStationSnapshot,
  CaptureCheck,
} from "@/app/(shell)/candidates/_components/consoleCameraStation";
import {
  consoleCameraStationFor,
  isCameraStationScenario,
} from "@/app/(shell)/candidates/_components/consoleCameraStationFixtures";

import styles from "./CaptureWindowSurface.module.css";

type Props = {
  /**
   * Optional snapshot override for tests. Production usage flows
   * through `defaultLoader()`.
   */
  snapshot?: CameraStationSnapshot;
};

type Phase = "capturing" | "done" | "cancelled";

function defaultSnapshot(): CameraStationSnapshot {
  const env = process.env.NEXT_PUBLIC_CAMERA_STATION_SCENARIO;
  if (isCameraStationScenario(env)) {
    return consoleCameraStationFor(env);
  }
  return consoleCameraStationFor("capturing");
}

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={styles.privacyIcon}
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function chipClass(tone: CaptureCheck["tone"]): string {
  switch (tone) {
    case "degraded":
      return `${styles.qualityChip} ${styles.qualityChipDegraded}`;
    case "offline":
      return `${styles.qualityChip} ${styles.qualityChipOffline}`;
    case "online":
    case "standby":
    default:
      return styles.qualityChip;
  }
}

export function CaptureWindowSurface({ snapshot }: Props) {
  const data = snapshot ?? defaultSnapshot();
  const initialPhase: Phase =
    data.scenario === "done"
      ? "done"
      : data.scenario === "cancelled"
        ? "cancelled"
        : "capturing";
  const [phase, setPhase] = useState<Phase>(initialPhase);

  const handleDone = () => {
    if (phase !== "capturing") return;
    setPhase("done");
  };
  const handleCancel = () => {
    if (phase !== "capturing") return;
    setPhase("cancelled");
  };

  return (
    <div className={styles.page}>
      <div className={styles.window} role="dialog" aria-label="Capture window">
        <p className={styles.caption}>
          CAPTURE WINDOW ON SECOND MONITOR · for candidate
        </p>
        <div className={styles.titleBar}>
          <span className={styles.titleDot} aria-hidden="true" />
          <span className={styles.titleText}>Capture for enrollment</span>
          <span className={styles.titleMono}>{data.sessionId}</span>
          <span className={styles.titleSpacer} aria-hidden="true" />
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close capture window"
            onClick={handleCancel}
            disabled={phase !== "capturing"}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.preview} aria-label="Candidate preview frame">
          <div className={styles.previewOval} aria-hidden="true" />
          <div className={styles.previewPrimary}>Look straight into the camera</div>
          <div className={styles.previewSecondary}>
            Keep your face inside the oval · do not move
          </div>
          <div className={styles.candidateContext}>
            <div className={styles.candidateName}>{data.candidate}</div>
            <div className={styles.candidateMono}>
              {data.maskedDob} · {data.candidateId}
            </div>
          </div>
          <div className={styles.qualityChips} aria-label="Quality checks">
            {data.captureChecks.map((c) => (
              <span key={c.id} className={chipClass(c.tone)}>
                {c.label}
              </span>
            ))}
          </div>
          {phase !== "capturing" ? (
            <div className={styles.committedOverlay} role="status" aria-live="polite">
              <p className={styles.committedTitle}>
                {phase === "done" ? "Capture finished" : "Capture cancelled"}
              </p>
              <p className={styles.committedSubtitle}>
                {phase === "done"
                  ? "Template sealed on NODE-A2 in the local mock. No real biometry inference / image upload runs in this baseline."
                  : "Operator cancelled capture. No frames left the local node — nothing was uploaded in this baseline."}
              </p>
            </div>
          ) : null}
        </div>
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <div className={styles.privacyRow}>
              <LockIcon />
              <span className={styles.privacyText}>
                Frames are processed on the node. Images do not leave
                NODE-A2.
              </span>
            </div>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={data.capture.progressPercent}
              aria-label="Capture progress"
            >
              <div
                className={styles.progressBarFill}
                style={{ width: `${data.capture.progressPercent}%` }}
              />
            </div>
            <div className={styles.bestFrameLine}>
              {data.capture.bestFrameLabel}
            </div>
          </div>
          <div className={styles.footerActions}>
            <button
              type="button"
              className={styles.doneBtn}
              onClick={handleDone}
              disabled={phase !== "capturing"}
              title={
                phase === "capturing"
                  ? "Finalize capture (mock-only)."
                  : phase === "done"
                    ? "Capture already finished."
                    : "Capture already cancelled."
              }
            >
              Done
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={phase !== "capturing"}
              title={
                phase === "capturing"
                  ? "Cancel capture (mock-only)."
                  : phase === "done"
                    ? "Capture already finished."
                    : "Capture already cancelled."
              }
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
