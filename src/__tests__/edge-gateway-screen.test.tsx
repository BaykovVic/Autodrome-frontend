import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/edge-gateway",
}));

import type { AutodromeApi } from "@/api/adapter";
import { EdgeGatewayScreen } from "@/app/(shell)/edge-gateway/_components/EdgeGatewayScreen";
import { consoleEdgeGatewayFor } from "@/app/(shell)/edge-gateway/_components/consoleEdgeGatewayFixtures";
import {
  deriveEdgeGatewayHealth,
  deriveForwardGap,
  deriveUpstreamHeartbeatGap,
  EDGE_GATEWAY_GAP_LABELS,
  EDGE_GATEWAY_HEALTH_LABELS,
  EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS,
  GATEWAY_PHASE_LABELS,
} from "@/app/(shell)/edge-gateway/_components/consoleEdgeGateway";
import {
  liveEdgeGatewayLoader,
  mapEdgeRuntimeStatusDto,
} from "@/app/(shell)/edge-gateway/_components/liveEdgeGatewayLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("GATEWAY_PHASE_LABELS", () => {
  it("covers every canonical phase", () => {
    expect(GATEWAY_PHASE_LABELS.bootstrapping).toMatch(/bootstrap/i);
    expect(GATEWAY_PHASE_LABELS.forwarding).toBe("Forwarding");
    expect(GATEWAY_PHASE_LABELS.paused).toBe("Paused");
    expect(GATEWAY_PHASE_LABELS.failed).toBe("Failed");
  });
});

describe("EDGE_GATEWAY_HEALTH_LABELS", () => {
  it("covers every health bucket", () => {
    expect(EDGE_GATEWAY_HEALTH_LABELS.ok).toMatch(/healthy/i);
    expect(EDGE_GATEWAY_HEALTH_LABELS.queueBacklog).toMatch(/backlog/i);
    expect(EDGE_GATEWAY_HEALTH_LABELS.upstreamUnreachable).toMatch(
      /upstream/i,
    );
    expect(EDGE_GATEWAY_HEALTH_LABELS.disconnected).toMatch(
      /disconnected/i,
    );
    expect(EDGE_GATEWAY_HEALTH_LABELS.failed).toMatch(/failed/i);
  });
});

describe("EDGE_GATEWAY_GAP_LABELS", () => {
  it("covers every forward-gap bucket", () => {
    expect(EDGE_GATEWAY_GAP_LABELS.fresh).toMatch(/30/);
    expect(EDGE_GATEWAY_GAP_LABELS.stale).toMatch(/30/);
    expect(EDGE_GATEWAY_GAP_LABELS.noForwardYet).toMatch(/no forward/i);
  });
});

describe("EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS", () => {
  it("covers every upstream-heartbeat-gap bucket", () => {
    expect(EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS.fresh).toMatch(/30/);
    expect(EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS.stale).toMatch(/30/);
    expect(EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS.noHeartbeatYet).toMatch(
      /no upstream heartbeat/i,
    );
    expect(EDGE_UPSTREAM_HEARTBEAT_GAP_LABELS.unreachable).toMatch(
      /unreachable/i,
    );
  });
});

describe("deriveUpstreamHeartbeatGap", () => {
  const now = new Date("2026-06-29T08:00:00Z");
  it("returns 'noHeartbeatYet' when upstream is undefined", () => {
    const snap = consoleEdgeGatewayFor("failed");
    snap.upstream = undefined;
    expect(deriveUpstreamHeartbeatGap(snap, now)).toBe(
      "noHeartbeatYet",
    );
  });
  it("returns 'unreachable' when upstream.reachable=false", () => {
    expect(
      deriveUpstreamHeartbeatGap(
        consoleEdgeGatewayFor("upstream-unreachable"),
        now,
      ),
    ).toBe("unreachable");
  });
  it("returns 'noHeartbeatYet' when reachable but lastHeartbeatAt missing", () => {
    expect(
      deriveUpstreamHeartbeatGap(
        consoleEdgeGatewayFor("bootstrapping"),
        now,
      ),
    ).toBe("noHeartbeatYet");
  });
  it("returns 'fresh' when heartbeat is within 30 s", () => {
    expect(
      deriveUpstreamHeartbeatGap(
        consoleEdgeGatewayFor("forwarding"),
        new Date("2026-06-29T08:00:10Z"),
      ),
    ).toBe("fresh");
  });
  it("returns 'stale' when heartbeat is older than 30 s", () => {
    expect(
      deriveUpstreamHeartbeatGap(
        consoleEdgeGatewayFor("forwarding"),
        new Date("2026-06-29T08:05:00Z"),
      ),
    ).toBe("stale");
  });
});

