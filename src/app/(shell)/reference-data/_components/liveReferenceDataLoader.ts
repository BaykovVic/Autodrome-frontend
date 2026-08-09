/**
 * Live reference-data loader over canonical `reference-data-service`
 * v1: `GET /reference/{dictionary}` → `ReferenceDictionary`
 * (`dictionary`, `version?`, `items[]`).
 *
 * The service is dictionary-scoped, so the workspace reads the known
 * console dictionaries in parallel. A dictionary the operator may not
 * read (403) or that does not exist (404) is skipped rather than
 * failing the whole screen; if EVERY read fails the error propagates
 * so the screen renders a forbidden / error state instead of a
 * misleading empty list.
 *
 * Publish metadata (`publishedAt` / `checksum`) lives on
 * `ReferenceVersion` and is not part of this read — those fields stay
 * `null` and render as "—" rather than being invented.
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/reference-data";

import type {
  ConsoleReferenceDataSnapshot,
  ConsoleReferenceDictionary,
  ConsoleReferenceItem,
} from "./consoleReferenceDataSnapshot";

type ReferenceDictionaryDto = components["schemas"]["ReferenceDictionary"];
type ReferenceItemDto = components["schemas"]["ReferenceItem"];

/** Canonical dictionaries surfaced by the console (label is UI copy). */
export const CONSOLE_DICTIONARIES: ReadonlyArray<{
  dictionary: string;
  label: string;
}> = [
  { dictionary: "examCategories", label: "Exam categories" },
  { dictionary: "violationCodes", label: "Violation codes" },
  { dictionary: "vehicleKinds", label: "Vehicle kinds" },
];

export function mapReferenceItem(dto: ReferenceItemDto): ConsoleReferenceItem {
  return {
    itemId: dto.itemId,
    code: dto.code,
    title: dto.title,
    validFrom: dto.validFrom,
    validTo: dto.validTo,
  };
}

export function mapReferenceDictionary(
  dto: ReferenceDictionaryDto,
  label: string,
): ConsoleReferenceDictionary {
  return {
    dictionary: dto.dictionary,
    label,
    version: dto.version ?? 0,
    // Not carried by GET /reference/{dictionary} — see file docstring.
    publishedAt: null,
    checksumShort: null,
    items: (dto.items ?? []).map(mapReferenceItem),
  };
}

export async function liveReferenceDataLoader(
  adapter: AutodromeApi,
  dictionaries: ReadonlyArray<{ dictionary: string; label: string }> =
    CONSOLE_DICTIONARIES,
): Promise<ConsoleReferenceDataSnapshot> {
  const settled = await Promise.allSettled(
    dictionaries.map(async ({ dictionary, label }) => {
      const result = await adapter.referenceData.GET(
        "/reference/{dictionary}",
        { params: { path: { dictionary } } },
      );
      const dto = result.data as ReferenceDictionaryDto | undefined;
      if (!dto) {
        throw new Error(`Reference dictionary ${dictionary} returned no body.`);
      }
      return mapReferenceDictionary(dto, label);
    }),
  );

  const loaded = settled
    .filter(
      (r): r is PromiseFulfilledResult<ConsoleReferenceDictionary> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  // Every read failed → surface the failure instead of an empty screen.
  if (loaded.length === 0) {
    const firstRejection = settled.find(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (firstRejection) throw firstRejection.reason;
  }

  const skipped = settled.length - loaded.length;
  return {
    dictionaries: loaded,
    selectedDictionary: loaded[0]?.dictionary ?? "",
    degradedNote:
      skipped > 0
        ? `${skipped} of ${settled.length} dictionaries could not be read (missing or not permitted).`
        : undefined,
  };
}
