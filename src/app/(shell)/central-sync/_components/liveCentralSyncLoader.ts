/**
 * Live central sync loader + commands.
 *
 * Wires the `/central-sync` workspace к canonical
 * `optional-central-sync-service` v1:
 *   - `GET /sync/status` → SyncStatus → console snapshot.
 *   - `POST /sync/run` → SyncJob.
 *   - `POST /sync/packages/export` → SyncPackage.
 *   - `POST /sync/packages/import` → SyncPackageImportResult.
 *
 * Offline behavior: per canonical 503
 * `SYNC_CENTRAL_UNAVAILABLE`, errors capture
 * `degradedNote` and never block local operations.
 * Idempotency-Key per command (UUID).
 */

import { newCorrelationId } from "@/api/correlation";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/central-sync";

import {
  LICENSE_STATUS_LABELS,
  PACKAGE_TYPE_LABELS,
  SYNC_JOB_STATUS_LABELS,
  type ConsoleCentralSyncSnapshot,
  type ConsoleCentralSyncStatus,
  type ConsoleLicenseStatus,
  type ConsolePackageType,
  type ConsoleSyncJob,
  type ConsoleSyncJobStatus,
  type ConsoleSyncPackage,
  type ConsoleSyncScopeItem,
} from "./consoleCentralSyncSnapshot";

type SyncStatusDto = components["schemas"]["SyncStatus"];
type SyncJobDto = components["schemas"]["SyncJob"];
type SyncPackageDto = components["schemas"]["SyncPackage"];
type LicenseCacheDto = components["schemas"]["CentralLicenseCache"];
type SyncRunRequestDto = components["schemas"]["SyncRunRequest"];
type SyncPackageExportRequestDto =
  components["schemas"]["SyncPackageExportRequest"];

function idempotencyKey(): string {
  return newCorrelationId();
}

function shortHash(full: string): string {
  if (!full || full.length <= 12) return full ?? "—";
  return `${full.slice(0, 4)}…${full.slice(-4)}`;
}

function mapLicenseStatus(
  dto?: LicenseCacheDto,
): {
  licenseStatus: ConsoleLicenseStatus;
  licenseStatusLabel: string;
  licenseExpiresAt?: string;
  offlineGraceUntil?: string;
} {
  const status = (dto?.status ?? "unknown") as ConsoleLicenseStatus;
  return {
    licenseStatus: status,
    licenseStatusLabel: LICENSE_STATUS_LABELS[status],
    licenseExpiresAt: dto?.expiresAt,
    offlineGraceUntil: dto?.offlineGraceUntil,
  };
}

export function mapSyncStatusDtoToConsole(
  dto: SyncStatusDto,
): ConsoleCentralSyncStatus {
  return {
    enabled: dto.enabled,
    pendingItems: dto.pendingItems,
    lastSuccessAt: dto.lastSuccessAt ?? "—",
    lastError: dto.lastError,
    ...mapLicenseStatus(dto.license),
  };
}

export function mapSyncJobDtoToConsole(
  dto: SyncJobDto,
): ConsoleSyncJob {
  const status = dto.status as ConsoleSyncJobStatus;
  return {
    jobId: dto.jobId,
    status,
    statusLabel: SYNC_JOB_STATUS_LABELS[status],
    scope: (dto.scope ?? []) as ConsoleSyncScopeItem[],
    pendingItems: dto.pendingItems ?? 0,
    startedAt: dto.startedAt,
  };
}

export function mapSyncPackageDtoToConsole(
  dto: SyncPackageDto,
): ConsoleSyncPackage {
  const type = dto.type as ConsolePackageType;
  return {
    packageId: dto.packageId,
    type,
    typeLabel: PACKAGE_TYPE_LABELS[type] ?? dto.type,
    schemaVersion: dto.schemaVersion,
    checksumShort: shortHash(dto.checksum),
    createdAt: dto.createdAt,
  };
}

export async function liveCentralSyncLoader(
  adapter: AutodromeApi,
): Promise<ConsoleCentralSyncSnapshot> {
  try {
    const result = await adapter.centralSync.GET("/sync/status", {});
    const dto = result.data as SyncStatusDto | undefined;
    if (!dto) {
      return {
        status: {
          enabled: false,
          pendingItems: 0,
          lastSuccessAt: "—",
          licenseStatus: "unknown",
          licenseStatusLabel: LICENSE_STATUS_LABELS.unknown,
        },
        recentPackages: [],
        lastSyncJob: null,
        degradedNote: "Sync status endpoint returned no body.",
      };
    }
    return {
      status: mapSyncStatusDtoToConsole(dto),
      recentPackages: [],
      lastSyncJob: null,
    };
  } catch (error) {
    return {
      status: {
        enabled: false,
        pendingItems: 0,
        lastSuccessAt: "—",
        licenseStatus: "unknown",
        licenseStatusLabel: LICENSE_STATUS_LABELS.unknown,
      },
      recentPackages: [],
      lastSyncJob: null,
      degradedNote:
        error instanceof Error
          ? error.message
          : "Central contour unreachable; local node continues.",
    };
  }
}

export async function liveCentralSyncRun(
  adapter: AutodromeApi,
  body: SyncRunRequestDto,
): Promise<ConsoleSyncJob> {
  const result = await adapter.centralSync.POST("/sync/run", {
    body,
    params: { header: { "Idempotency-Key": idempotencyKey() } },
  });
  const dto = result.data as SyncJobDto | undefined;
  if (!dto) throw new Error("Sync run endpoint returned no body.");
  return mapSyncJobDtoToConsole(dto);
}

export async function liveCentralSyncExport(
  adapter: AutodromeApi,
  body: SyncPackageExportRequestDto,
): Promise<ConsoleSyncPackage> {
  const result = await adapter.centralSync.POST(
    "/sync/packages/export",
    {
      body,
      params: { header: { "Idempotency-Key": idempotencyKey() } },
    },
  );
  const dto = result.data as SyncPackageDto | undefined;
  if (!dto) throw new Error("Sync export endpoint returned no body.");
  return mapSyncPackageDtoToConsole(dto);
}
