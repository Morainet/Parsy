import { jsonrepair } from "jsonrepair";
import { offsetToLineColumn } from "./errors";
import type { FormatResult } from "./types";

/**
 * Repair a JSON-like string into valid JSON.
 *
 * Uses `jsonrepair` to fix common lenient-JSON issues: unquoted keys, single
 * quotes, trailing commas, comments, missing closing brackets, broken escapes,
 * concatenated values, etc. The output is guaranteed valid JSON when `ok`.
 *
 * Never throws — failures (input too broken to repair) are reported via
 * `result.error` with a localized line/column derived from the error position.
 */
export function repairJSON(json: string): FormatResult {
  const input = typeof json === "string" ? json : "";

  if (input.trim().length === 0) {
    return {
      ok: false,
      output: "",
      error: { code: "empty", message: "Input is empty.", line: 1, column: 1 },
    };
  }

  try {
    const repaired = jsonrepair(input);
    return { ok: true, output: repaired, error: null };
  } catch (err) {
    // JSONRepairError carries a numeric `position` (0-based char offset).
    const position =
      err && typeof err === "object" && "position" in err
        ? Number((err as { position: unknown }).position)
        : -1;

    if (position >= 0) {
      const { line, column } = offsetToLineColumn(input, position);
      return {
        ok: false,
        output: "",
        error: {
          code: "repair_failed",
          message: err instanceof Error ? err.message : "Could not repair.",
          line,
          column,
          position,
        },
      };
    }

    return {
      ok: false,
      output: "",
      error: {
        code: "repair_failed",
        message: err instanceof Error ? err.message : "Could not repair.",
        line: 1,
        column: 1,
      },
    };
  }
}
