import type { RecordingItem } from "./defaultRecordingsLoader";

export type RecordingStatus = RecordingItem["status"];
export type Modality = "video" | "audio";

export type EvidenceFilterState = {
  search: string;
  status: RecordingStatus | "any";
  modality: Modality | "any";
};

export const DEFAULT_FILTERS: EvidenceFilterState = {
  search: "",
  status: "any",
  modality: "any",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function recordingModalities(record: RecordingItem): Modality[] {
  const set = new Set<Modality>();
  for (const source of record.sources ?? []) {
    if (source.kind === "microphone") set.add("audio");
    else set.add("video");
  }
  return Array.from(set);
}

export function applyEvidenceFilters(
  recordings: RecordingItem[],
  filters: EvidenceFilterState,
): RecordingItem[] {
  const needle = normalize(filters.search);
  return recordings.filter((rec) => {
    if (filters.status !== "any" && rec.status !== filters.status) {
      return false;
    }
    if (filters.modality !== "any") {
      const modalities = recordingModalities(rec);
      if (!modalities.includes(filters.modality)) return false;
    }
    if (needle.length === 0) return true;
    const haystack = normalize(
      [
        rec.recordingId,
        rec.examRef.examId,
        ...(rec.sources ?? []).map((s) => `${s.sourceId} ${s.kind}`),
      ].join(" "),
    );
    return haystack.includes(needle);
  });
}
