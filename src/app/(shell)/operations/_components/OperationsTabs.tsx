"use client";

import { Tabs } from "@/components";
import { BackupsPanel } from "./BackupsPanel";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { InstallerPanel } from "./InstallerPanel";
import { LogsPanel } from "./LogsPanel";
import { ReleasePanel } from "./ReleasePanel";
import { ServiceHealthDashboard } from "./ServiceHealthDashboard";

export function OperationsTabs() {
  return (
    <Tabs
      ariaLabel="Operations sections"
      defaultActiveId="service-health"
      items={[
        {
          id: "service-health",
          label: "Service health",
          content: <ServiceHealthDashboard />,
        },
        {
          id: "diagnostics",
          label: "Diagnostics",
          content: <DiagnosticsPanel />,
        },
        {
          id: "backups",
          label: "Backups",
          content: <BackupsPanel />,
        },
        {
          id: "installer",
          label: "Installer",
          content: <InstallerPanel />,
        },
        {
          id: "logs",
          label: "Logs",
          content: <LogsPanel />,
        },
        {
          id: "release",
          label: "Release",
          content: <ReleasePanel />,
        },
      ]}
    />
  );
}