describe("deriveEdgeGatewayHealth", () => {
  it("returns 'disconnected' when statusError is present", () => {
    expect(
      deriveEdgeGatewayHealth(consoleEdgeGatewayFor("disconnected")),
    ).toBe("disconnected");
  });
  it("returns 'failed' on phase=failed without statusError", () => {
    expect(
      deriveEdgeGatewayHealth(consoleEdgeGatewayFor("failed")),
    ).toBe("failed");
  });
  it("returns 'upstreamUnreachable' when upstream.reachable=false", () => {
    expect(
      deriveEdgeGatewayHealth(
        consoleEdgeGatewayFor("upstream-unreachable"),
      ),
    ).toBe("upstreamUnreachable");
  });
  it("returns 'queueBacklog' when pendingBatches > 0 and upstream is fine", () => {
    expect(
      deriveEdgeGatewayHealth(consoleEdgeGatewayFor("queue-backlog")),
    ).toBe("queueBacklog");
  });
  it("returns 'ok' for clean forwarding state", () => {
    expect(
      deriveEdgeGatewayHealth(consoleEdgeGatewayFor("forwarding")),
    ).toBe("ok");
  });
});

describe("deriveForwardGap", () => {
  it("returns 'noForwardYet' when lastForwardedAt is undefined", () => {
    expect(
      deriveForwardGap(
        consoleEdgeGatewayFor("failed"),
        new Date("2026-06-29T08:00:00Z"),
      ),
    ).toBe("noForwardYet");
  });
  it("returns 'fresh' when last forward is within 30 s", () => {
    expect(
      deriveForwardGap(
        consoleEdgeGatewayFor("forwarding"),
        new Date("2026-06-29T08:00:10Z"),
      ),
    ).toBe("fresh");
  });
  it("returns 'stale' when last forward is older than 30 s", () => {
    expect(
      deriveForwardGap(
        consoleEdgeGatewayFor("forwarding"),
        new Date("2026-06-29T08:05:00Z"),
      ),
    ).toBe("stale");
  });
});

describe("mapEdgeRuntimeStatusDto", () => {
  it("maps a known DTO with parser + queue + upstream", () => {
    const v = mapEdgeRuntimeStatusDto({
      gatewayId: "GW-1",
      phase: "forwarding",
      observedAt: "2026-06-29T08:00:00Z",
      parser: { name: "lite-line-parser", version: "1.4.0" },
      queue: {
        pendingBatches: 2,
        lastForwardedAt: "2026-06-29T07:59:50Z",
        lastForwardedBatchId: "BAT-1",
      },
      upstream: {
        reachable: true,
        lastHeartbeatAt: "2026-06-29T07:59:55Z",
      },
    });
    expect(v.phase).toBe("forwarding");
    expect(v.phaseLabel).toBe("Forwarding");
    expect(v.parser.name).toBe("lite-line-parser");
    expect(v.queue.pendingBatches).toBe(2);
    expect(v.upstream?.reachable).toBe(true);
  });
  it("falls back to 'failed' phase on unknown DTO phase", () => {
    const v = mapEdgeRuntimeStatusDto({
      gatewayId: "GW-1",
      phase: "weird" as unknown as "forwarding",
      observedAt: "2026-06-29T08:00:00Z",
      parser: { name: "x" },
      queue: { pendingBatches: 0 },
    });
    expect(v.phase).toBe("failed");
    expect(v.upstream).toBeUndefined();
  });
});

