/**
 * Console-shaped reference data view-model.
 *
 * Surfaces canonical `reference-data-service` v1
 * dictionaries: dictionary name + version + items (code +
 * title + valid range).
 *
 * Per spec rule "Не смешиваем справочники, геометрию и
 * расписание в один доменный API": этот workspace
 * scoped только на `referenceData` client.
 */

export type ConsoleReferenceItem = {
  itemId: string;
  code: string;
  title: string;
  validFrom?: string;
  validTo?: string;
};

export type ConsoleReferenceDictionary = {
  dictionary: string;
  /** Friendly label rendered alongside canonical name. */
  label: string;
  version: number;
  /**
   * `null` in live mode: `GET /reference/{dictionary}` returns the
   * dictionary and its items only — publish metadata lives on
   * `ReferenceVersion`, which this read does not carry. Rendered as
   * "—" rather than invented.
   */
  publishedAt: string | null;
  checksumShort: string | null;
  items: ConsoleReferenceItem[];
};

export type ConsoleReferenceDataSnapshot = {
  dictionaries: ConsoleReferenceDictionary[];
  selectedDictionary: string;
  degradedNote?: string;
};
