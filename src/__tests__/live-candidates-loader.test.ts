import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";
import {
  buildCandidateName,
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
