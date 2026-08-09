import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";
import { consoleDashboardFor } from "@/app/(shell)/dashboard/_components/consoleDashboardFixtures";
import { LocalNodeDashboard } from "@/app/(shell)/dashboard/_components/LocalNodeDashboard";
import {
  alertsToNotice,
  liveDashboardLoader,
  mapServiceState,
  prefersAdminDashboard,
} from "@/app/(shell)/dashboard/_components/liveDashboardLoader";

const NOW = () => new Date("2026-08-08T10:20:30Z");

function bff(GET: unknown): AutodromeApi {
  return { apiGatewayBff: { GET } } as unknown as AutodromeApi;
}

describe("liveDashboardLoader — role-driven read model", () => {
  it("admin roles read GET /dashboard/admin and map service health", async () => {
    const GET = vi.fn(async () => ({
      data: {
        serviceHealth: [
          { service: "exam-service", status: "healthy" },
          { service: "media-archive", status: "degraded" },
        ],
        alerts: [],
      },
    }));
    const snap = await liveDashboardLoader(bff(GET), ["admin"], NOW);
    expect(GET).toHaveBeenCalledWith("/dashboard/admin", {});
    expect(snap.serviceHealth.map((s) => [s.name, s.state])).toEqual([
      ["exam-service", "healthy"],
      ["media-archive", "degraded"],
    ]);
  });

  it("non-admin roles read GET /dashboard/dispatcher with reported counts", async () => {
    const GET = vi.fn(async () => ({
      data: {
        exams: ["e1", "e2", "e3"],
        vehicles: ["v1"],
        equipmentHealth: [{ equipmentId: "cam-1", status: "down" }],
        alerts: [],
      },
    }));
    const snap = await liveDashboardLoader(bff(GET), ["dispatcher"], NOW);
    expect(GET).toHaveBeenCalledWith("/dashboard/dispatcher", {});
    expect(snap.serviceHealth[0].state).toBe("down");
    expect(snap.nodeOps).toEqual([
      { label: "Exams", value: "3" },
      { label: "Vehicles", value: "1" },
    ]);
  });

  it("leaves blocks without a BFF read model null (never fixtures)", async () => {
    const GET = vi.fn(async () => ({
      data: { serviceHealth: [], alerts: [] },
    }));
    const snap = await liveDashboardLoader(bff(GET), ["admin"], NOW);
    expect(snap.database).toBeNull();
    expect(snap.media).toBeNull();
    expect(snap.vehicleTelemetry).toBeNull();
    expect(snap.outbox).toBeNull();
    expect(snap.node.id).toBeNull();
  });

  it("folds alerts into the degraded notice, most severe first", () => {
    const notice = alertsToNotice([
      { code: "A", message: "minor", severity: "info" },
      { code: "B", message: "disk full", severity: "critical" },
    ]);
    expect(notice?.title).toMatch(/critical: B/i);
    expect(notice?.detail).toMatch(/disk full/);
    expect(notice?.detail).toMatch(/\+1 more/);
    expect(alertsToNotice([])).toBeUndefined();
  });

  it("maps unknown status strings to `unknown`, not to healthy", () => {
    expect(mapServiceState("ok")).toBe("healthy");
    expect(mapServiceState("WARNING")).toBe("degraded");
    expect(mapServiceState("offline")).toBe("down");
    expect(mapServiceState("banana")).toBe("unknown");
  });

  it("prefersAdminDashboard covers admin + techAdmin", () => {
    expect(prefersAdminDashboard(["techAdmin"])).toBe(true);
    expect(prefersAdminDashboard(["operator"])).toBe(false);
  });
});

const ADMIN: ConsoleSessionResult = {
  status: "authenticated",
  actor: {
    actorId: "a",
    actorType: "user",
    label: "Admin",
    roles: ["admin"],
    permissions: [],
  },
};

function renderDashboard(loader?: () => unknown) {
  return render(
    <SessionProvider loader={() => ADMIN}>
      <LocalNodeDashboard
        loader={loader as never}
      />
    </SessionProvider>,
  );
}

describe("LocalNodeDashboard rendering", () => {
  it("mock snapshot keeps rendering every populated widget", async () => {
    renderDashboard(() => consoleDashboardFor("normal"));
    await screen.findByRole("heading", { name: /local node dashboard/i });
    expect(
      screen.queryByText(/no data from backend/i),
    ).toBeNull();
  });

  it("live snapshot renders honest no-data tiles for absent blocks", async () => {
    const GET = vi.fn(async () => ({
      data: { serviceHealth: [], alerts: [] },
    }));
    renderDashboard(() => liveDashboardLoader(bff(GET), ["admin"], NOW));
    await screen.findByRole("heading", { name: /local node dashboard/i });
    const tiles = await screen.findAllByText(/no data from backend/i);
    // database, media, telemetry, outbox, node ops
    expect(tiles.length).toBeGreaterThanOrEqual(5);
    expect(
      screen.getAllByText(/not reported by backend/i).length,
    ).toBeGreaterThan(0);
  });

  it("401 renders the session error panel with a sign-in route", async () => {
    renderDashboard(() => {
      throw new ApiError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "expired",
        url: "/api/api-gateway-bff/v1/dashboard/admin",
      });
    });
    expect(
      await screen.findByRole("link", { name: /sign in/i }),
    ).toBeDefined();
  });

  it("degraded backend keeps the last snapshot under a degraded banner", async () => {
    let call = 0;
    const loader = () => {
      call += 1;
      if (call === 1) return consoleDashboardFor("normal");
      throw new ApiError({
        status: 503,
        code: "SERVICE_DEGRADED",
        message: "bff down",
        url: "/api/api-gateway-bff/v1/dashboard/admin",
      });
    };
    renderDashboard(loader);
    await screen.findByRole("heading", { name: /local node dashboard/i });

    // Trigger a reload that fails.
    screen.getByRole("button", { name: /refresh/i }).click();
    await waitFor(() => {
      expect(screen.getByText("degraded")).toBeDefined();
    });
    expect(screen.getByText(/last known snapshot/i)).toBeDefined();
    // The previous snapshot is still on screen.
    expect(
      screen.getByRole("heading", { name: /local node dashboard/i }),
    ).toBeDefined();
  });
});
