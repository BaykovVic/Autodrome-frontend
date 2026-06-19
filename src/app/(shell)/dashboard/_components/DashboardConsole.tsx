"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  StatusBadge,
  Table,
  Tabs,
  Toolbar,
  ToolbarSection,
} from "@/components";
import styles from "./DashboardConsole.module.css";

const overviewRows = [
  { id: "v-01", label: "Vehicle 01", status: "online" as const },
  { id: "v-02", label: "Vehicle 02", status: "idle" as const },
  { id: "v-03", label: "Vehicle 03", status: "offline" as const },
];

function statusVariant(status: "online" | "idle" | "offline") {
  if (status === "online") return "success" as const;
  if (status === "idle") return "warning" as const;
  return "danger" as const;
}

export function DashboardConsole() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className={styles.console}>
      <Toolbar ariaLabel="Dashboard actions">
        <ToolbarSection>
          <StatusBadge variant="info">live</StatusBadge>
          <span className={styles.toolbarLabel}>
            Operational overview
          </span>
        </ToolbarSection>
        <ToolbarSection>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            Open shortcuts
          </Button>
        </ToolbarSection>
      </Toolbar>

      <Tabs
        ariaLabel="Dashboard sections"
        items={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <Table caption="Active exam vehicles (placeholder)">
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>
                        <StatusBadge variant={statusVariant(row.status)}>
                          {row.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ),
          },
          {
            id: "today",
            label: "Today",
            content: (
              <p className={styles.tabBody}>
                Exam schedule for today appears here once exam-service is
                wired up.
              </p>
            ),
          },
          {
            id: "alerts",
            label: "Alerts",
            content: (
              <p className={styles.tabBody}>
                Critical alerts and audit signals will appear here.
              </p>
            ),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ariaLabel="Operator shortcuts"
      >
        <h2 className={styles.modalTitle}>Operator shortcuts</h2>
        <p className={styles.modalBody}>
          Native dialog baseline. Replace with real shortcuts when the
          command palette feature lands.
        </p>
        <div className={styles.modalActions}>
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
