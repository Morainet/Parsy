import { toJsonError } from "./errors";
import type { ValidationResult } from "./types";

/**
 * Validate a JSON string for syntactic correctness, returning a
 * localized error (line/column) when it is invalid.
 *
 * Empty / whitespace-only input is treated as invalid with a friendly
 * message rather than thrown.
 */
export function validateJSON(json: string): ValidationResult {
  const input = typeof json === "string" ? json : "";

  if (input.trim().length === 0) {
    return {
      valid: false,
      error: { code: "empty", message: "Input is empty.", line: 1, column: 1 },
    };
  }

  try {
    JSON.parse(input);
    return { valid: true, error: null };
  } catch (err) {
    return { valid: false, error: toJsonError(err, input) };
  }
}
