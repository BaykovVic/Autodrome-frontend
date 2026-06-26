import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { AutodromeApi } from "@/api/adapter";
import {
  liveAuditEventsLoader,
  liveAuditExport,
  liveAuditVerify,
  mapAuditEventDtoToConsole,
  mapExportDtoToConsole,
  mapVerificationReportDtoToConsole,
} from "@/app/(shell)/audit/_components/liveAuditLoader";

function makeApi(partial: Partial<AutodromeApi>): AutodromeApi {
  return partial as AutodromeApi;
}

describe("mapAuditEventDtoToConsole", () => {
  it("maps canonical Event DTO with short hash", () => {
    const v = mapAuditEventDtoToConsole({
      eventId: "30000000-0000-4000-8000-000000000001",
      actor: { actorId: "actor-1", actorType: "user" },
      action: "operator.login",
      subject: "session/login",
      occurredAt: "2026-06-26T08:00:00Z",
      payloadHash: "a".repeat(60) + "z".repeat(4),
      sequence: 101,
      recordedAt: "2026-06-26T08:00:00Z",
    });
    expect(v.eventId).toBe("30000000-0000-4000-8000-000000000001");
    expect(v.payloadHashShort).toBe("aaaa…zzzz");
    expect(v.sequence).toBe(101);
  });
});

describe("mapVerificationReportDtoToConsole", () => {
  it("maps passed report", () => {
    const v = mapVerificationReportDtoToConsole({
      runId: "40000000-0000-4000-8000-000000000010",
      status: "passed",
      checkedBlocks: 7,
      ranAt: "2026-06-26T09:35:00Z",
    });
    expect(v.status).toBe("passed");
    expect(v.statusLabel).toBe("Passed");
    expect(v.checkedBlocks).toBe(7);
    expect(v.firstError).toBeUndefined();
  });

  it("maps failed report with first error", () => {
    const v = mapVerificationReportDtoToConsole({
      runId: "40000000-0000-4000-8000-000000000011",
      status: "failed",
      checkedBlocks: 4,
      firstErrorBlockId: "50000000-0000-4000-8000-000000000033",
      firstError: "blockHash mismatch at sequence 412",
      ranAt: "2026-06-26T09:35:00Z",
    });
    expect(v.status).toBe("failed");
    expect(v.firstError).toMatch(/blockHash mismatch/i);
  });
});

describe("mapExportDtoToConsole", () => {
  it("maps export DTO", () => {
    const v = mapExportDtoToConsole({
      exportId: "60000000-0000-4000-8000-000000000020",
      format: "csv",
      eventCount: 12,
      createdAt: "2026-06-26T09:30:00Z",
    });
    expect(v.format).toBe("csv");
    expect(v.formatLabel).toBe("CSV");
    expect(v.eventCount).toBe(12);
  });
});

describe("liveAuditEventsLoader: integration", () => {
  it("returns snapshot with latest sequence + degradedNote undefined on success", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          {
            eventId: "30000000-0000-4000-8000-000000000001",
            actor: { actorId: "actor-1", actorType: "user" },
            action: "operator.login",
            subject: "session/login",
            occurredAt: "2026-06-26T08:00:00Z",
            payloadHash: "abc",
            sequence: 99,
            recordedAt: "2026-06-26T08:00:00Z",
          },
          {
            eventId: "30000000-0000-4000-8000-000000000002",
            actor: { actorId: "actor-1", actorType: "user" },
            action: "candidate.enroll",
            subject: "candidate/CND-1",
            occurredAt: "2026-06-26T08:01:00Z",
            payloadHash: "def",
            sequence: 101,
            recordedAt: "2026-06-26T08:01:00Z",
          },
        ],
      },
    }));
    const api = makeApi({
      audit: { GET } as unknown as AutodromeApi["audit"],
    });
    const snap = await liveAuditEventsLoader(api);
    expect(GET).toHaveBeenCalledWith("/audit/events", {});
    expect(snap.totals.events).toBe(2);
    expect(snap.totals.latestSequence).toBe(101);
    expect(snap.degradedNote).toBeUndefined();
  });

  it("captures fetch error as degradedNote", async () => {
    const GET = vi.fn(async () => {
      throw new ApiError({
        status: 503,
        url: "/audit/events",
        code: "AUDIT_DEGRADED",
        message: "Audit service degraded.",
      });
    });
    const api = makeApi({
      audit: { GET } as unknown as AutodromeApi["audit"],
    });
    const snap = await liveAuditEventsLoader(api);
    expect(snap.events).toEqual([]);
    expect(snap.degradedNote).toMatch(/degraded/i);
  });
});

describe("liveAuditVerify + liveAuditExport: dispatch", () => {
  it("verify dispatches POST with Idempotency-Key + returns report", async () => {
    const POST = vi.fn(async () => ({
      data: {
        runId: "40000000-0000-4000-8000-000000000010",
        status: "passed",
        checkedBlocks: 5,
        ranAt: "2026-06-26T09:35:00Z",
      },
    }));
    const api = makeApi({
      audit: { POST } as unknown as AutodromeApi["audit"],
    });
    const v = await liveAuditVerify(api);
    expect(POST).toHaveBeenCalledTimes(1);
    const verifyCall = POST.mock.calls[0] as unknown as [string, unknown];
    expect(verifyCall[0]).toBe("/audit/verify");
    const verifyOpts = verifyCall[1] as {
      params: { header: { "Idempotency-Key": string } };
    };
    expect(verifyOpts.params.header["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(v.status).toBe("passed");
  });

  it("export dispatches POST with body + Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({
      data: {
        exportId: "60000000-0000-4000-8000-000000000020",
        format: "jsonl",
        eventCount: 4,
        createdAt: "2026-06-26T09:30:00Z",
      },
    }));
    const api = makeApi({
      audit: { POST } as unknown as AutodromeApi["audit"],
    });
    const v = await liveAuditExport(api, { format: "jsonl" });
    expect(POST).toHaveBeenCalledTimes(1);
    const exportCall = POST.mock.calls[0] as unknown as [string, unknown];
    expect(exportCall[0]).toBe("/audit/export");
    const exportOpts = exportCall[1] as { body: { format: string } };
    expect(exportOpts.body.format).toBe("jsonl");
    expect(v.eventCount).toBe(4);
  });
});
