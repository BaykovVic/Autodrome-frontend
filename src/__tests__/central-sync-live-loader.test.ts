import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  liveCentralSyncExport,
  liveCentralSyncLoader,
  liveCentralSyncRun,
  mapSyncJobDtoToConsole,
  mapSyncPackageDtoToConsole,
  mapSyncStatusDtoToConsole,
} from "@/app/(shell)/central-sync/_components/liveCentralSyncLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapSyncStatusDtoToConsole", () => {
  it("maps enabled status with valid license", () => {
    const v = mapSyncStatusDtoToConsole({
      enabled: true,
      pendingItems: 5,
      lastSuccessAt: "2026-06-27T07:00:00Z",
      license: {
        status: "valid",
        expiresAt: "2026-12-31T23:59:59Z",
      },
    });
    expect(v.enabled).toBe(true);
    expect(v.pendingItems).toBe(5);
    expect(v.licenseStatus).toBe("valid");
    expect(v.licenseStatusLabel).toBe("Valid");
  });

  it("falls back license status to unknown when license cache absent", () => {
    const v = mapSyncStatusDtoToConsole({
      enabled: false,
      pendingItems: 0,
    });
    expect(v.licenseStatus).toBe("unknown");
    expect(v.lastSuccessAt).toBe("—");
  });

  it("preserves lastError when central unreachable", () => {
    const v = mapSyncStatusDtoToConsole({
      enabled: true,
      pendingItems: 47,
      lastError: "Central unreachable.",
    });
    expect(v.lastError).toBe("Central unreachable.");
  });
});

describe("mapSyncJobDtoToConsole", () => {
  it("maps running job with scope", () => {
    const v = mapSyncJobDtoToConsole({
      jobId: "11111111-1111-1111-1111-111111111111",
      status: "running",
      scope: ["read_models", "analytics"],
      pendingItems: 3,
      startedAt: "2026-06-27T08:00:00Z",
    });
    expect(v.status).toBe("running");
    expect(v.statusLabel).toBe("Running");
    expect(v.scope).toEqual(["read_models", "analytics"]);
  });
});

describe("mapSyncPackageDtoToConsole", () => {
  it("maps package with short checksum", () => {
    const v = mapSyncPackageDtoToConsole({
      packageId: "70000000-0000-4000-8000-000000000001",
      type: "read_models",
      schemaVersion: 3,
      checksum: "a".repeat(60) + "z".repeat(4),
      createdAt: "2026-06-27T07:30:00Z",
    });
    expect(v.type).toBe("read_models");
    expect(v.typeLabel).toBe("Read models");
    expect(v.checksumShort).toBe("aaaa…zzzz");
  });
});

describe("liveCentralSyncLoader: offline-tolerant", () => {
  it("returns snapshot with status on successful GET /sync/status", async () => {
    const GET = vi.fn(async () => ({
      data: {
        enabled: true,
        pendingItems: 12,
        lastSuccessAt: "2026-06-27T07:00:00Z",
        license: { status: "valid" },
      },
    }));
    const api = makeApi({
      centralSync: { GET } as unknown as AutodromeApi["centralSync"],
    });
    const snap = await liveCentralSyncLoader(api);
    expect(GET).toHaveBeenCalledWith("/sync/status", {});
    expect(snap.status.enabled).toBe(true);
    expect(snap.degradedNote).toBeUndefined();
  });

  it("falls back gracefully to degraded snapshot on central unavailable (offline-first)", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 503,
        url: "/sync/status",
        code: "SYNC_CENTRAL_UNAVAILABLE",
        message: "Central contour unavailable; local node continues.",
      });
    });
    const api = makeApi({
      centralSync: { GET } as unknown as AutodromeApi["centralSync"],
    });
    const snap = await liveCentralSyncLoader(api);
    expect(snap.status.enabled).toBe(false);
    expect(snap.degradedNote).toMatch(/central contour/i);
  });
});

describe("liveCentralSyncRun + liveCentralSyncExport", () => {
  it("run dispatches POST with Idempotency-Key + scope", async () => {
    const POST = vi.fn(async () => ({
      data: {
        jobId: "11111111-1111-1111-1111-111111111111",
        status: "pending",
        scope: ["read_models"],
        startedAt: "2026-06-27T08:00:00Z",
      },
    }));
    const api = makeApi({
      centralSync: { POST } as unknown as AutodromeApi["centralSync"],
    });
    const v = await liveCentralSyncRun(api, { scope: ["read_models"] });
    expect(POST).toHaveBeenCalledTimes(1);
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe("/sync/run");
    const opts = call[1] as {
      body: { scope: string[] };
      params: { header: { "Idempotency-Key": string } };
    };
    expect(opts.body.scope).toEqual(["read_models"]);
    expect(opts.params.header["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(v.status).toBe("pending");
  });

  it("export dispatches POST /sync/packages/export with body", async () => {
    const POST = vi.fn(async () => ({
      data: {
        packageId: "70000000-0000-4000-8000-000000000001",
        type: "audit",
        schemaVersion: 1,
        checksum: "abc",
        createdAt: "2026-06-27T07:35:00Z",
      },
    }));
    const api = makeApi({
      centralSync: { POST } as unknown as AutodromeApi["centralSync"],
    });
    const v = await liveCentralSyncExport(api, {
      type: "audit",
      dryRun: false,
    });
    expect(POST).toHaveBeenCalledTimes(1);
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe("/sync/packages/export");
    const opts = call[1] as { body: { type: string } };
    expect(opts.body.type).toBe("audit");
    expect(v.typeLabel).toBe("Audit");
  });
});
