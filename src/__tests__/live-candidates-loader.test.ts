import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  buildCandidateName,
  formToCandidateRegistration,
  liveCandidateChangeStatus,
  liveCandidateDelete,
  liveCandidateGet,
  liveCandidateRegister,
  liveCandidatesLoader,
  mapCandidateDtoToConsole,
  maskBirthDate,
} from "@/app/(shell)/candidates/_components/liveCandidatesLoader";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/candidate";

type CandidateDto = components["schemas"]["Candidate"];

function makeDto(over: Partial<CandidateDto> = {}): CandidateDto {
  return {
    candidateId: "00000000-0000-0000-0000-000000000001",
    firstName: "Anna",
    lastName: "Petrova",
    birthDate: "2001-04-12",
    identityDocument: {
      documentType: "drivingLicense",
      documentNumber: "DL-77-014562",
    },
    status: "registered",
    enrollmentState: "notStarted",
    createdAt: "2026-06-22T10:00:00Z",
    ...over,
  };
}

describe("liveCandidatesLoader: mappers (pure)", () => {
  it("maps a registered candidate into a ConsoleCandidate view-model", () => {
    const v = mapCandidateDtoToConsole(makeDto());
    expect(v.id).toBe("00000000-0000-0000-0000-000000000001");
    expect(v.name).toMatch(/Petrova/);
    expect(v.maskedDob).toBe("**.**.2001");
    expect(v.document).toBe("DL-77-014562");
    expect(v.registration.state).toBe("registered");
    expect(v.eligibility.state).toBe("approved");
    expect(v.enrollment.state).toBe("not-enrolled");
  });

  it("masks ISO birth date to **.**.YYYY", () => {
    expect(maskBirthDate("1991-04-08")).toBe("**.**.1991");
    expect(maskBirthDate("2001-04-12")).toBe("**.**.2001");
  });

  it("masks operator-input DD.MM.YYYY birth date to **.**.YYYY", () => {
    expect(maskBirthDate("12.04.2001")).toBe("**.**.2001");
  });

  it("falls back to **.**.**** for malformed birth dates", () => {
    expect(maskBirthDate("12-04-2001")).toBe("**.**.****");
    expect(maskBirthDate("")).toBe("**.**.****");
  });

  it("builds compact name with middle initial when middleName present", () => {
    expect(
      buildCandidateName(
        makeDto({
          firstName: "Anna",
          middleName: "Sergeevna",
          lastName: "Petrova",
        }),
      ),
    ).toBe("A. Petrova");
  });

  it("falls back gracefully when only first/last names exist", () => {
    expect(
      buildCandidateName(
        makeDto({ firstName: "Anna", lastName: "Petrova" }),
      ),
    ).toBe("Anna Petrova");
  });

  it("maps suspended status to incomplete registration + pending eligibility", () => {
    const v = mapCandidateDtoToConsole(makeDto({ status: "suspended" }));
    expect(v.registration.state).toBe("incomplete");
    expect(v.eligibility.state).toBe("pending");
  });

  it("maps archived status to pending registration + expired eligibility", () => {
    const v = mapCandidateDtoToConsole(makeDto({ status: "archived" }));
    expect(v.registration.state).toBe("pending");
    expect(v.eligibility.state).toBe("expired");
  });

  it("maps deleted status to denied eligibility", () => {
    const v = mapCandidateDtoToConsole(makeDto({ status: "deleted" }));
    expect(v.eligibility.state).toBe("denied");
  });

  it("uses createdAt as lastEnrollment when statusChangedAt is missing", () => {
    const v = mapCandidateDtoToConsole(
      makeDto({ createdAt: "2026-06-22T10:00:00Z" }),
    );
    expect(v.enrollment.lastEnrollment).toBe("2026-06-22T10:00:00Z");
  });
});

