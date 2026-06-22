/**
 * Live candidates loader + DTO→view-model mapper.
 *
 * Wires the candidates registry screen to the typed
 * `candidate-service` client (`api.candidate.GET("/candidates")`).
 * Mock mode keeps using the scenario fixtures — this loader is only
 * used when `resolveRuntimeMode() === "live"`.
 *
 * Mapping notes:
 *
 *   - The canonical `Candidate` DTO carries identity + lifecycle
 *     fields only. Enrollment-state and design-only blocks
 *     (eligibility, template status, source device, last enrollment
 *     timestamp) have no canonical backend equivalent yet — see
 *     `_adapter/README.md` for the missing-contract note. Until
 *     those contracts ship, the mapper assigns safe defaults
 *     (`enrollment.state = "not-enrolled"`, etc.) so the live
 *     screen still renders the operator pane without inventing
 *     numbers.
 *
 *   - Date of birth from the DTO is masked to `**.**.YYYY` for the
 *     registry surface, matching the Web Operator Console reference.
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/candidate";

import type {
  CandidateEligibilityState,
  CandidateEnrollmentState,
  CandidateRegistrationState,
  ConsoleCandidate,
  ConsoleCandidatesSnapshot,
} from "./consoleRegistrySnapshot";

type CandidateDto = components["schemas"]["Candidate"];
type CandidateStatus = components["schemas"]["CandidateStatus"];
type CandidatesPage = components["schemas"]["CandidatesPage"];
type CandidateRegistrationDto =
  components["schemas"]["CandidateRegistration"];
type CandidateStatusChangeDto =
  components["schemas"]["CandidateStatusChange"];
type CandidateDeletionDto = components["schemas"]["CandidateDeletion"];

/**
 * Operator-facing draft for the candidate create form. Maps onto
 * the canonical `CandidateRegistration` DTO via
 * `formToCandidateRegistration`. Design-only fields (`category`,
 * `eligibility`) are not part of the DTO yet — see the adapter
 * README for the missing-contract note.
 */
export type CandidateCreateDraft = {
  fullName: string;
  /** Operator-input `DD.MM.YYYY`. Mapper converts to ISO `YYYY-MM-DD`. */
  dob: string;
  document: string;
  /** Optional document type — defaults to `drivingLicense`. */
  documentType?: CandidateRegistrationDto["identityDocument"]["documentType"];
};

const REGISTRATION_FOR_STATUS: Record<
  CandidateStatus,
  CandidateRegistrationState
> = {
  registered: "registered",
  active: "registered",
  suspended: "incomplete",
  archived: "pending",
  deleted: "pending",
};

const ELIGIBILITY_FOR_STATUS: Record<
  CandidateStatus,
  { state: CandidateEligibilityState; label: string }
> = {
  registered: { state: "approved", label: "approved" },
  active: { state: "approved", label: "approved" },
  suspended: { state: "pending", label: "pending decision" },
  archived: { state: "expired", label: "expired" },
  deleted: { state: "denied", label: "denied" },
};

const REGISTRATION_LABEL: Record<CandidateRegistrationState, string> = {
  registered: "registered",
  pending: "pending",
  incomplete: "incomplete",
};

export function buildCandidateName(dto: CandidateDto): string {
  const parts = [dto.firstName, dto.middleName, dto.lastName].filter(
    Boolean,
  ) as string[];
  if (parts.length === 0) return "—";
  // Drop middle name when it's just an initial-less filler; keep
  // the operator-facing display compact.
  if (parts.length === 3 && (parts[1]?.length ?? 0) > 0) {
    return `${parts[0][0]}. ${parts[2]}`;
  }
  return parts.join(" ");
}

export function maskBirthDate(birthDate: string): string {
  // Accepts ISO `YYYY-MM-DD`. Masks day/month, keeps year.
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return `**.**.${birthDate.slice(0, 4)}`;
  }
  // Already-formatted `DD.MM.YYYY` (operator input) — mask month+day
  // but keep year suffix.
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(birthDate)) {
    return `**.**.${birthDate.slice(-4)}`;
  }
  return "**.**.****";
}

export function mapCandidateDtoToConsole(
  dto: CandidateDto,
): ConsoleCandidate {
  const registrationState =
    REGISTRATION_FOR_STATUS[dto.status] ?? "incomplete";
  const eligibility = ELIGIBILITY_FOR_STATUS[dto.status] ?? {
    state: "pending" as const,
    label: "pending decision",
  };
  // The canonical contract does not include exam category or
  // enrollment template metadata. The mapper assigns the safest
  // operator-visible defaults so the live screen does not invent
  // values that aren't in the backend.
  const enrollmentState: CandidateEnrollmentState = "not-enrolled";

  return {
    id: dto.candidateId,
    name: buildCandidateName(dto),
    category: "—",
    registration: {
      state: registrationState,
      label: REGISTRATION_LABEL[registrationState],
    },
    maskedDob: maskBirthDate(dto.birthDate),
    document: dto.identityDocument.documentNumber || "—",
    eligibility,
    enrollment: {
      state: enrollmentState,
      label: "not enrolled",
      templateStatus: "—",
      sourceDevice: "—",
      lastEnrollment: dto.statusChangedAt ?? dto.createdAt,
    },
  };
}

