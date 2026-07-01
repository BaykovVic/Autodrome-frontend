export const CORRELATION_HEADER = "Correlation-Id";

export function newCorrelationId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `corr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
