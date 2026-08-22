const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;

export function safeNext(raw: string | null): string {
  if (!raw) return "/";

  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    CONTROL_CHAR_RE.test(raw)
  ) {
    return "/";
  }

  return raw;
}
