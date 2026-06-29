import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/rpi-emulator",
}));

import type { AutodromeApi } from "@/api/adapter";
import { RpiEmulatorScreen } from "@/app/(shell)/rpi-emulator/_components/RpiEmulatorScreen";
import { consoleRpiEmulatorFor } from "@/app/(shell)/rpi-emulator/_components/consoleRpiEmulatorFixtures";
import {
  isPlaybackActionAllowed,
  isScenarioLoadAllowed,
  SIMULATOR_BRIDGE_LABELS,
  SIMULATOR_PHASE_LABELS,
  SIMULATOR_SCENARIO_FORMAT_LABELS,
} from "@/app/(shell)/rpi-emulator/_components/consoleRpiEmulator";
import {
  liveRpiEmulatorLoader,
  liveRpiPlaybackPause,
  liveRpiPlaybackResume,
  liveRpiPlaybackStart,
  liveRpiPlaybackStop,
  liveRpiScenarioLoad,
  mapSimulatorBridgeDto,
  mapSimulatorRuntimeDto,
} from "@/app/(shell)/rpi-emulator/_components/liveRpiEmulatorLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("SIMULATOR_PHASE_LABELS", () => {
  it("covers every canonical phase", () => {
    expect(SIMULATOR_PHASE_LABELS.idle).toBe("Idle");
    expect(SIMULATOR_PHASE_LABELS.loaded).toMatch(/loaded/i);
    expect(SIMULATOR_PHASE_LABELS.playing).toBe("Playing");
    expect(SIMULATOR_PHASE_LABELS.paused).toBe("Paused");
    expect(SIMULATOR_PHASE_LABELS.stopped).toBe("Stopped");
    expect(SIMULATOR_PHASE_LABELS.failed).toBe("Failed");
  });
});

describe("SIMULATOR_SCENARIO_FORMAT_LABELS", () => {
  it("covers both legacy formats", () => {
    expect(SIMULATOR_SCENARIO_FORMAT_LABELS.legacyLiteReplay).toMatch(
      /Lite/i,
    );
    expect(SIMULATOR_SCENARIO_FORMAT_LABELS.legacyFullTrajectory).toMatch(
      /Full/i,
    );
  });
});

describe("SIMULATOR_BRIDGE_LABELS", () => {
  it("covers every canonical bridge connection", () => {
    expect(SIMULATOR_BRIDGE_LABELS.connected).toBe("Connected");
    expect(SIMULATOR_BRIDGE_LABELS.connecting).toBe("Connecting");
    expect(SIMULATOR_BRIDGE_LABELS.degraded).toBe("Degraded");
    expect(SIMULATOR_BRIDGE_LABELS.disconnected).toBe("Disconnected");
  });
});

describe("isPlaybackActionAllowed", () => {
  it("start requires loaded or stopped", () => {
    expect(isPlaybackActionAllowed("loaded", "start")).toBe(true);
    expect(isPlaybackActionAllowed("stopped", "start")).toBe(true);
    expect(isPlaybackActionAllowed("playing", "start")).toBe(false);
    expect(isPlaybackActionAllowed("idle", "start")).toBe(false);
  });
  it("pause requires playing", () => {
    expect(isPlaybackActionAllowed("playing", "pause")).toBe(true);
    expect(isPlaybackActionAllowed("paused", "pause")).toBe(false);
  });
  it("resume requires paused", () => {
    expect(isPlaybackActionAllowed("paused", "resume")).toBe(true);
    expect(isPlaybackActionAllowed("playing", "resume")).toBe(false);
  });
  it("stop requires loaded/playing/paused", () => {
    expect(isPlaybackActionAllowed("playing", "stop")).toBe(true);
    expect(isPlaybackActionAllowed("paused", "stop")).toBe(true);
    expect(isPlaybackActionAllowed("loaded", "stop")).toBe(true);
    expect(isPlaybackActionAllowed("idle", "stop")).toBe(false);
    expect(isPlaybackActionAllowed("stopped", "stop")).toBe(false);
  });
});

describe("isScenarioLoadAllowed", () => {
  it("only allows scenario load when idle/stopped/failed", () => {
    expect(isScenarioLoadAllowed("idle")).toBe(true);
    expect(isScenarioLoadAllowed("stopped")).toBe(true);
    expect(isScenarioLoadAllowed("failed")).toBe(true);
    expect(isScenarioLoadAllowed("loaded")).toBe(false);
    expect(isScenarioLoadAllowed("playing")).toBe(false);
    expect(isScenarioLoadAllowed("paused")).toBe(false);
  });
});

