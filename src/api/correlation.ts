export const CORRELATION_HEADER = "Correlation-Id";

export function newCorrelationId(): string {
  return crypto.randomUUID();
}
