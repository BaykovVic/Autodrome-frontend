import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  CAMERA_DEVICE_STATE_LABELS,
  ENROLLMENT_STATE_LABELS,
  isRetriable,
  isTerminalEnrollmentState,
  liveEnrollmentLaunch,
  liveEnrollmentLaunchCancel,
  liveEnrollmentLaunchGet,
  liveEnrollmentLaunchRetry,
} from "@/app/(shell)/candidates/_components/liveBiometryEnrollmentLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("ENROLLMENT_STATE_LABELS", () => {
  it("covers all 9 canonical states with labels", () => {
    expect(ENROLLMENT_STATE_LABELS.ready).toBe("Ready");
    expect(ENROLLMENT_STATE_LABELS.command_sent).toBe("Command sent");
    expect(ENROLLMENT_STATE_LABELS.capturing).toBe("Capturing");
    expect(ENROLLMENT_STATE_LABELS.quality_failed).toMatch(
      /retry available/i,
    );
    expect(ENROLLMENT_STATE_LABELS.finalizing).toBe("Finalizing");
    expect(ENROLLMENT_STATE_LABELS.succeeded).toBe("Succeeded");
    expect(ENROLLMENT_STATE_LABELS.failed).toBe("Failed");
    expect(ENROLLMENT_STATE_LABELS.expired).toBe("Expired");
    expect(ENROLLMENT_STATE_LABELS.cancelled).toBe("Cancelled");
  });
});

describe("CAMERA_DEVICE_STATE_LABELS", () => {
  it("covers all canonical browser camera states", () => {
    expect(CAMERA_DEVICE_STATE_LABELS.ready).toBe("Camera ready");
    expect(CAMERA_DEVICE_STATE_LABELS.permission_pending).toMatch(
      /awaiting/i,
    );
    expect(CAMERA_DEVICE_STATE_LABELS.permission_denied).toMatch(
      /denied/i,
    );
    expect(CAMERA_DEVICE_STATE_LABELS.no_device).toMatch(
      /no camera detected/i,
    );
    expect(CAMERA_DEVICE_STATE_LABELS.device_in_use).toMatch(
      /busy/i,
    );
  });
});

describe("state classifiers", () => {
  it("isTerminalEnrollmentState matches all 4 terminal states", () => {
    expect(isTerminalEnrollmentState("succeeded")).toBe(true);
    expect(isTerminalEnrollmentState("failed")).toBe(true);
    expect(isTerminalEnrollmentState("expired")).toBe(true);
    expect(isTerminalEnrollmentState("cancelled")).toBe(true);
    expect(isTerminalEnrollmentState("capturing")).toBe(false);
    expect(isTerminalEnrollmentState("ready")).toBe(false);
  });

  it("isRetriable matches only quality_failed", () => {
    expect(isRetriable("quality_failed")).toBe(true);
    expect(isRetriable("failed")).toBe(false);
    expect(isRetriable("succeeded")).toBe(false);
  });
});