describe("mapSimulatorRuntimeDto", () => {
  it("maps DTO with known phase + scenario format", () => {
    const v = mapSimulatorRuntimeDto({
      emulatorId: "EMU-1",
      phase: "playing",
      loadedScenarioId: "SC-1",
      loadedScenarioFormat: "legacyLiteReplay",
      playbackSessionId: "PB-1",
      observedAt: "2026-06-29T08:00:00Z",
    });
    expect(v.phase).toBe("playing");
    expect(v.phaseLabel).toBe("Playing");
    expect(v.loadedScenarioFormat).toBe("legacyLiteReplay");
    expect(v.loadedScenarioFormatLabel).toMatch(/Lite/i);
  });
  it("falls back to 'failed' phase + undefined format on unknown values", () => {
    const v = mapSimulatorRuntimeDto({
      emulatorId: "EMU-1",
      phase: "weirdState" as unknown as "playing",
      loadedScenarioFormat: "weirdFormat" as unknown as "legacyLiteReplay",
      observedAt: "2026-06-29T08:00:00Z",
    });
    expect(v.phase).toBe("failed");
    expect(v.loadedScenarioFormat).toBeUndefined();
  });
});

describe("mapSimulatorBridgeDto", () => {
  it("maps DTO with known connection", () => {
    const v = mapSimulatorBridgeDto({
      emulatorId: "EMU-1",
      connection: "degraded",
      reason: "hardware_bus_unreachable",
      observedAt: "2026-06-29T08:00:05Z",
    });
    expect(v.connection).toBe("degraded");
    expect(v.connectionLabel).toBe("Degraded");
    expect(v.reason).toBe("hardware_bus_unreachable");
  });
  it("falls back to 'disconnected' on unknown connection", () => {
    const v = mapSimulatorBridgeDto({
      emulatorId: "EMU-1",
      connection: "weird" as unknown as "connected",
      observedAt: "2026-06-29T08:00:05Z",
    });
    expect(v.connection).toBe("disconnected");
  });
});

describe("liveRpiEmulatorLoader", () => {
  it("returns a snapshot with both runtime + bridge mapped on success", async () => {
    const GET = vi.fn(async (path: string) => {
      if (path === "/simulator/status") {
        return {
          data: {
            emulatorId: "EMU-1",
            phase: "playing",
            playbackSessionId: "PB-1",
            observedAt: "2026-06-29T08:00:00Z",
          },
        };
      }
      return {
        data: {
          emulatorId: "EMU-1",
          connection: "connected",
          observedAt: "2026-06-29T08:00:05Z",
        },
      };
    });
    const api = makeApi({
      vehicleSimulatorRpi: {
        GET,
      } as unknown as AutodromeApi["vehicleSimulatorRpi"],
    });
    const snap = await liveRpiEmulatorLoader(api);
    expect(snap.runtime.phase).toBe("playing");
    expect(snap.bridge.connection).toBe("connected");
    expect(snap.runtimeError).toBeUndefined();
    expect(snap.bridgeError).toBeUndefined();
  });

  it("captures runtime error without breaking the bridge fetch (and vice-versa)", async () => {
    const GET = vi.fn(async (path: string) => {
      if (path === "/simulator/status") {
        throw new Error("simulator status 503");
      }
      return {
        data: {
          emulatorId: "EMU-1",
          connection: "connected",
          observedAt: "2026-06-29T08:00:05Z",
        },
      };
    });
    const api = makeApi({
      vehicleSimulatorRpi: {
        GET,
      } as unknown as AutodromeApi["vehicleSimulatorRpi"],
    });
    const snap = await liveRpiEmulatorLoader(api);
    expect(snap.runtimeError).toMatch(/503/);
    expect(snap.bridge.connection).toBe("connected");
  });

  it("captures empty-body errors with explicit messages", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      vehicleSimulatorRpi: {
        GET,
      } as unknown as AutodromeApi["vehicleSimulatorRpi"],
    });
    const snap = await liveRpiEmulatorLoader(api);
    expect(snap.runtimeError).toMatch(/no body/i);
    expect(snap.bridgeError).toMatch(/no body/i);
  });
});

