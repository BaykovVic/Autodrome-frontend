import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  liveViolationCreate,
  liveViolationGet,
  liveViolationsLoader,
  mapViolationDtoToConsole,
  mapViolationSeverity,
} from "@/app/(shell)/violations/_components/liveViolationsLoader";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/violation-rule";

type ViolationDto = components["schemas"]["Violation"];

function makeViolation(over: Partial<ViolationDto> = {}): ViolationDto {
  return {
    violationId: "00000000-0000-0000-0000-0000000000c1",
    code: "VIOL-001",
    title: "Speeding in parking",
    severity: "high",
    activeRuleVersion: { ruleId: "rule-1", ruleVersion: 2 },
    createdAt: "2026-06-22T09:00:00Z",
    ...over,
  };
}

function makeApi(
  violationRule: Partial<AutodromeApi["violationRule"]>,
): AutodromeApi {
  return { violationRule } as unknown as AutodromeApi;
}

describe("liveViolationsLoader: mappers (pure)", () => {
  it("maps canonical severities to console severities (total)", () => {
    expect(mapViolationSeverity("critical").state).toBe("critical");
    expect(mapViolationSeverity("high").state).toBe("critical");
    expect(mapViolationSeverity("medium").state).toBe("major");
    expect(mapViolationSeverity("low").state).toBe("minor");
  });

  it("severity label mirrors console enum", () => {
    expect(mapViolationSeverity("critical").label).toBe("critical");
    expect(mapViolationSeverity("medium").label).toBe("major");
    expect(mapViolationSeverity("low").label).toBe("minor");
  });

  it("maps a violation with active rule binding", () => {
    const v = mapViolationDtoToConsole(
      makeViolation({
        violationId: "viol-X",
        code: "VIOL-042",
        title: "Stop line crossed",
        severity: "critical",
      }),
    );
    expect(v.id).toBe("viol-X");
    expect(v.code).toBe("VIOL-042");
    expect(v.name).toBe("Stop line crossed");
    expect(v.severity).toBe("critical");
    expect(v.severityLabel).toBe("critical");
    expect(v.ruleId).toBe("rule-1");
    expect(v.status).toBe("active");
    expect(v.statusLabel).toBe("active");
    expect(v.penalty).toBe("—");
    expect(v.requiredEvidence).toEqual([]);
  });

  it("maps a violation with no active rule binding to '—' ruleId", () => {
    const v = mapViolationDtoToConsole(
      makeViolation({ activeRuleVersion: undefined }),
    );
    expect(v.ruleId).toBe("—");
  });

  it("maps a medium severity to major", () => {
    expect(
      mapViolationDtoToConsole(makeViolation({ severity: "medium" })).severity,
    ).toBe("major");
  });

  it("maps a low severity to minor", () => {
    expect(
      mapViolationDtoToConsole(makeViolation({ severity: "low" })).severity,
    ).toBe("minor");
  });
});

describe("liveViolationsLoader (list)", () => {
  it("returns snapshot with activeRule + totals from page", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          makeViolation({
            violationId: "v-1",
            severity: "critical",
            activeRuleVersion: { ruleId: "rule-A", ruleVersion: 3 },
          }),
          makeViolation({
            violationId: "v-2",
            severity: "low",
            activeRuleVersion: undefined,
          }),
        ],
      },
    }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });

    const snapshot = await liveViolationsLoader(api);
    expect(snapshot.activeRule).toEqual({ id: "rule-A", version: "v3" });
    expect(snapshot.totals).toEqual({
      violations: 2,
      active: 2,
      deprecated: 0,
    });
    expect(snapshot.violations.map((v) => v.id)).toEqual(["v-1", "v-2"]);
  });

  it("returns empty snapshot when page is empty (activeRule falls back to '—')", async () => {
    const GET = vi.fn(async () => ({ data: { items: [] } }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });
    const snapshot = await liveViolationsLoader(api);
    expect(snapshot.activeRule).toEqual({ id: "—", version: "—" });
    expect(snapshot.totals.violations).toBe(0);
  });

  it("activeRule falls back to '—' when no violation has an active rule", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          makeViolation({ violationId: "v-1", activeRuleVersion: undefined }),
          makeViolation({ violationId: "v-2", activeRuleVersion: undefined }),
        ],
      },
    }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });
    const snapshot = await liveViolationsLoader(api);
    expect(snapshot.activeRule).toEqual({ id: "—", version: "—" });
  });

  it("propagates ApiError from middleware", async () => {
    const GET = vi.fn(() => {
      throw new ApiError({
        status: 500,
        code: "HTTP_500",
        message: "violation-rule-service offline",
        url: "/api/violation-rule/v1/violations",
      });
    });
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });
    await expect(liveViolationsLoader(api)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("liveViolationGet / liveViolationCreate", () => {
  it("GET /violations/{id}: passes path + maps DTO", async () => {
    const dto = makeViolation({ violationId: "viol-X" });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });

    const v = await liveViolationGet(api, "viol-X");

    expect(GET).toHaveBeenCalledWith("/violations/{violationId}", {
      params: { path: { violationId: "viol-X" } },
    });
    expect(v.id).toBe("viol-X");
  });

  it("GET /violations/{id}: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });
    await expect(liveViolationGet(api, "viol-Z")).rejects.toThrow(
      /empty body/i,
    );
  });

  it("POST /violations: attaches Idempotency-Key + body + maps response", async () => {
    const created = makeViolation({ violationId: "viol-NEW" });
    const POST = vi.fn(async () => ({ data: created }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });

    const body: components["schemas"]["ViolationCreation"] = {
      code: "VIOL-NEW",
      title: "Newly created",
      severity: "high",
    };
    const v = await liveViolationCreate(api, body);

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: { "Idempotency-Key": string } };
        body: components["schemas"]["ViolationCreation"];
      },
    ];
    expect(path).toBe("/violations");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(body);
    expect(v.id).toBe("viol-NEW");
  });

  it("POST /violations: each call uses a fresh Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({ data: makeViolation() }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });
    const body: components["schemas"]["ViolationCreation"] = {
      code: "VIOL-X",
      title: "X",
      severity: "medium",
    };
    await liveViolationCreate(api, body);
    await liveViolationCreate(api, body);
    const [, opts1] = POST.mock.calls[0] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    const [, opts2] = POST.mock.calls[1] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    expect(opts1.params.header["Idempotency-Key"]).not.toBe(
      opts2.params.header["Idempotency-Key"],
    );
  });

  it("POST /violations: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });
    await expect(
      liveViolationCreate(api, {
        code: "X",
        title: "X",
        severity: "low",
      }),
    ).rejects.toThrow(/empty body/i);
  });

  it("POST /violations: propagates ApiError", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 409,
        code: "CONFLICT",
        message: "code already taken",
        url: "/api/violation-rule/v1/violations",
      });
    });
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });
    await expect(
      liveViolationCreate(api, {
        code: "X",
        title: "X",
        severity: "low",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