describe("liveEdgeGatewayLoader", () => {
  it("returns a mapped snapshot on 200", async () => {
    const GET = vi.fn(async () => ({
      data: {
        gatewayId: "GW-1",
        phase: "forwarding",
        observedAt: "2026-06-29T08:00:00Z",
        parser: { name: "lite-line-parser", version: "1.4.0" },
        queue: { pendingBatches: 0 },
        upstream: { reachable: true },
      },
    }));
    const api = makeApi({
      vehicleEdgeGateway: {
        GET,
      } as unknown as AutodromeApi["vehicleEdgeGateway"],
    });
    const snap = await liveEdgeGatewayLoader(api);
    expect(snap.statusError).toBeUndefined();
    expect(snap.phase).toBe("forwarding");
  });

  it("captures fetch error in statusError without throwing", async () => {
    const GET = vi.fn(async () => {
      throw new Error("edge 503");
    });
    const api = makeApi({
      vehicleEdgeGateway: {
        GET,
      } as unknown as AutodromeApi["vehicleEdgeGateway"],
    });
    const snap = await liveEdgeGatewayLoader(api);
    expect(snap.statusError).toMatch(/503/);
    expect(snap.phase).toBe("failed");
  });

  it("captures empty-body errors with explicit messages", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      vehicleEdgeGateway: {
        GET,
      } as unknown as AutodromeApi["vehicleEdgeGateway"],
    });
    const snap = await liveEdgeGatewayLoader(api);
    expect(snap.statusError).toMatch(/no body/i);
  });
});

describe("EdgeGatewayScreen", () => {
  it("renders heading + canonical realHardwareEdge source chip + runtime + queue cards", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("forwarding")}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /vehicle edge gateway/i,
    });
    expect(
      screen.getByLabelText(
        /Vehicle source — real hardware edge gateway/i,
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("region", { name: /gateway runtime status/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("region", { name: /forward queue status/i }),
    ).toBeDefined();
  });

  it("disconnected fixture renders the gateway-disconnected banner", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("disconnected")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const banner = screen.getByLabelText(
      /Edge gateway integration health/i,
    );
    expect(within(banner).getByText(/disconnected/i)).toBeDefined();
    expect(within(banner).getByText(/edge gateway 503/i)).toBeDefined();
  });

  it("queue-backlog fixture surfaces 'queue backlog' health", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("queue-backlog")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const banner = screen.getByLabelText(
      /Edge gateway integration health/i,
    );
    expect(within(banner).getByText(/backlog/i)).toBeDefined();
  });

  it("upstream-unreachable fixture surfaces 'upstream unreachable'", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("upstream-unreachable")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const banner = screen.getByLabelText(
      /Edge gateway integration health/i,
    );
    expect(within(banner).getByText(/upstream/i)).toBeDefined();
  });

  it("renders the Forward queue gap badge wired to deriveForwardGap (fresh)", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("forwarding")}
        nowProvider={() => new Date("2026-06-29T08:00:10Z")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const gap = screen.getByLabelText(/Forward queue gap/i);
    expect(within(gap).getByText(/30 s ago/i)).toBeDefined();
  });

  it("renders the Forward queue gap badge as 'no forward' when lastForwardedAt is absent", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("failed")}
        nowProvider={() => new Date("2026-06-29T08:00:00Z")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const gap = screen.getByLabelText(/Forward queue gap/i);
    expect(within(gap).getByText(/no forward/i)).toBeDefined();
  });

  it("renders the Upstream heartbeat gap badge wired to deriveUpstreamHeartbeatGap (unreachable)", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("upstream-unreachable")}
        nowProvider={() => new Date("2026-06-29T08:00:00Z")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const gap = screen.getByLabelText(/Upstream heartbeat gap/i);
    expect(within(gap).getByText(/unreachable/i)).toBeDefined();
  });

  it("renders the Upstream heartbeat gap badge as 'fresh' for healthy fixture", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("forwarding")}
        nowProvider={() => new Date("2026-06-29T08:00:10Z")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const gap = screen.getByLabelText(/Upstream heartbeat gap/i);
    expect(within(gap).getByText(/< 30 s/i)).toBeDefined();
  });

  it("renders the Forward queue gap badge as 'stale' for outdated fixture", async () => {
    render(
      <EdgeGatewayScreen
        loader={() => consoleEdgeGatewayFor("forwarding")}
        nowProvider={() => new Date("2026-06-29T09:00:00Z")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const gap = screen.getByLabelText(/Forward queue gap/i);
    expect(within(gap).getByText(/> 30 s/i)).toBeDefined();
  });

  it("renders Skeleton while loader is pending", () => {
    const pending = new Promise<never>(() => {});
    render(
      <EdgeGatewayScreen
        loader={() =>
          pending as unknown as ReturnType<typeof consoleEdgeGatewayFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading edge gateway/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects fatally", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "EDGE_LOADER_FAIL",
      status: 500,
    });
    render(
      <EdgeGatewayScreen loader={() => Promise.reject(error)} />,
    );
    expect(await screen.findByText(/loader failed/i)).toBeDefined();
  });
});
