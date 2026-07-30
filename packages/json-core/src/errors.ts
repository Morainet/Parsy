import type { JsonError } from "./types";

/**
 * Convert a 0-based absolute character offset into a 1-based
 * `{ line, column }` position. Used to localize `JSON.parse` errors,
 * which carry no position info themselves in most engines.
 *
 * Mirrors the typical "Position X (Y:Z)" layout developers expect from
 * editors and linters.
 */
export function offsetToLineColumn(
  text: string,
  offset: number,
): { line: number; column: number } {
  if (offset < 0) return { line: 1, column: 1 };

  let line = 1;
  let column = 1;
  const limit = Math.min(offset, text.length);

  for (let i = 0; i < limit; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 0x0a /* \n */) {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}

/**
 * V8/SpiderMonkey/JSC all produce messages that embed the character
 * position, e.g.:
 *   `Unexpected token } in JSON at position 42`
 *   `Expected property name or '}' in JSON at position 13`
 *
 * Extract that integer so we can map it to a line/column. Returns -1
 * when no position token is found.
 */
export function extractPosition(message: string): number {
  // Handles "at position N" (V8/Node) and "at line N column M" (rare).
  const byPosition = message.match(/position\s+(\d+)/i);
  if (byPosition) {
    const n = Number(byPosition[1]);
    if (Number.isFinite(n)) return n;
  }
  // Some engines give "line N column M" without a character offset.
  // We can't recover an exact offset from those, so signal "unknown".
  return -1;
}

/**
 * Stable, locale-agnostic error codes. The web layer maps these to
 * localized strings via the message dictionary (see `messages/*.json`
 * under `errors.*`). Keep these identifiers stable forever — changing
 * a code breaks existing translations.
 *
 * `unknown` is the catch-all for anything we couldn't classify.
 */
export type JsonErrorCode =
  | "unexpected_eof"
  | "unexpected_token"
  | "trailing_comma"
  | "missing_colon"
  | "control_char"
  | "unquoted_key"
  | "empty"
  | "unknown";

/**
 * Map a raw `JSON.parse` error message to a stable {@link JsonErrorCode}.
 * The classification is intentionally lightweight — it normalizes the common
 * engine messages to codes; anything unclassified falls back to `unknown`.
 *
 * Locale-free by design: this runs inside the Web Worker where no i18n
 * context exists. The web layer owns translation.
 */
function classify(rawMessage: string): JsonErrorCode {
  // Strip the trailing "at position N" so the patterns below match reliably.
  const msg = rawMessage.replace(/\s*at position\s+\d+\s*/i, "").trim();

  if (/^Unexpected (?:end of (?:JSON|JSON input)|token .* in JSON at end of input)/i.test(msg)) {
    return "unexpected_eof";
  }
  if (/^Unexpected token .* in JSON/i.test(msg)) {
    return "unexpected_token";
  }
  if (/^Expected property name or '}' in JSON/i.test(msg)) {
    return "trailing_comma";
  }
  if (/^Expected ':' after property name in JSON/i.test(msg)) {
    return "missing_colon";
  }
  if (/^Bad (?:escaped )?control character in string/i.test(msg)) {
    return "control_char";
  }
  if (/^Expected double-quoted property name in JSON/i.test(msg)) {
    return "unquoted_key";
  }

  return "unknown";
}

/**
 * Turn a thrown value (from `JSON.parse` or anything else) into a
 * structured {@link JsonError}, localized against the source text.
 *
 * The `code` field is the stable identifier consumed by translators; the
 * `message` field is kept as the raw engine message for debugging only
 * (it is NOT shown to end users — the UI looks up `code` in the dictionary).
 */
export function toJsonError(err: unknown, source?: string): JsonError {
  const fallback: JsonError = {
    code: "unknown",
    message: "Invalid JSON.",
    line: 1,
    column: 1,
  };

  if (!(err instanceof Error)) {
    if (typeof err === "string" && err.length > 0) {
      return { ...fallback, message: err };
    }
    return fallback;
  }

  const message = err.message || String(err);
  const position = extractPosition(message);
  const code = classify(message);

  if (position >= 0 && source !== undefined) {
    const { line, column } = offsetToLineColumn(source, position);
    return { code, message, line, column, position };
  }

  return { ...fallback, code, message };
}
