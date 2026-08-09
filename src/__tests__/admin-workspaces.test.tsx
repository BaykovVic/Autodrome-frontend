import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { ReferenceDataScreen } from "@/app/(shell)/reference-data/_components/ReferenceDataScreen";
import { consoleReferenceDataFor } from "@/app/(shell)/reference-data/_components/consoleReferenceDataFixtures";
import { GeometryScreen } from "@/app/(shell)/autodrome-geometry/_components/GeometryScreen";
import { consoleGeometryFor } from "@/app/(shell)/autodrome-geometry/_components/consoleGeometryFixtures";
import { SchedulingScreen } from "@/app/(shell)/scheduling-integration/_components/SchedulingScreen";
import { consoleSchedulingFor } from "@/app/(shell)/scheduling-integration/_components/consoleSchedulingFixtures";

describe("ReferenceDataScreen", () => {
  it("renders heading + dictionary picker + items table", async () => {
    render(
      <ReferenceDataScreen
        snapshotOverride={consoleReferenceDataFor("normal")}
      />,
    );
    // The screen resolves its snapshot through a loader now.
    expect(
      await screen.findByRole("heading", { level: 1, name: /reference data/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("group", { name: /dictionary picker/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /reference dictionary items/i }),
    ).toBeDefined();
  });

  it("switching dictionary swaps the items table", async () => {
    render(
      <ReferenceDataScreen
        snapshotOverride={consoleReferenceDataFor("normal")}
      />,
    );
    const violationBtn = await screen.findByRole("button", {
      name: /violation codes/i,
    });
    fireEvent.click(violationBtn);
    const table = screen.getByRole("table", {
      name: /reference dictionary items/i,
    });
    expect(within(table).getByText(/Over speed limit/i)).toBeDefined();
  });

  it("service-degraded scenario surfaces degraded note", async () => {
    render(
      <ReferenceDataScreen
        snapshotOverride={consoleReferenceDataFor("service-degraded")}
      />,
    );
    expect(
      await screen.findByLabelText(/reference data degraded note/i),
    ).toBeDefined();
  });
});

describe("GeometryScreen", () => {
  it("renders heading + geometry versions table with status badges", async () => {
    render(
      <GeometryScreen
        snapshotOverride={consoleGeometryFor("normal")}
      />,
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /autodrome geometry/i,
      }),
    ).toBeDefined();
    const table = screen.getByRole("table", {
      name: /geometry versions/i,
    });
    expect(within(table).getByText(/Main parking circuit/i)).toBeDefined();
    expect(within(table).getByText(/Highway merge mock/i)).toBeDefined();
  });

  it("service-degraded scenario surfaces degraded note + only published", async () => {
    render(
      <GeometryScreen
        snapshotOverride={consoleGeometryFor("service-degraded")}
      />,
    );
    expect(
      await screen.findByLabelText(/geometry degraded note/i),
    ).toBeDefined();
  });
});

describe("SchedulingScreen", () => {
  it("renders heading + schedules + integrations tables", async () => {
    render(
      <SchedulingScreen
        snapshotOverride={consoleSchedulingFor("normal")}
      />,
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /scheduling & integration/i,
      }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /schedule list/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /integration status/i }),
    ).toBeDefined();
  });

  it("service-degraded scenario surfaces failed integration + degraded note", async () => {
    render(
      <SchedulingScreen
        snapshotOverride={consoleSchedulingFor("service-degraded")}
      />,
    );
    expect(
      await screen.findByLabelText(/scheduling degraded note/i),
    ).toBeDefined();
    expect(screen.getByText(/FleetExport/)).toBeDefined();
  });
});
