import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  RuleUpdateUnsupportedError,
  liveRuleCreate,
  liveRuleGet,
  liveRulePublish,
  liveRuleUpdate,
  liveRulesLoader,
  mapRuleDtoToConsole,
  mapRuleStatus,
} from "@/app/(shell)/rules/_components/liveRulesLoader";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/violation-rule";

type RuleDefinitionDto = components["schemas"]["RuleDefinition"];

function makeRule(over: Partial<RuleDefinitionDto> = {}): RuleDefinitionDto {
  return {
    ruleId: "00000000-0000-0000-0000-0000000000a1",
    violationRef: { violationId: "00000000-0000-0000-0000-0000000000b1" },
    title: "No speeding in parking zone",
    description: "—",
    ruleVersion: 1,
    status: "published",
    publishedAt: "2026-06-22T10:00:00Z",
    createdAt: "2026-06-22T09:00:00Z",
    ...over,
  };
}

function makeApi(
  violationRule: Partial<AutodromeApi["violationRule"]>,
): AutodromeApi {
  return { violationRule } as unknown as AutodromeApi;
}

describe("liveRulesLoader: mappers (pure)", () => {
  it("maps a published rule to console view-model", () => {
    const v = mapRuleDtoToConsole(
      makeRule({
        ruleId: "rule-X",
        ruleVersion: 4,
        title: "Hard stop in pedestrian zone",
        updatedAt: "2026-06-22T11:00:00Z",
      }),
    );
    expect(v.id).toBe("rule-X");
    expect(v.name).toBe("Hard stop in pedestrian zone");
    expect(v.version).toBe("v4");
    expect(v.status).toBe("published");
    expect(v.statusLabel).toBe("published");
    expect(v.updated).toBe("2026-06-22T11:00:00Z");
  });

  it("maps draft and archived statuses correctly", () => {
    expect(mapRuleDtoToConsole(makeRule({ status: "draft" })).status).toBe(
      "draft",
    );
    expect(
      mapRuleDtoToConsole(makeRule({ status: "archived" })).status,
    ).toBe("archived");
  });

  it("maps missing title to '—' placeholder", () => {
    expect(mapRuleDtoToConsole(makeRule({ title: undefined })).name).toBe(
      "—",
    );
  });

  it("falls back updated timestamp publishedAt → createdAt when no updatedAt", () => {
    expect(
      mapRuleDtoToConsole(
        makeRule({
          updatedAt: undefined,
          publishedAt: "2026-06-22T10:00:00Z",
        }),
      ).updated,
    ).toBe("2026-06-22T10:00:00Z");
    expect(
      mapRuleDtoToConsole(
        makeRule({ updatedAt: undefined, publishedAt: undefined }),
      ).updated,
    ).toBe("2026-06-22T09:00:00Z");
  });

  it("conditionPreview placeholder reflects presence of conditionTree", () => {
    const withTree = mapRuleDtoToConsole(
      makeRule({
        conditionTree: { kind: "leaf", op: "eq" } as unknown as
          components["schemas"]["ConditionTree"],
      }),
    );
    expect(withTree.conditionPreview.length).toBeGreaterThan(0);
    expect(withTree.conditionPreview[0]).toMatch(/condition tree/i);

    const without = mapRuleDtoToConsole(makeRule({ conditionTree: undefined }));
    expect(without.conditionPreview).toEqual([
      "No condition tree attached yet.",
    ]);
  });

  it("history defaults to empty array when not supplied", () => {
    expect(mapRuleDtoToConsole(makeRule()).history).toEqual([]);
  });

  it("mapRuleStatus is total", () => {
    expect(mapRuleStatus("draft").state).toBe("draft");
    expect(mapRuleStatus("published").state).toBe("published");
    expect(mapRuleStatus("archived").state).toBe("archived");
  });
});