describe("liveEnrollmentLaunch", () => {
  it("dispatches POST with webCameraStation target + Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({
      data: {
        launchId: "70000000-0000-4000-8000-000000000001",
        candidateRef: { candidateId: "candidate-1" },
        target: {
          kind: "webCameraStation",
          stationId: "station-1",
        },
        state: "ready",
        retryCount: 0,
        createdAt: "2026-06-27T10:00:00Z",
        updatedAt: "2026-06-27T10:00:00Z",
        expiresAt: "2026-06-27T10:30:00Z",
      },
    }));
    const api = makeApi({
      biometry: { POST } as unknown as AutodromeApi["biometry"],
    });
    const v = await liveEnrollmentLaunch(
      api,
      "candidate-1",
      "station-1",
      "Иван Б.",
    );
    expect(POST).toHaveBeenCalledTimes(1);
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe("/biometry/enrollment-launches");
    const opts = call[1] as {
      body: {
        target: { kind: string; stationId: string };
        candidateRef: { candidateId: string };
        maskedCandidateFacts: { displayName: string };
      };
      params: { header: { "Idempotency-Key": string } };
    };
    expect(opts.body.target.kind).toBe("webCameraStation");
    expect(opts.body.target.stationId).toBe("station-1");
    expect(opts.body.candidateRef.candidateId).toBe("candidate-1");
    expect(opts.body.maskedCandidateFacts.displayName).toBe("Иван Б.");
    expect(opts.params.header["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(v.launchId).toBe(
      "70000000-0000-4000-8000-000000000001",
    );
    expect(v.stationId).toBe("station-1");
    expect(v.state).toBe("ready");
  });

  it("propagates ApiError when biometry rejects launch", async () => {
    const POST = vi.fn(async () => {
      throw new ApiError({
        status: 409,
        url: "/biometry/enrollment-launches",
        code: "ENROLLMENT_CHANNEL_BUSY",
        message: "Channel is busy with another launch.",
      });
    });
    const api = makeApi({
      biometry: { POST } as unknown as AutodromeApi["biometry"],
    });
    await expect(
      liveEnrollmentLaunch(api, "candidate-1", "station-1", "Иван Б."),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("liveEnrollmentLaunchGet", () => {
  it("polls GET /biometry/enrollment-launches/{launchId} and maps state", async () => {
    const GET = vi.fn(async () => ({
      data: {
        launchId: "70000000-0000-4000-8000-000000000001",
        candidateRef: { candidateId: "candidate-1" },
        target: { kind: "webCameraStation", stationId: "station-1" },
        state: "capturing",
        retryCount: 0,
        createdAt: "2026-06-27T10:00:00Z",
        updatedAt: "2026-06-27T10:05:00Z",
        expiresAt: "2026-06-27T10:30:00Z",
      },
    }));
    const api = makeApi({
      biometry: { GET } as unknown as AutodromeApi["biometry"],
    });
    const v = await liveEnrollmentLaunchGet(
      api,
      "70000000-0000-4000-8000-000000000001",
    );
    expect(GET).toHaveBeenCalledWith(
      "/biometry/enrollment-launches/{launchId}",
      {
        params: {
          path: {
            launchId: "70000000-0000-4000-8000-000000000001",
          },
        },
      },
    );
    expect(v.state).toBe("capturing");
    expect(v.stateLabel).toBe("Capturing");
  });
});

describe("liveEnrollmentLaunchCancel", () => {
  it("dispatches cancel with Idempotency-Key + reason body", async () => {
    const POST = vi.fn(async () => ({
      data: {
        launchId: "70000000-0000-4000-8000-000000000001",
        candidateRef: { candidateId: "candidate-1" },
        target: { kind: "webCameraStation", stationId: "station-1" },
        state: "cancelled",
        retryCount: 0,
        createdAt: "2026-06-27T10:00:00Z",
        updatedAt: "2026-06-27T10:10:00Z",
        expiresAt: "2026-06-27T10:30:00Z",
      },
    }));
    const api = makeApi({
      biometry: { POST } as unknown as AutodromeApi["biometry"],
    });
    const v = await liveEnrollmentLaunchCancel(
      api,
      "70000000-0000-4000-8000-000000000001",
      "Operator changed mind",
    );
    expect(POST).toHaveBeenCalledTimes(1);
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe(
      "/biometry/enrollment-launches/{launchId}/cancel",
    );
    const opts = call[1] as {
      body: { reason?: string };
      params: { header: { "Idempotency-Key": string } };
    };
    expect(opts.body.reason).toBe("Operator changed mind");
    expect(v.state).toBe("cancelled");
  });
});

describe("liveEnrollmentLaunchRetry", () => {
  it("dispatches retry with Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({
      data: {
        launchId: "70000000-0000-4000-8000-000000000001",
        candidateRef: { candidateId: "candidate-1" },
        target: { kind: "webCameraStation", stationId: "station-1" },
        state: "command_sent",
        retryCount: 1,
        createdAt: "2026-06-27T10:00:00Z",
        updatedAt: "2026-06-27T10:15:00Z",
        expiresAt: "2026-06-27T10:45:00Z",
      },
    }));
    const api = makeApi({
      biometry: { POST } as unknown as AutodromeApi["biometry"],
    });
    const v = await liveEnrollmentLaunchRetry(
      api,
      "70000000-0000-4000-8000-000000000001",
    );
    const call = POST.mock.calls[0] as unknown as [string, unknown];
    expect(call[0]).toBe(
      "/biometry/enrollment-launches/{launchId}/retry",
    );
    expect(v.retryCount).toBe(1);
    expect(v.state).toBe("command_sent");
  });
});
