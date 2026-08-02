/**
 * @parsy/json-core
 *
 * Framework-agnostic JSON processing primitives. No React, no DOM types —
 * safe to run in a Web Worker or on the main thread.
 *
 * Public surface:
 *   - formatJSON(json, options?) — pretty-print
 *   - minifyJSON(json)           — compact
 *   - validateJSON(json)         — syntax check with line/column
 *   - repairJSON(json)           — fix lenient/loose JSON into valid JSON
 *   - offsetToLineColumn(...)    — position helpers
 *   - types: FormatResult, ValidationResult, JsonError, ...
 */

export { formatJSON } from "./formatter";
export { minifyJSON } from "./minify";
export { validateJSON } from "./validator";
export { repairJSON } from "./repair";
export { extractPosition, offsetToLineColumn, toJsonError } from "./errors";

export type {
  FormatOptions,
  FormatResult,
  JsonError,
  JsonErrorCode,
  JsonOp,
  FormatPayload,
  TextPayload,
  ValidationResult,
  WorkerRequest,
  WorkerResponse,
} from "./types";