function awaitingEnrollmentCount(
  candidates: readonly ConsoleCandidate[],
): number {
  return candidates.filter((c) => c.enrollment.state !== "enrolled").length;
}

/**
 * Calls `GET /candidates` via the supplied adapter and maps the
 * response into a `ConsoleCandidatesSnapshot`. The shared
 * `createAutodromeClient` middleware throws an `ApiError` on any
 * non-2xx response, so the hook layer surfaces that via
 * `classifyError()` and the existing degraded/error UI primitives.
 */
export async function liveCandidatesLoader(
  adapter: AutodromeApi,
): Promise<ConsoleCandidatesSnapshot> {
  const result = await adapter.candidate.GET("/candidates", {});
  const page = (result.data ?? { items: [] }) as CandidatesPage;
  const candidates = (page.items ?? []).map(mapCandidateDtoToConsole);
  return {
    totals: {
      total: candidates.length,
      awaitingEnrollment: awaitingEnrollmentCount(candidates),
    },
    candidates,
  };
}

function dobIsoFromOperatorInput(dob: string): string {
  // `DD.MM.YYYY` → `YYYY-MM-DD`.
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dob.trim());
  if (!m) {
    throw new Error(
      "Invalid date of birth — expected DD.MM.YYYY",
    );
  }
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function splitFullName(fullName: string): {
  firstName: string;
  middleName?: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    throw new Error("Invalid full name — at least first + last required");
  }
  if (parts.length === 1) {
    // Single name → reuse as both first and last so the canonical
    // contract (which requires both) still accepts it.
    return { firstName: parts[0], lastName: parts[0] };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

/**
 * Map operator-input form → canonical `CandidateRegistration` DTO.
 * Pure, no side effects. Throws on malformed input so the caller
 * can surface a validation error.
 */
export function formToCandidateRegistration(
  draft: CandidateCreateDraft,
): CandidateRegistrationDto {
  const { firstName, middleName, lastName } = splitFullName(draft.fullName);
  return {
    firstName,
    ...(middleName ? { middleName } : {}),
    lastName,
    birthDate: dobIsoFromOperatorInput(draft.dob),
    identityDocument: {
      documentType: draft.documentType ?? "drivingLicense",
      documentNumber: draft.document.trim(),
    },
  };
}

/** GET /candidates/{candidateId} — single candidate read. */
export async function liveCandidateGet(
  adapter: AutodromeApi,
  candidateId: string,
): Promise<ConsoleCandidate> {
  const result = await adapter.candidate.GET(
    "/candidates/{candidateId}",
    {
      params: { path: { candidateId } },
    },
  );
  const dto = result.data as CandidateDto | undefined;
  if (!dto) {
    throw new Error("candidate-service returned an empty body");
  }
  return mapCandidateDtoToConsole(dto);
}

/**
 * POST /candidates — register a new candidate. The operator-input
 * draft is mapped to the canonical DTO via
 * `formToCandidateRegistration`. A fresh `Idempotency-Key` is
 * generated per call so retries do not register duplicates.
 */
export async function liveCandidateRegister(
  adapter: AutodromeApi,
  draft: CandidateCreateDraft,
): Promise<ConsoleCandidate> {
  const registration = formToCandidateRegistration(draft);
  const result = await adapter.candidate.POST("/candidates", {
    params: {
      header: { "Idempotency-Key": newCorrelationId() },
    },
    body: registration,
  });
  const dto = result.data as CandidateDto | undefined;
  if (!dto) {
    throw new Error(
      "candidate-service returned an empty body for POST /candidates",
    );
  }
  return mapCandidateDtoToConsole(dto);
}

/** POST /candidates/{candidateId}/status — change candidate status. */
export async function liveCandidateChangeStatus(
  adapter: AutodromeApi,
  candidateId: string,
  change: CandidateStatusChangeDto,
): Promise<ConsoleCandidate> {
  const result = await adapter.candidate.POST(
    "/candidates/{candidateId}/status",
    {
      params: {
        path: { candidateId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
      body: change,
    },
  );
  const dto = result.data as CandidateDto | undefined;
  if (!dto) {
    throw new Error(
      "candidate-service returned an empty body for status change",
    );
  }
  return mapCandidateDtoToConsole(dto);
}

/**
 * POST /candidates/{candidateId}/delete — idempotent soft-delete.
 * Returns the candidate snapshot the backend chooses to expose
 * post-delete (typically status `deleted`).
 */
export async function liveCandidateDelete(
  adapter: AutodromeApi,
  candidateId: string,
  deletion: CandidateDeletionDto = {},
): Promise<ConsoleCandidate> {
  const result = await adapter.candidate.POST(
    "/candidates/{candidateId}/delete",
    {
      params: {
        path: { candidateId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
      body: deletion,
    },
  );
  const dto = result.data as CandidateDto | undefined;
  if (!dto) {
    throw new Error(
      "candidate-service returned an empty body for delete",
    );
  }
  return mapCandidateDtoToConsole(dto);
}