describe("playback command dispatchers", () => {
  function makeRecordingApi(): {
    api: AutodromeApi;
    calls: Array<{ path: string; headerKey: string }>;
  } {
    const calls: Array<{ path: string; headerKey: string }> = [];
    const POST = vi.fn(async (path: string, opts: unknown) => {
      const o = opts as {
        params: { header: { "Idempotency-Key": string } };
      };
      calls.push({
        path,
        headerKey: o.params.header["Idempotency-Key"],
      });
      return { data: undefined };
    });
    return {
      api: {
        vehicleSimulatorRpi: {
          POST,
        } as unknown as AutodromeApi["vehicleSimulatorRpi"],
      } as AutodromeApi,
      calls,
    };
  }

  it("liveRpiPlaybackStart POSTs the canonical path with Idempotency-Key", async () => {
    const { api, calls } = makeRecordingApi();
    await liveRpiPlaybackStart(api);
    expect(calls[0].path).toBe("/simulator/playback/start");
    expect(calls[0].headerKey).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("liveRpiPlaybackPause POSTs the canonical path", async () => {
    const { api, calls } = makeRecordingApi();
    await liveRpiPlaybackPause(api);
    expect(calls[0].path).toBe("/simulator/playback/pause");
  });
  it("liveRpiPlaybackResume POSTs the canonical path", async () => {
    const { api, calls } = makeRecordingApi();
    await liveRpiPlaybackResume(api);
    expect(calls[0].path).toBe("/simulator/playback/resume");
  });
  it("liveRpiPlaybackStop POSTs the canonical path", async () => {
    const { api, calls } = makeRecordingApi();
    await liveRpiPlaybackStop(api);
    expect(calls[0].path).toBe("/simulator/playback/stop");
  });
  it("liveRpiScenarioLoad POSTs with body + Idempotency-Key", async () => {
    const calls: Array<{ path: string; body: unknown }> = [];
    const POST = vi.fn(async (path: string, opts: unknown) => {
      const o = opts as { body: unknown };
      calls.push({ path, body: o.body });
      return { data: undefined };
    });
    const api = makeApi({
      vehicleSimulatorRpi: {
        POST,
      } as unknown as AutodromeApi["vehicleSimulatorRpi"],
    });
    await liveRpiScenarioLoad(api, {
      scenarioId: "SC-1",
      format: "legacyLiteReplay",
    });
    expect(calls[0].path).toBe("/simulator/scenarios/load");
    expect(calls[0].body).toEqual({
      scenarioId: "SC-1",
      format: "legacyLiteReplay",
    });
  });
});

describe("RpiEmulatorScreen", () => {
  it("renders heading + RPi source chip + Runtime/Bridge cards", async () => {
    render(
      <RpiEmulatorScreen
        loader={() => consoleRpiEmulatorFor("playing")}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /RPi hardware emulator/i,
    });
    expect(
      screen.getByLabelText(
        /Vehicle source — RPi hardware emulator/i,
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("region", {
        name: /Emulator runtime status/i,
      }),
    ).toBeDefined();
    expect(
      screen.getByRole("region", {
        name: /Tablet\/web bridge status/i,
      }),
    ).toBeDefined();
  });

  it("disables Start/Pause/Resume/Stop based on phase", async () => {
    render(
      <RpiEmulatorScreen
        loader={() => consoleRpiEmulatorFor("idle")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const start = screen.getByRole("button", {
      name: /^start$/i,
    }) as HTMLButtonElement;
    const pause = screen.getByRole("button", {
      name: /^pause$/i,
    }) as HTMLButtonElement;
    const resume = screen.getByRole("button", {
      name: /^resume$/i,
    }) as HTMLButtonElement;
    const stop = screen.getByRole("button", {
      name: /^stop$/i,
    }) as HTMLButtonElement;
    // idle phase: nothing is actionable.
    expect(start.disabled).toBe(true);
    expect(pause.disabled).toBe(true);
    expect(resume.disabled).toBe(true);
    expect(stop.disabled).toBe(true);
  });

  it("Start click invokes the start command in live mode", async () => {
    const commands = {
      start: vi.fn(async () => {}),
      pause: vi.fn(async () => {}),
      resume: vi.fn(async () => {}),
      stop: vi.fn(async () => {}),
    };
    render(
      <RpiEmulatorScreen
        loader={() => consoleRpiEmulatorFor("loaded")}
        commands={commands}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    });
    expect(commands.start).toHaveBeenCalledTimes(1);
  });

  it("surfaces command rejection as inline alert", async () => {
    const commands = {
      start: vi.fn(async () => {
        throw new Error("backend 503");
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
    };
    render(
      <RpiEmulatorScreen
        loader={() => consoleRpiEmulatorFor("loaded")}
        commands={commands}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    });
    expect(screen.getByText(/backend 503/i)).toBeDefined();
  });

  it("bridge-degraded fixture renders the bridge reason for the operator", async () => {
    render(
      <RpiEmulatorScreen
        loader={() => consoleRpiEmulatorFor("bridge-degraded")}
      />,
    );
    await screen.findByRole("heading", { level: 1 });
    const bridge = screen.getByRole("region", {
      name: /Tablet\/web bridge status/i,
    });
    expect(within(bridge).getByText(/Degraded/i)).toBeDefined();
    expect(within(bridge).getByText(/tablet_unreachable/i)).toBeDefined();
  });

  it("renders Skeleton while loader is pending", () => {
    const pending = new Promise<never>(() => {});
    render(
      <RpiEmulatorScreen
        loader={() =>
          pending as unknown as ReturnType<typeof consoleRpiEmulatorFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading rpi emulator/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects fatally", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "RPI_LOADER_FAIL",
      status: 500,
    });
    render(
      <RpiEmulatorScreen loader={() => Promise.reject(error)} />,
    );
    expect(await screen.findByText(/loader failed/i)).toBeDefined();
  });
});
