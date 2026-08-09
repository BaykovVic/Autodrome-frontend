import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/traffic-control",
}));

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";
import { SchedulingScreen } from "@/app/(shell)/scheduling-integration/_components/SchedulingScreen";
import { consoleSchedulingFor } from "@/app/(shell)/scheduling-integration/_components/consoleSchedulingFixtures";
import { liveSchedulingLoader } from "@/app/(shell)/scheduling-integration/_components/liveSchedulingLoader";
import { TrafficControlScreen } from "@/app/(shell)/traffic-control/_components/TrafficControlScreen";
import { consoleTrafficFor } from "@/app/(shell)/traffic-control/_components/consoleTrafficFixtures";
import { liveTrafficLoader } from "@/app/(shell)/traffic-control/_components/liveTrafficControl";

function apiError(status: number, code: string, url: string): ApiError {
  return new ApiError({ status, code, message: code, url });
}

const FORBIDDEN = () => apiError(403, "FORBIDDEN", "/api/x");
const DEGRADED = () => apiError(503, "SERVICE_DEGRADED", "/api/x");

function schedulingAdapter(GET: unknown): AutodromeApi {
  return { schedulingIntegration: { GET } } as unknown as AutodromeApi;
}

function trafficAdapter(GET: unknown): AutodromeApi {
  return { trafficControl: { GET } } as unknown as AutodromeApi;
}

function session(permissions: string[]): ConsoleSessionResult {
  return {
    status: "authenticated",
    actor: {
      actorId: "a",
      actorType: "user",
      label: "Operator",
      roles: ["operator"],
      permissions,
    },
  };
}

describe("liveSchedulingLoader", () => {
  it("reads /schedules and /integrations/status and maps both", async () => {
    const GET = vi.fn(async (path: string) =>
      path === "/schedules"
        ? {
            data: {
              items: [
                {
                  scheduleId: "s1",
                  source: "legacy",
                  scheduleDate: "2026-08-09",
                  candidates: ["c1", "c2"],
                  exams: ["e1"],
                  externalRefs: [],
                },
              ],
            },
          }
        : {
            data: {
              items: [
                {
                  integrationId: "i1",
                  system: "gibdd",
                  status: "failed",
                  attempts: 3,
                  lastError: "timeout",
                  updatedAt: "2026-08-08T10:00:00Z",
                },
              ],
            },
          },
    );
    const snap = await liveSchedulingLoader(schedulingAdapter(GET));
    expect(snap.schedules[0].candidateRef).toBe("c1, c2");
    expect(snap.schedules[0].startsAt).toBe("2026-08-09");
    // Schedule lifecycle status is not in the contract.
    expect(snap.schedules[0].status).toBeNull();
    expect(snap.integrations[0].status).toBe("failed");
    expect(snap.integrations[0].lastError).toBe("timeout");
    // `attempts` is not a pending-item count.
    expect(snap.integrations[0].pendingItems).toBeNull();
  });

  it("maps pending/retrying import states to degraded", async () => {
    const GET = vi.fn(async (path: string) =>
      path === "/schedules"
        ? { data: { items: [] } }
        : {
            data: {
              items: [
                { integrationId: "i1", status: "retrying", attempts: 1 },
                { integrationId: "i2", status: "succeeded", attempts: 1 },
              ],
            },
          },
    );
    const snap = await liveSchedulingLoader(schedulingAdapter(GET));
    expect(snap.integrations.map((i) => i.status)).toEqual([
      "degraded",
      "ok",
    ]);
  });
});

describe("liveTrafficLoader", () => {
  it("reads GET /traffic and maps controllers + lights", async () => {
    const GET = vi.fn(async () => ({
      data: {
        controllers: [
          {
            controllerId: "ctrl-1",
            status: "healthy",
            address: "10.0.0.5",
            capabilities: ["setProgram"],
          },
        ],
        lights: [
          {
            lightId: "l1",
            controllerId: "ctrl-1",
            positionRef: "gate-1",
            state: "green",
          },
        ],
      },
    }));
    const snap = await liveTrafficLoader(trafficAdapter(GET));
    expect(GET).toHaveBeenCalledWith("/traffic", {});
    expect(snap.controllers[0].statusLabel).toBe("Healthy");
    expect(snap.lights[0].state).toBe("green");
    // No command history in the read model — not invented.
    expect(snap.recentCommands).toEqual([]);
  });
});

