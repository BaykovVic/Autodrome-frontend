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
