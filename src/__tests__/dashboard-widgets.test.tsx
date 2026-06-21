import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { DashboardHeader } from "@/app/(shell)/dashboard/_components/DashboardHeader";
import { DatabaseReadinessWidget } from "@/app/(shell)/dashboard/_components/DatabaseReadinessWidget";
import { DegradedNoticeBanner } from "@/app/(shell)/dashboard/_components/DegradedNoticeBanner";
import { MediaStorageWidget } from "@/app/(shell)/dashboard/_components/MediaStorageWidget";
import { NodeOperationsWidget } from "@/app/(shell)/dashboard/_components/NodeOperationsWidget";
import { OutboxBacklogWidget } from "@/app/(shell)/dashboard/_components/OutboxBacklogWidget";
import { ServiceHealthWidget } from "@/app/(shell)/dashboard/_components/ServiceHealthWidget";
import { VehicleTelemetryWidget } from "@/app/(shell)/dashboard/_components/VehicleTelemetryWidget";

describe("DashboardHeader", () => {
  it("renders node identity and triggers Refresh handler", () => {
    const onReload = vi.fn();
    render(
      <DashboardHeader
        nodeId="NODE-A2"
        site="Autodrome test site"
        lastRefresh="12:12:40"
        onReload={onReload}
      />,
    );
    expect(screen.getByText(/NODE-A2/)).toBeDefined();
    expect(screen.getByText(/Autodrome test site/)).toBeDefined();
    expect(screen.getByText("12:12:40")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole("button", { name: /run diagnostics/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});

describe("DegradedNoticeBanner", () => {
  it("renders title + detail + actions and exposes role='alert'", () => {
    render(
      <DegradedNoticeBanner
        notice={{
          title: "Vehicle telemetry broker degraded",
          detail: "2 vehicles reporting stale data.",
          primaryAction: "Retry sync",
          secondaryAction: "View broker",
        }}
      />,
    );
    const alert = screen.getByRole("alert", {
      name: /dashboard degraded notice/i,
    });
    expect(
      within(alert).getByText(/Vehicle telemetry broker degraded/i),
    ).toBeDefined();
    expect(
      within(alert).getByRole("button", { name: /retry sync/i }),
    ).toBeDefined();
    expect(
      within(alert).getByRole("button", { name: /view broker/i }),
    ).toBeDefined();
  });
});

describe("ServiceHealthWidget", () => {
  it("renders one row per service with badge + meta", () => {
    render(
      <ServiceHealthWidget
        services={[
          {
            id: "candidate",
            name: "Candidate service",
            meta: "v0.7.0",
            state: "healthy",
            badgeLabel: "ok",
          },
          {
            id: "vehicle",
            name: "Vehicle service",
            meta: "probe failed",
            state: "down",
            badgeLabel: "down",
          },
        ]}
      />,
    );
    const list = screen.getByRole("list", {
      name: /service health rows/i,
    });
    expect(within(list).getByText("Candidate service")).toBeDefined();
    expect(within(list).getByText("Vehicle service")).toBeDefined();
    expect(within(list).getByText("probe failed")).toBeDefined();
    expect(within(list).getByText("down")).toBeDefined();
  });
});

describe("DatabaseReadinessWidget", () => {
  it("renders 'Schema ready' green when schemaReady is true", () => {
    render(
      <DatabaseReadinessWidget
        data={{
          schemaReady: true,
          migrationLabel: "migration 0142",
          pendingWrites: 0,
          openSessions: 7,
          walQueueMb: 2.1,
          lastVacuum: "03:00",
        }}
      />,
    );
    expect(screen.getByText("Schema ready")).toBeDefined();
    expect(screen.getByText("migration 0142")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
    expect(screen.getByText("2.1 MB")).toBeDefined();
    expect(screen.getByText("03:00")).toBeDefined();
  });

  it("renders 'Schema not ready' when schema is unprepared", () => {
    render(
      <DatabaseReadinessWidget
        data={{
          schemaReady: false,
          migrationLabel: "no migration",
          pendingWrites: 0,
          openSessions: 0,
          walQueueMb: 0,
          lastVacuum: "—",
        }}
      />,
    );
    expect(screen.getByText("Schema not ready")).toBeDefined();
  });
});

describe("MediaStorageWidget", () => {
  it("renders used/total + summary + accessible progressbar", () => {
    render(
      <MediaStorageWidget
        data={{
          usedGb: 588,
          totalGb: 1000,
          segments: [
            { label: "Sealed", gb: 420 },
            { label: "Buffer", gb: 168 },
          ],
          summary: "Healthy",
        }}
      />,
    );
    expect(screen.getByText("588")).toBeDefined();
    expect(screen.getByText("/ 1000 GB", { exact: false })).toBeDefined();
    expect(screen.getByText("Healthy")).toBeDefined();
    const bar = screen.getByRole("progressbar", {
      name: /media storage usage/i,
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("588");
    expect(bar.getAttribute("aria-valuemax")).toBe("1000");
    expect(screen.getByText(/Sealed 420 GB/)).toBeDefined();
    expect(screen.getByText(/Buffer 168 GB/)).toBeDefined();
  });
});

describe("VehicleTelemetryWidget", () => {
  it("renders 4 tiles with their values and optional stale note", () => {
    render(
      <VehicleTelemetryWidget
        data={{
          tiles: [
            { label: "Online", value: 3, tone: "online" },
            { label: "Degraded", value: 1, tone: "degraded" },
            { label: "Offline", value: 1, tone: "offline" },
            { label: "Standby", value: 1, tone: "standby" },
          ],
          staleNote: "Stale: VEH-07 (42s)",
        }}
      />,
    );
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("Online")).toBeDefined();
    expect(screen.getByText("Degraded")).toBeDefined();
    expect(screen.getByText("Offline")).toBeDefined();
    expect(screen.getByText("Standby")).toBeDefined();
    expect(screen.getByText(/Stale: VEH-07/)).toBeDefined();
  });
});

describe("OutboxBacklogWidget", () => {
  it("renders queued value + Paused status + retry note", () => {
    render(
      <OutboxBacklogWidget
        data={{
          queued: 14,
          status: "paused",
          oldestEvent: "00:11:20",
          sparkline: [4, 7, 5, 10, 14],
          nextRetryNote: "Oldest event 00:11:20",
        }}
      />,
    );
    expect(screen.getByText("14")).toBeDefined();
    expect(screen.getByText("queued events")).toBeDefined();
    expect(screen.getByText("Paused")).toBeDefined();
    expect(screen.getByText(/Oldest event 00:11:20/)).toBeDefined();
  });

  it("renders Live status when broker is healthy", () => {
    render(
      <OutboxBacklogWidget
        data={{
          queued: 0,
          status: "live",
          sparkline: [0, 0, 0, 0, 0],
          nextRetryNote: "Outbox flushed.",
        }}
      />,
    );
    expect(screen.getByText("Live")).toBeDefined();
  });
});

describe("NodeOperationsWidget", () => {
  it("renders all rows with values", () => {
    render(
      <NodeOperationsWidget
        items={[
          { label: "Uptime", value: "6d 04:12", tone: "ok" },
          { label: "Last backup", value: "today 03:00", tone: "neutral" },
          { label: "Sync mode", value: "Deferred", tone: "watch" },
          {
            label: "Environment",
            value: "Local / production",
            tone: "ok",
          },
        ]}
      />,
    );
    expect(screen.getByText("Uptime")).toBeDefined();
    expect(screen.getByText("6d 04:12")).toBeDefined();
    expect(screen.getByText("Deferred")).toBeDefined();
    expect(screen.getByText("Local / production")).toBeDefined();
  });
});