describe("SchedulingScreen", () => {
  it("mock path renders fixture tables unchanged", async () => {
    render(<SchedulingScreen loader={() => consoleSchedulingFor("normal")} />);
    expect(
      await screen.findByRole("table", { name: /schedule list/i }),
    ).toBeDefined();
  });

  it("live path renders backend rows", async () => {
    const GET = vi.fn(async (path: string) =>
      path === "/schedules"
        ? {
            data: {
              items: [
                {
                  scheduleId: "sch-77",
                  source: "legacy",
                  candidates: [],
                  exams: [],
                  externalRefs: [],
                  createdAt: "2026-08-01T09:00:00Z",
                },
              ],
            },
          }
        : { data: { items: [] } },
    );
    render(
      <SchedulingScreen
        loader={() => liveSchedulingLoader(schedulingAdapter(GET))}
      />,
    );
    expect(await screen.findByText("sch-77")).toBeDefined();
  });

  it("empty backend result renders without inventing rows", async () => {
    render(
      <SchedulingScreen
        loader={() => ({ schedules: [], integrations: [] })}
      />,
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /scheduling & integration/i,
      }),
    ).toBeDefined();
    expect(screen.queryByText("sch-77")).toBeNull();
  });

  it("403 renders a forbidden panel", async () => {
    render(
      <SchedulingScreen
        loader={() => {
          throw FORBIDDEN();
        }}
      />,
    );
    expect(
      await screen.findByLabelText(/error category forbidden/i),
    ).toBeDefined();
  });

  it("degraded backend renders the classified error", async () => {
    render(
      <SchedulingScreen
        loader={() => {
          throw DEGRADED();
        }}
      />,
    );
    expect(
      await screen.findByLabelText(/error category degraded/i),
    ).toBeDefined();
  });
});

function renderTraffic(
  permissions: string[],
  extra: Record<string, unknown> = {},
) {
  return render(
    <SessionProvider loader={() => session(permissions)}>
      <TrafficControlScreen
        loader={() => consoleTrafficFor("normal")}
        {...extra}
      />
    </SessionProvider>,
  );
}

describe("TrafficControlScreen command gating", () => {
  it("without traffic.manage the command controls are disabled with a reason", async () => {
    renderTraffic(["exam.read"]);
    const buttons = (await screen.findAllByRole("button", {
      name: /^setProgram$/i,
    })) as HTMLButtonElement[];
    expect(buttons.every((b) => b.disabled)).toBe(true);
    expect(
      screen.getAllByText(/requires traffic\.manage/i).length,
    ).toBeGreaterThan(0);
  });

  it("with traffic.manage the command is sent and the backend acceptance recorded", async () => {
    const sender = vi.fn(async (controllerId: string, commandType: string) => ({
      commandId: "srv-cmd-1",
      controllerId,
      commandType: commandType as never,
      acceptedAt: "2026-08-08T10:00:00Z",
    }));
    renderTraffic(["traffic.manage"], { commandSender: sender });
    const buttons = await screen.findAllByRole("button", {
      name: /^setProgram$/i,
    });
    const enabled = (buttons as HTMLButtonElement[]).find((b) => !b.disabled);
    fireEvent.click(enabled!);
    // The recorded entry carries the backend-returned acceptance time.
    expect(await screen.findByText("2026-08-08T10:00:00Z")).toBeDefined();
    expect(sender).toHaveBeenCalledTimes(1);
  });

  it("a rejected command (403) surfaces instead of a fake acceptance", async () => {
    const sender = vi.fn(async () => {
      throw FORBIDDEN();
    });
    renderTraffic(["traffic.manage"], { commandSender: sender });
    const buttons = await screen.findAllByRole("button", {
      name: /^setProgram$/i,
    });
    const enabled = (buttons as HTMLButtonElement[]).find((b) => !b.disabled);
    fireEvent.click(enabled!);
    expect(
      await screen.findByLabelText(/error category forbidden/i),
    ).toBeDefined();
  });

  it("live read failure renders the classified error, not an empty screen", async () => {
    render(
      <SessionProvider loader={() => session(["traffic.manage"])}>
        <TrafficControlScreen
          loader={() => {
            throw DEGRADED();
          }}
        />
      </SessionProvider>,
    );
    expect(
      await screen.findByLabelText(/error category degraded/i),
    ).toBeDefined();
  });

  it("live path renders backend controllers", async () => {
    const GET = vi.fn(async () => ({
      data: {
        controllers: [
          {
            controllerId: "ctrl-live",
            status: "degraded",
            address: "10.0.0.9",
            capabilities: [],
          },
        ],
        lights: [],
      },
    }));
    render(
      <SessionProvider loader={() => session(["traffic.manage"])}>
        <TrafficControlScreen
          loader={() => liveTrafficLoader(trafficAdapter(GET))}
        />
      </SessionProvider>,
    );
    expect(await screen.findByText("ctrl-live")).toBeDefined();
  });
});
