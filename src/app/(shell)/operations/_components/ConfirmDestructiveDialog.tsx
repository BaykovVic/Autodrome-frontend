"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { Button, Modal } from "@/components";
import styles from "./ConfirmDestructiveDialog.module.css";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  /**
   * Optional extra warning shown above the action buttons. The
   * caller is responsible for keeping the message domain-friendly.
   */
  warning?: ReactNode;
};

export function ConfirmDestructiveDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  warning,
}: Props) {
  // Re-focus the cancel button when the dialog opens so destructive
  // confirm is never the implicit default.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const cancel = document.querySelector<HTMLButtonElement>(
        '[data-destructive-cancel="true"]',
      );
      cancel?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <Modal open={open} onClose={onCancel} ariaLabel={title}>
      <section className={styles.section}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.description}>{description}</div>
        {warning ? (
          <p className={styles.warning} role="note">
            {warning}
          </p>
        ) : null}
        <footer className={styles.footer}>
          <Button
            data-destructive-cancel="true"
            variant="secondary"
            size="sm"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </footer>
      </section>
    </Modal>
  );
}
