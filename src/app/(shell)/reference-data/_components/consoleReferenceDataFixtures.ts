import type { MockScenario } from "@/api/mock/scenarios";

import type {
  ConsoleReferenceDataSnapshot,
  ConsoleReferenceDictionary,
} from "./consoleReferenceDataSnapshot";

const EXAM_CATEGORIES: ConsoleReferenceDictionary = {
  dictionary: "examCategories",
  label: "Exam categories",
  version: 7,
  publishedAt: "2026-06-20T10:00:00Z",
  checksumShort: "a1f4…9c20",
  items: [
    {
      itemId: "80000000-0000-4000-8000-000000000001",
      code: "B",
      title: "Category B (passenger)",
      validFrom: "2025-01-01",
    },
    {
      itemId: "80000000-0000-4000-8000-000000000002",
      code: "C",
      title: "Category C (truck)",
      validFrom: "2025-01-01",
    },
    {
      itemId: "80000000-0000-4000-8000-000000000003",
      code: "BE",
      title: "Category BE (passenger with trailer)",
      validFrom: "2025-01-01",
    },
  ],
};

const VIOLATION_CODES: ConsoleReferenceDictionary = {
  dictionary: "violationCodes",
  label: "Violation codes",
  version: 12,
  publishedAt: "2026-06-22T08:30:00Z",
  checksumShort: "5b07…d11a",
  items: [
    {
      itemId: "80000000-0000-4000-8000-000000000010",
      code: "OVR-SPEED",
      title: "Over speed limit",
      validFrom: "2025-01-01",
    },
    {
      itemId: "80000000-0000-4000-8000-000000000011",
      code: "STOP-LINE",
      title: "Stop line crossed",
      validFrom: "2025-01-01",
    },
    {
      itemId: "80000000-0000-4000-8000-000000000012",
      code: "DSE-WARN",
      title: "Driver-side error: warning",
      validFrom: "2025-01-01",
      validTo: "2026-12-31",
    },
  ],
};

const VEHICLE_KINDS: ConsoleReferenceDictionary = {
  dictionary: "vehicleKinds",
  label: "Vehicle kinds",
  version: 3,
  publishedAt: "2026-06-15T09:00:00Z",
  checksumShort: "8f23…91bc",
  items: [
    {
      itemId: "80000000-0000-4000-8000-000000000020",
      code: "passenger",
      title: "Passenger vehicle",
      validFrom: "2025-01-01",
    },
    {
      itemId: "80000000-0000-4000-8000-000000000021",
      code: "truck",
      title: "Truck",
      validFrom: "2025-01-01",
    },
  ],
};

const NORMAL: ConsoleReferenceDataSnapshot = {
  dictionaries: [EXAM_CATEGORIES, VIOLATION_CODES, VEHICLE_KINDS],
  selectedDictionary: EXAM_CATEGORIES.dictionary,
};

const SERVICE_DEGRADED: ConsoleReferenceDataSnapshot = {
  dictionaries: [EXAM_CATEGORIES],
  selectedDictionary: EXAM_CATEGORIES.dictionary,
  degradedNote:
    "Reference data service is degraded — only the cached exam categories dictionary is reachable.",
};

const EMPTY: ConsoleReferenceDataSnapshot = {
  dictionaries: [],
  selectedDictionary: "",
};

export function consoleReferenceDataFor(
  scenario: MockScenario,
): ConsoleReferenceDataSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return SERVICE_DEGRADED;
    case "normal":
    case "violations-detected":
    case "exam-in-progress":
    default:
      return NORMAL;
  }
}

export const __REFERENCE_DICTIONARY_NAMES__ =
  NORMAL.dictionaries.map((d) => d.dictionary);
