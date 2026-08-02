/// <reference lib="webworker" />
/**
 * JSON processing Web Worker.
 *
 * Heavy JSON.parse/stringify work runs here so the UI thread stays
 * responsive even on ~10MB inputs. The actual logic lives in
 * `@parsy/json-core` (framework-agnostic pure functions), so the
 * exact same code path runs whether we're in the worker or — as a
 * fallback — on the main thread.
 *
 * Protocol: each request carries a numeric `id`; the matching response
 * echoes it so the caller can pair async requests.
 */
import {
  formatJSON,
  minifyJSON,
  validateJSON,
  repairJSON,
  type FormatPayload,
  type FormatResult,
  type TextPayload,
  type ValidationResult,
  type WorkerRequest,
  type WorkerResponse,
} from "@parsy/json-core";

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, op, payload } = event.data;

  let result: unknown;

  switch (op) {
    case "format": {
      const { json, indent } = payload as FormatPayload;
      result = formatJSON(json, { indent }) as FormatResult;
      break;
    }
    case "minify": {
      const { json } = payload as TextPayload;
      result = minifyJSON(json) as FormatResult;
      break;
    }
    case "validate": {
      const { json } = payload as TextPayload;
      result = validateJSON(json) as ValidationResult;
      break;
    }
    case "repair": {
      const { json } = payload as TextPayload;
      result = repairJSON(json) as FormatResult;
      break;
    }
    default: {
      // Unknown op — surface a structured error so the caller isn't left
      // waiting for a response that never comes.
      const exhaustive: never = op;
      result = {
        ok: false,
        output: "",
        error: {
          code: "unknown",
          message: `Unknown operation: ${String(exhaustive)}`,
          line: 1,
          column: 1,
        },
      } satisfies FormatResult;
    }
  }

  const response: WorkerResponse = { id, result };
  (self as DedicatedWorkerGlobalScope).postMessage(response);
};
