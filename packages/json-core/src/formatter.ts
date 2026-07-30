import { toJsonError } from "./errors";
import type { FormatOptions, FormatResult } from "./types";

/**
 * Normalize the indent option into the third argument of
 * `JSON.stringify` (a number of spaces, or the string "\t").
 */
function resolveIndent(indent?: number | "\t"): number | string {
  if (indent === "\t") return "\t";
  if (typeof indent === "number" && Number.isFinite(indent) && indent >= 0) {
    return Math.min(Math.trunc(indent), 8) || 0;
  }
  return 2;
}

/**
 * Pretty-print (beautify) a JSON string.
 *
 * Implementation note: we deliberately go through `JSON.parse` then
 * `JSON.stringify(..., null, indent)` rather than a hand-rolled tokenizer.
 * For the size budgets we target (≤10MB) this is both faster and far less
 * error-prone, and it gives us free cycle/precision behavior identical to
 * the browser's own notion of valid JSON.
 *
 * Never throws — failures (empty input, syntax errors, deep nesting) are
 * reported via `result.error`.
 */
export function formatJSON(
  json: string,
  options: FormatOptions = {},
): FormatResult {
  const input = typeof json === "string" ? json : "";

  if (input.trim().length === 0) {
    return {
      ok: false,
      output: "",
      error: { code: "empty", message: "Input is empty.", line: 1, column: 1 },
    };
  }

  try {
    const parsed = JSON.parse(input);
    return {
      ok: true,
      output: JSON.stringify(parsed, null, resolveIndent(options.indent)),
      error: null,
    };
  } catch (err) {
    return { ok: false, output: "", error: toJsonError(err, input) };
  }
}