describe("liveRulesLoader (list)", () => {
  it("returns snapshot with totals and mapped rules", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          makeRule({ ruleId: "rule-1", status: "published" }),
          makeRule({ ruleId: "rule-2", status: "draft" }),
          makeRule({ ruleId: "rule-3", status: "draft" }),
        ],
      },
    }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });

    const snapshot = await liveRulesLoader(api);
    expect(snapshot.totals).toEqual({
      rules: 3,
      drafts: 2,
      published: 1,
    });
    expect(snapshot.rules.map((r) => r.id)).toEqual([
      "rule-1",
      "rule-2",
      "rule-3",
    ]);
  });

  it("returns empty snapshot for empty page", async () => {
    const GET = vi.fn(async () => ({ data: { items: [] } }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });
    const snapshot = await liveRulesLoader(api);
    expect(snapshot.totals).toEqual({ rules: 0, drafts: 0, published: 0 });
    expect(snapshot.rules).toEqual([]);
  });

  it("propagates ApiError from middleware", async () => {
    const GET = vi.fn(() => {
      throw new ApiError({
        status: 503,
        code: "SERVICE_DEGRADED",
        message: "violation-rule-service degraded",
        url: "/api/violation-rule/v1/rules",
      });
    });
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });
    await expect(liveRulesLoader(api)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("liveRuleGet / liveRuleCreate / liveRulePublish", () => {
  it("GET /rules/{id}: passes path and maps DTO", async () => {
    const dto = makeRule({ ruleId: "rule-X" });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });

    const v = await liveRuleGet(api, "rule-X");

    expect(GET).toHaveBeenCalledWith("/rules/{ruleId}", {
      params: { path: { ruleId: "rule-X" } },
    });
    expect(v.id).toBe("rule-X");
  });

  it("GET /rules/{id}?ruleVersion=N: passes optional query", async () => {
    const dto = makeRule({ ruleId: "rule-Y", ruleVersion: 2 });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });

    const v = await liveRuleGet(api, "rule-Y", 2);

    expect(GET).toHaveBeenCalledWith("/rules/{ruleId}", {
      params: {
        path: { ruleId: "rule-Y" },
        query: { ruleVersion: 2 },
      },
    });
    expect(v.version).toBe("v2");
  });

  it("GET /rules/{id}: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["violationRule"]["GET"],
    });
    await expect(liveRuleGet(api, "rule-Z")).rejects.toThrow(/empty body/i);
  });

  it("POST /rules: attaches Idempotency-Key + body + maps response", async () => {
    const created = makeRule({ ruleId: "rule-NEW", status: "draft" });
    const POST = vi.fn(async () => ({ data: created }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });

    const body: components["schemas"]["RuleDraft"] = {
      violationRef: { violationId: "viol-1" },
      title: "Draft rule",
    };
    const v = await liveRuleCreate(api, body);

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: { "Idempotency-Key": string } };
        body: components["schemas"]["RuleDraft"];
      },
    ];
    expect(path).toBe("/rules");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(body);
    expect(v.id).toBe("rule-NEW");
    expect(v.status).toBe("draft");
  });

  it("POST /rules: each call uses a fresh Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({ data: makeRule() }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });
    const body: components["schemas"]["RuleDraft"] = {
      violationRef: { violationId: "viol-1" },
      title: "Same draft, retry",
    };
    await liveRuleCreate(api, body);
    await liveRuleCreate(api, body);
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

  it("POST /rules: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });
    await expect(
      liveRuleCreate(api, {
        violationRef: { violationId: "v" },
        title: "X",
      }),
    ).rejects.toThrow(/empty body/i);
  });

  it("POST /rules: propagates ApiError", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 422,
        code: "VALIDATION",
        message: "rule title required",
        url: "/api/violation-rule/v1/rules",
      });
    });
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });
    await expect(
      liveRuleCreate(api, {
        violationRef: { violationId: "v" },
        title: "X",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("POST /rules/{id}/publish: forwards path + header + body, maps response", async () => {
    const published = makeRule({
      ruleId: "rule-P",
      ruleVersion: 5,
      status: "published",
      publishedAt: "2026-06-22T12:00:00Z",
    });
    const POST = vi.fn(async () => ({ data: published }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });

    const body: components["schemas"]["RulePublishRequest"] = {
      conditionTree: {} as unknown as components["schemas"]["ConditionTree"],
    };
    const v = await liveRulePublish(api, "rule-P", body);

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { ruleId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["RulePublishRequest"];
      },
    ];
    expect(path).toBe("/rules/{ruleId}/publish");
    expect(opts.params.path.ruleId).toBe("rule-P");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(body);
    expect(v.version).toBe("v5");
    expect(v.status).toBe("published");
  });

  it("POST /rules/{id}/publish: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["violationRule"]["POST"],
    });
    await expect(
      liveRulePublish(api, "rule-P", {
        conditionTree: {} as unknown as components["schemas"]["ConditionTree"],
      }),
    ).rejects.toThrow(/empty body/i);
  });
});

describe("liveRuleUpdate: explicit degraded state (unsupported backend op)", () => {
  it("always throws RuleUpdateUnsupportedError", async () => {
    const api = makeApi({});
    await expect(
      liveRuleUpdate(api, "rule-Z", { title: "renamed" }),
    ).rejects.toBeInstanceOf(RuleUpdateUnsupportedError);
  });

  it("error carries stable machine-readable code", async () => {
    const api = makeApi({});
    try {
      await liveRuleUpdate(api, "rule-Z", {});
      throw new Error("expected RuleUpdateUnsupportedError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RuleUpdateUnsupportedError);
      expect((err as RuleUpdateUnsupportedError).code).toBe(
        "RULE_UPDATE_UNSUPPORTED",
      );
      expect((err as Error).message).toMatch(/update\/edit endpoint/i);
    }
  });
});
