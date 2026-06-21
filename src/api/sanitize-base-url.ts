/**
 * Returns a UI-safe rendering of a base URL.
 *
 * Today every base URL comes from `NEXT_PUBLIC_API_*` env vars and is
 * therefore public by design. This helper is defense-in-depth: if a
 * future deployment ever puts credentials into a base URL (userinfo
 * or credential-looking query params), the diagnostics UI must not
 * leak them.
 *
 * Behaviour:
 * - For relative paths (starting with `/`) the value is returned
 *   unchanged.
 * - For absolute URLs, `user:password@` userinfo is replaced with
 *   `***@`.
 * - Query parameters whose name looks like a credential
 *   (`token`, `key`, `secret`, `password`, `auth`, case-insensitive
 *   substring match) get their value replaced with `***`.
 * - If parsing fails, the input is returned unchanged so the
 *   operator still sees the raw value and can recognise the
 *   problem — the diagnostics surface is the safest place to show
 *   that.
 */
const CREDENTIAL_PARAM_HINTS = [
  "token",
  "key",
  "secret",
  "password",
  "auth",
];

export function sanitizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }

  if (url.username || url.password) {
    url.username = "";
    url.password = "";
    // URL setter does not preserve the explicit `***@` marker, so we
    // splice it in manually for the rendered string below.
  }

  const params = url.searchParams;
  for (const key of Array.from(params.keys())) {
    const lower = key.toLowerCase();
    if (CREDENTIAL_PARAM_HINTS.some((hint) => lower.includes(hint))) {
      params.set(key, "***");
    }
  }

  // If the original URL had userinfo, splice the redaction marker
  // into the rendered string.
  let rendered = url.toString();
  const originalHadUserinfo = /^[a-z]+:\/\/[^@/]+@/i.test(trimmed);
  if (originalHadUserinfo) {
    rendered = rendered.replace(
      /^([a-z]+:\/\/)/i,
      (_, scheme) => `${scheme}***@`,
    );
  }
  return rendered;
}