describe("liveCandidatesLoader: full loader (mocked client)", () => {
  function makeApi(
    handler: () => Promise<{
      data?: { items?: CandidateDto[] };
      error?: unknown;
    }> | { data?: { items?: CandidateDto[] }; error?: unknown },
  ): AutodromeApi {
    const stub = { GET: handler } as unknown as AutodromeApi["candidate"];
    return { candidate: stub } as unknown as AutodromeApi;
  }

  it("returns a snapshot with mapped candidates and awaiting-enrollment totals", async () => {
    const api = makeApi(async () => ({
      data: {
        items: [makeDto(), makeDto({ candidateId: "id-2", status: "active" })],
      },
    }));
    const snapshot = await liveCandidatesLoader(api);
    expect(snapshot.totals.total).toBe(2);
    expect(snapshot.totals.awaitingEnrollment).toBe(2);
    expect(snapshot.candidates[0].id).toBe(
      "00000000-0000-0000-0000-000000000001",
    );
    expect(snapshot.candidates[1].id).toBe("id-2");
  });

  it("returns an empty snapshot when the response has no items", async () => {
    const api = makeApi(async () => ({ data: { items: [] } }));
    const snapshot = await liveCandidatesLoader(api);
    expect(snapshot.totals.total).toBe(0);
    expect(snapshot.candidates).toEqual([]);
  });

  it("propagates ApiError thrown by the client middleware", async () => {
    const api = makeApi(() => {
      throw new ApiError({
        status: 503,
        code: "SERVICE_DEGRADED",
        message: "candidate-service degraded",
        url: "/api/candidate/v1/candidates",
      });
    });
    await expect(liveCandidatesLoader(api)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("formToCandidateRegistration: operator-input → canonical DTO", () => {
  it("converts DD.MM.YYYY operator input to ISO YYYY-MM-DD birthDate", () => {
    const reg = formToCandidateRegistration({
      fullName: "Anna Petrova",
      dob: "12.04.2001",
      document: "DL-77-014562",
    });
    expect(reg.birthDate).toBe("2001-04-12");
  });

  it("splits two-token full name into first + last", () => {
    const reg = formToCandidateRegistration({
      fullName: "Anna Petrova",
      dob: "12.04.2001",
      document: "DL",
    });
    expect(reg.firstName).toBe("Anna");
    expect(reg.lastName).toBe("Petrova");
    expect(reg.middleName).toBeUndefined();
  });

  it("splits three-token full name into first + middle + last", () => {
    const reg = formToCandidateRegistration({
      fullName: "Anna Sergeevna Petrova",
      dob: "12.04.2001",
      document: "DL",
    });
    expect(reg.firstName).toBe("Anna");
    expect(reg.middleName).toBe("Sergeevna");
    expect(reg.lastName).toBe("Petrova");
  });

  it("trims document number whitespace and defaults document type", () => {
    const reg = formToCandidateRegistration({
      fullName: "Anna Petrova",
      dob: "12.04.2001",
      document: "  DL-77-014562  ",
    });
    expect(reg.identityDocument.documentNumber).toBe("DL-77-014562");
    expect(reg.identityDocument.documentType).toBe("drivingLicense");
  });

  it("throws on malformed birth date", () => {
    expect(() =>
      formToCandidateRegistration({
        fullName: "Anna Petrova",
        dob: "2001-04-12",
        document: "DL",
      }),
    ).toThrow(/DD\.MM\.YYYY/);
  });

  it("throws on empty full name", () => {
    expect(() =>
      formToCandidateRegistration({
        fullName: "   ",
        dob: "12.04.2001",
        document: "DL",
      }),
    ).toThrow(/first \+ last/);
  });
});

type CandidateDtoT = components["schemas"]["Candidate"];

function makeCandidateApi(
  candidate: Partial<AutodromeApi["candidate"]>,
): AutodromeApi {
  return { candidate } as unknown as AutodromeApi;
}

describe("liveCandidateGet / liveCandidateRegister / liveCandidateChangeStatus / liveCandidateDelete", () => {
  it("GET /candidates/{id}: passes path param and maps DTO to ConsoleCandidate", async () => {
    const dto = makeDto({ candidateId: "id-X" });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeCandidateApi({
      GET: GET as unknown as AutodromeApi["candidate"]["GET"],
    });

    const v = await liveCandidateGet(api, "id-X");

    expect(GET).toHaveBeenCalledWith("/candidates/{candidateId}", {
      params: { path: { candidateId: "id-X" } },
    });
    expect(v.id).toBe("id-X");
  });

  it("GET /candidates/{id}: throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeCandidateApi({
      GET: GET as unknown as AutodromeApi["candidate"]["GET"],
    });
    await expect(liveCandidateGet(api, "id-Y")).rejects.toThrow(
      /empty body/i,
    );
  });

  it("POST /candidates: maps form → DTO body and attaches Idempotency-Key header", async () => {
    const created: CandidateDtoT = makeDto({ candidateId: "CND-NEW-1" });
    const POST = vi.fn(async () => ({ data: created }));
    const api = makeCandidateApi({
      POST: POST as unknown as AutodromeApi["candidate"]["POST"],
    });

    const v = await liveCandidateRegister(api, {
      fullName: "Anna Petrova",
      dob: "12.04.2001",
      document: "DL-77-014562",
    });

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: { "Idempotency-Key": string } };
        body: components["schemas"]["CandidateRegistration"];
      },
    ];
    expect(path).toBe("/candidates");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body.birthDate).toBe("2001-04-12");
    expect(opts.body.firstName).toBe("Anna");
    expect(opts.body.lastName).toBe("Petrova");
    expect(opts.body.identityDocument.documentNumber).toBe("DL-77-014562");
    expect(v.id).toBe("CND-NEW-1");
  });

  it("POST /candidates: each call uses a fresh Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({ data: makeDto() }));
    const api = makeCandidateApi({
      POST: POST as unknown as AutodromeApi["candidate"]["POST"],
    });
    await liveCandidateRegister(api, {
      fullName: "Anna Petrova",
      dob: "12.04.2001",
      document: "DL-1",
    });
    await liveCandidateRegister(api, {
      fullName: "Anna Petrova",
      dob: "12.04.2001",
      document: "DL-2",
    });
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

  it("POST /candidates: throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeCandidateApi({
      POST: POST as unknown as AutodromeApi["candidate"]["POST"],
    });
    await expect(
      liveCandidateRegister(api, {
        fullName: "Anna Petrova",
        dob: "12.04.2001",
        document: "DL",
      }),
    ).rejects.toThrow(/empty body/i);
  });

  it("POST /candidates: propagates ApiError from middleware", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 409,
        code: "CONFLICT",
        message: "duplicate",
        url: "/api/candidate/v1/candidates",
      });
    });
    const api = makeCandidateApi({
      POST: POST as unknown as AutodromeApi["candidate"]["POST"],
    });
    await expect(
      liveCandidateRegister(api, {
        fullName: "Anna Petrova",
        dob: "12.04.2001",
        document: "DL",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("POST /candidates/{id}/status: passes path, header, and body", async () => {
    const dto = makeDto({ candidateId: "id-S", status: "suspended" });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeCandidateApi({
      POST: POST as unknown as AutodromeApi["candidate"]["POST"],
    });

    const v = await liveCandidateChangeStatus(api, "id-S", {
      targetStatus: "suspended",
      reason: "operator hold",
    });

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { candidateId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["CandidateStatusChange"];
      },
    ];
    expect(path).toBe("/candidates/{candidateId}/status");
    expect(opts.params.path.candidateId).toBe("id-S");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body.targetStatus).toBe("suspended");
    expect(v.registration.state).toBe("incomplete");
  });

  it("POST /candidates/{id}/delete: defaults body to empty object", async () => {
    const dto = makeDto({ candidateId: "id-D", status: "deleted" });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeCandidateApi({
      POST: POST as unknown as AutodromeApi["candidate"]["POST"],
    });

    const v = await liveCandidateDelete(api, "id-D");

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { candidateId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["CandidateDeletion"];
      },
    ];
    expect(path).toBe("/candidates/{candidateId}/delete");
    expect(opts.params.path.candidateId).toBe("id-D");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual({});
    expect(v.eligibility.state).toBe("denied");
  });

  it("POST /candidates/{id}/delete: forwards reason when supplied", async () => {
    const POST = vi.fn(async () => ({ data: makeDto({ status: "deleted" }) }));
    const api = makeCandidateApi({
      POST: POST as unknown as AutodromeApi["candidate"]["POST"],
    });

    await liveCandidateDelete(api, "id-D", { reason: "gdpr" });

    const [, opts] = POST.mock.calls[0] as unknown as [
      string,
      { body: components["schemas"]["CandidateDeletion"] },
    ];
    expect(opts.body.reason).toBe("gdpr");
  });
});
