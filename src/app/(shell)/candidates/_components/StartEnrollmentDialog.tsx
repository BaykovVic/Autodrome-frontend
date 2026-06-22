"use client";

import { useState } from "react";

import {
  Button,
  Modal,
  StatusBadge,
  StatusDot,
} from "@/components";

import type {
  EnrollmentChannelsSnapshot,
  LocalCameraChannelState,
  RegistrarChannelState,
} from "./consoleEnrollmentChannels";

import styles from "./StartEnrollmentDialog.module.css";

type Channel = "registrar" | "local";

type Props = {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  maskedDob: string;
  channels: EnrollmentChannelsSnapshot;
};

function FaceIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
      className={styles.headerIcon}
    >
      <path d="M14.5 4h-5L7 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function TabletIcon() {
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
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function CameraIcon() {
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
      <path d="M14.5 4h-5L7 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={styles.retryNoteIcon}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
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

function registrarBadge(reg: RegistrarChannelState): {
  label: string;
  variant: "success" | "danger";
  dot: "online" | "offline";
} {
  if (reg.state === "offline") {
    return { label: "Offline", variant: "danger", dot: "offline" };
  }
  if (reg.state === "online-assigned") {
    return {
      label: "Online · assigned",
      variant: "success",
      dot: "online",
    };
  }
  return { label: "Online · idle", variant: "success", dot: "online" };
}

function cameraBadge(cam: LocalCameraChannelState): {
  label: string;
  variant: "success" | "danger";
  dot: "online" | "offline";
} {
  if (cam.state === "available") {
    return {
      label: cam.statusLabel,
      variant: "success",
      dot: "online",
    };
  }
  return {
    label: cam.statusLabel,
    variant: "danger",
    dot: "offline",
  };
}

export function StartEnrollmentDialog({
  open,
  onClose,
  candidateId,
  candidateName,
  maskedDob,
  channels,
}: Props) {
  const registrarAvailable = channels.registrar.state !== "offline";
  const localAvailable = channels.local.state === "available";

  // Default channel: prefer registrar when online, else local if
  // available; otherwise still show registrar selected so the
  // offline state is visible to the operator.
  const defaultChannel: Channel = registrarAvailable
    ? "registrar"
    : localAvailable
      ? "local"
      : "registrar";

  // Re-pick the default channel on each closed→open transition by
  // comparing the current `open` prop with the previous value stored
  // in `prevOpen`. This is the documented React pattern for
  // "Adjusting some state when a prop changes" and is preferred over
  // setState-in-effect / ref-mutation-in-render (both lint-prohibited).
  const [prevOpen, setPrevOpen] = useState(open);
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setChannel(defaultChannel);
  }

  const retryDisabled = channels.currentAttempt.active;

  const sendDisabled =
    channel === "registrar" ? !registrarAvailable : !localAvailable;
  const sendTitle =
    channel === "registrar"
      ? registrarAvailable
        ? "Send the candidate to the registrar tablet."
        : "Registrar tablet is offline. Pick the local camera or retry later."
      : localAvailable
        ? "Capture on the local Web camera station."
        : "No local camera detected. Use the registrar tablet instead.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Start face enrollment"
    >
      <div className={styles.header}>
        <FaceIcon />
        <div className={styles.headerText}>
          <div className={styles.title}>Start face enrollment</div>
          <div className={styles.candidateLine}>
            {candidateName} · {candidateId} · {maskedDob}
          </div>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.sectionTitle}>Capture channel</div>
        <div
          className={styles.channelRow}
          role="tablist"
          aria-label="Enrollment channel"
        >
          <button
            type="button"
            role="tab"
            aria-selected={channel === "registrar"}
            className={
              channel === "registrar"
                ? `${styles.channelCard} ${styles.channelCardActive}`
                : styles.channelCard
            }
            onClick={() => setChannel("registrar")}
          >
            <span className={styles.channelHead}>
              <TabletIcon />
              <span className={styles.channelLabel}>
                Send to registrar tablet
              </span>
            </span>
            <span className={styles.channelDesc}>
              Capture on the registrar tablet at the registration station.
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={channel === "local"}
            className={
              channel === "local"
                ? `${styles.channelCard} ${styles.channelCardActive}`
                : styles.channelCard
            }
            onClick={() => setChannel("local")}
          >
            <span className={styles.channelHead}>
              <CameraIcon />
              <span className={styles.channelLabel}>
                Local Web camera
              </span>
            </span>
            <span className={styles.channelDesc}>
              Capture on the camera station at the operator PC.
            </span>
          </button>
        </div>

        {channel === "registrar" ? (
          <div
            className={styles.detailCard}
            aria-label="Registrar tablet state"
          >
            <div className={styles.detailHead}>
              <StatusDot
                variant={registrarBadge(channels.registrar).dot}
                halo={false}
              />
              <span className={styles.channelLabel}>
                {channels.registrar.deviceId}
              </span>
              <StatusBadge
                variant={registrarBadge(channels.registrar).variant}
              >
                {registrarBadge(channels.registrar).label}
              </StatusBadge>
            </div>
            <dl className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Device name</dt>
                <dd className={styles.detailValue}>
                  {channels.registrar.deviceName}
                </dd>
              </div>
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Last seen</dt>
                <dd className={styles.detailValueMono}>
                  {channels.registrar.lastSeen}
                </dd>
              </div>
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Battery / network</dt>
                <dd className={styles.detailValue}>
                  {channels.registrar.batteryNetwork}
                </dd>
              </div>
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Station</dt>
                <dd className={styles.detailValue}>
                  {channels.registrar.station}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div
            className={styles.detailCard}
            aria-label="Local camera state"
          >
            <div className={styles.detailHead}>
              <StatusDot
                variant={cameraBadge(channels.local).dot}
                halo={false}
              />
              <span className={styles.channelLabel}>
                {channels.local.cameraName}
              </span>
              <StatusBadge
                variant={cameraBadge(channels.local).variant}
              >
                {cameraBadge(channels.local).label}
              </StatusBadge>
            </div>
            <p className={styles.cameraCopy}>
              {channels.local.secondMonitorCopy}
            </p>
          </div>
        )}

        <div className={styles.actionsRow}>
          {channel === "registrar" ? (
            <Button
              variant="primary"
              size="md"
              type="button"
              disabled={sendDisabled}
              title={sendTitle}
            >
              Send to registrar
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              type="button"
              disabled={sendDisabled}
              title={sendTitle}
            >
              Use local camera
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            type="button"
            disabled={retryDisabled}
            title={
              retryDisabled
                ? channels.currentAttempt.reason
                : "Re-send the enrollment command."
            }
          >
            Retry
          </Button>
          <span className={styles.spacer} aria-hidden="true" />
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        {retryDisabled ? (
          <p className={styles.retryNote} role="note">
            <InfoIcon />
            {channels.currentAttempt.reason}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
