/**
 * Shared types for the JSON core processing library.
 *
 * Everything here is framework-agnostic (no React, no DOM specifics)
 * so it can run equally well on the main thread and inside a Web Worker.
 */

/** A localized error: friendly message plus 1-based line/column. */
export interface JsonError {
  /**
   * Stable, locale-agnostic error code. The UI maps this to a localized
   * string via the message dictionary (`errors.<code>`). Use this for any
   * user-facing rendering — never show `message` directly.
   */
  code: JsonErrorCode;
  /**
   * The raw engine error message (English). Kept for debugging only;
   * not intended for display. May be empty.
   */
  message: string;
  /** 1-based line number where the error was detected. */
  line: number;
  /** 1-based column number where the error was detected. */
  column: number;
  /** Absolute character offset (0-based) in the original source, if known. */
  position?: number;
}

/**
 * Stable error codes produced by the JSON engine. See `errors.ts` →
 * `classify()`. These are the keys under `errors.*` in the message files.
 */
export type JsonErrorCode =
  | "unexpected_eof"
  | "unexpected_token"
  | "trailing_comma"
  | "missing_colon"
  | "control_char"
  | "unquoted_key"
  | "repair_failed"
  | "empty"
  | "unknown";

/**
 * Generic result envelope for formatting-style operations
 * (format / minify). Never throws — callers branch on `ok`.
 */
export interface FormatResult {
  /** `true` when the operation produced valid output. */
  ok: boolean;
  /** The processed JSON text. Empty string on failure. */
  output: string;
  /** Present (and `ok === false`) when the input could not be parsed. */
  error: JsonError | null;
}

/**
 * Result of validating JSON. Distinct from {@link FormatResult} to make
 * the "valid / invalid" intent explicit at call sites.
 */
export interface ValidationResult {
  /** `true` when the JSON is syntactically valid. */
  valid: boolean;
  /** Populated when `valid === false`. */
  error: JsonError | null;
}

/** Indentation preference for {@link formatJSON}. */
export interface FormatOptions {
  /**
   * Number of spaces to use per indentation level, or the string "\t"
   * for tab indentation. Defaults to 2.
   */
  indent?: number | "\t";
}

/** Operation discriminant used by the Web Worker bridge. */
export type JsonOp = "format" | "minify" | "validate" | "repair";

/** Request message sent to the JSON Web Worker. */
export interface WorkerRequest<P = unknown> {
  id: number;
  op: JsonOp;
  payload: P;
}

/** Response message returned from the JSON Web Worker. */
export interface WorkerResponse<R = unknown> {
  id: number;
  result: R;
}

/** Payload shapes per operation. */
export interface FormatPayload {
  json: string;
  indent?: number | "\t";
}

export interface TextPayload {
  json: string;
}
