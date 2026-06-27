import { describe, expect, it, vi } from "vitest";

import type { AutodromeApi } from "@/api/adapter";
import {
  liveInstallerLoader,
  liveOpsStartUpdate,
  mapInstallStateDtoToConsole,
  mapPrerequisiteDtoToConsole,
  mapUpdateJobDtoToConsole,
} from "@/app/(shell)/operations/_components/liveInstallerLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapPrerequisiteDtoToConsole", () => {
  it("maps healthy prerequisite", () => {
    expect(
      mapPrerequisiteDtoToConsole({ name: "postgres", status: "healthy" }),
    ).toEqual({ name: "postgres", status: "healthy", reason: undefined });
  });

  it("preserves reason on non-healthy prerequisite", () => {
    expect(
      mapPrerequisiteDtoToConsole({
        name: "objectStorage",
        status: "offline",
        reason: "Connection refused.",
      }),
    ).toEqual({
      name: "objectStorage",
      status: "offline",
      reason: "Connection refused.",
    });
  });
});

describe("mapInstallStateDtoToConsole", () => {
  it("maps a healthy installed state with prerequisites", () => {
    const v = mapInstallStateDtoToConsole({
      phase: "installed",
      version: "0.7.0",
      updatedAt: "2026-06-27T08:00:00Z",
      overallStatus: "healthy",
      prerequisites: [
        { name: "postgres", status: "healthy" },
        { name: "objectStorage", status: "healthy" },
      ],
      degradedReasons: [],
      checkedAt: "2026-06-27T08:00:00Z",
    });
    expect(v.phase).toBe("installed");
    expect(v.phaseLabel).toBe("Installed");
    expect(v.overallStatus).toBe("healthy");
    expect(v.prerequisites).toHaveLength(2);
    expect(v.lastUpdateJob).toBeNull();
  });

  it("maps a degraded state with reasons", () => {
    const v = mapInstallStateDtoToConsole({
      phase: "installed",
      version: "0.7.0",
      overallStatus: "degraded",
      degradedReasons: ["Object storage low free space."],
      checkedAt: "2026-06-27T08:00:00Z",
    });
    expect(v.overallStatus).toBe("degraded");
    expect(v.degradedReasons).toEqual([
      "Object storage low free space.",
    ]);
  });

  it("falls back overallStatus to unknown when absent", () => {
    const v = mapInstallStateDtoToConsole({
      phase: "not_installed",
      version: "—",
      checkedAt: "2026-06-27T08:00:00Z",
    });
    expect(v.overallStatus).toBe("unknown");
    expect(v.overallStatusLabel).toBe("Unknown");
  });
});

describe("mapUpdateJobDtoToConsole", () => {
  it("maps update job with status label", () => {
    const v = mapUpdateJobDtoToConsole({
      jobId: "11111111-1111-1111-1111-111111111111",
      packageId: "22222222-2222-2222-2222-222222222222",
      version: "0.8.0",
      status: "pending",
      startedAt: "2026-06-27T09:00:00Z",
    });
    expect(v.status).toBe("pending");
    expect(v.statusLabel).toBe("Pending");
    expect(v.version).toBe("0.8.0");
  });
});

describe("liveInstallerLoader: integration", () => {
  it("calls GET /ops/install/state and maps response", async () => {
    const GET = vi.fn(async () => ({
      data: {
        phase: "installed",
        version: "0.7.0",
        overallStatus: "healthy",
        prerequisites: [{ name: "postgres", status: "healthy" }],
        checkedAt: "2026-06-27T08:00:00Z",
      },
    }));
    const api = makeApi({
      deploymentOperations: {
        GET,
      } as unknown as AutodromeApi["deploymentOperations"],
    });
    const v = await liveInstallerLoader(api);
    expect(GET).toHaveBeenCalledWith("/ops/install/state", {});
    expect(v.phase).toBe("installed");
  });
});

describe("liveOpsStartUpdate: dispatch", () => {
  it("dispatches POST /ops/update with Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({
      data: {
        jobId: "11111111-1111-1111-1111-111111111111",
        packageId: "22222222-2222-2222-2222-222222222222",
        version: "0.8.0",
        status: "pending",
        startedAt: "2026-06-27T09:00:00Z",
      },
    }));
    const api = makeApi({
      deploymentOperations: {
        POST,
      } as unknown as AutodromeApi["deploymentOperations"],
    });
    const v = await liveOpsStartUpdate(api, {
      packageId: "22222222-2222-2222-2222-222222222222",
      version: "0.8.0",
      checksum: "abc",
    });
    expect(POST).toHaveBeenCalledTimes(1);
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe("/ops/update");
    const opts = call[1] as {
      body: { version: string };
      params: { header: { "Idempotency-Key": string } };
    };
    expect(opts.body.version).toBe("0.8.0");
    expect(opts.params.header["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(v.jobId).toBe("11111111-1111-1111-1111-111111111111");
  });
});
