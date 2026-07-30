import { toJsonError } from "./errors";
import type { FormatResult } from "./types";

/**
 * Minify (compact) a JSON string: remove all insignificant whitespace.
 *
 * Like {@link formatJSON}, this round-trips through `JSON.parse` so that
 * the output is guaranteed to be semantically identical and itself valid
 * JSON — not merely whitespace-stripped source.
 */
export function minifyJSON(json: string): FormatResult {
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
    return { ok: true, output: JSON.stringify(parsed), error: null };
  } catch (err) {
    return { ok: false, output: "", error: toJsonError(err, input) };
  }
}
