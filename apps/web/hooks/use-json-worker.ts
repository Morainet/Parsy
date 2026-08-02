"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  formatJSON,
  minifyJSON,
  validateJSON,
  repairJSON,
  type FormatPayload,
  type FormatResult,
  type JsonOp,
  type TextPayload,
  type ValidationResult,
  type WorkerRequest,
  type WorkerResponse,
} from "@parsy/json-core";

/**
 * Result type for a given operation. We map op → result so callers get
 * strong typing without a cast.
 */
type OpResult<T extends JsonOp> = T extends "validate"
  ? ValidationResult
  : FormatResult;

/** Cap on how long we wait for the worker before falling back. */
const WORKER_TIMEOUT_MS = 10_000;

/**
 * Bridge to the JSON Web Worker with an automatic main-thread fallback.
 *
 * Design goals:
 *   - Lazily create exactly one worker for the lifetime of the component.
 *   - Pair requests/responses by `id` (the worker is multiplexable).
 *   - If the worker is unavailable (older browser, CSP, SSR) or a message
 *     fails, transparently run the same `json-core` function on the main
 *     thread. The UX never breaks — it just may block briefly on huge input.
 *
 * Returns a single `process(op, payload)` function.
 */
export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const idCounter = useRef(0);
  // Pending request map: id → { resolve, timer }.
  const pending = useRef<
    Map<number, { resolve: (v: unknown) => void; timer: ReturnType<typeof setTimeout> }>
  >(new Map());
  const supportedOnClient = useRef(false);

  // Lazily create the worker once, on the client.
  const ensureWorker = useCallback((): Worker | null => {
    if (!supportedOnClient.current) return null;
    if (workerRef.current) return workerRef.current;

    try {
      // Next.js understands this `new URL(new Worker)` form and emits the
      // worker as a separate chunk.
      const worker = new Worker(
        new URL("../workers/json.worker.ts", import.meta.url),
        { type: "module" },
      );

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, result } = event.data;
        const entry = pending.current.get(id);
        if (entry) {
          clearTimeout(entry.timer);
          pending.current.delete(id);
          entry.resolve(result);
        }
      };
      // If the worker itself errors (load failure, runtime throw), reject
      // all in-flight requests so the caller can fall back.
      worker.onerror = () => {
        for (const [id, entry] of pending.current) {
          clearTimeout(entry.timer);
          pending.current.delete(id);
          // Resolve with a synthetic error result; fallback path runs anyway.
          entry.resolve(null);
          void id;
        }
      };

      workerRef.current = worker;
      return worker;
    } catch {
      workerRef.current = null;
      return null;
    }
  }, []);

  // Detect worker support only on the client.
  useEffect(() => {
    supportedOnClient.current =
      typeof window !== "undefined" && typeof Worker !== "undefined";
  }, []);

  // Tear down the worker on unmount.
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      for (const entry of pending.current.values()) {
        clearTimeout(entry.timer);
      }
      pending.current.clear();
    };
  }, []);

  /** Run an op directly on the main thread (the fallback path). */
  const runOnMainThread = useCallback(
    <T extends JsonOp>(op: T, payload: FormatPayload | TextPayload): OpResult<T> => {
      switch (op) {
        case "format": {
          const { json, indent } = payload as FormatPayload;
          return formatJSON(json, { indent }) as OpResult<T>;
        }
        case "minify": {
          return minifyJSON((payload as TextPayload).json) as OpResult<T>;
        }
        case "validate": {
          return validateJSON((payload as TextPayload).json) as OpResult<T>;
        }
        case "repair": {
          return repairJSON((payload as TextPayload).json) as OpResult<T>;
        }
        default: {
          const exhaustive: never = op;
          throw new Error(`Unknown operation: ${String(exhaustive)}`);
        }
      }
    },
    [],
  );

  /**
   * Process an operation. Prefers the worker; on any failure (no worker,
   * timeout, error) it falls back to the main thread so the call always
   * resolves with a real result.
   */
  const process = useCallback(
    async <T extends JsonOp>(
      op: T,
      // validate/repair take a bare {json}; format takes {json, indent}.
      payload: T extends "validate" | "repair" ? TextPayload : FormatPayload,
    ): Promise<OpResult<T>> => {
      const worker = ensureWorker();

      // No worker available → run inline.
      if (!worker) {
        return runOnMainThread(op, payload);
      }

      const id = ++idCounter.current;
      const request: WorkerRequest = { id, op, payload };

      return new Promise<OpResult<T>>((resolve) => {
        const timer = setTimeout(() => {
          // Timed out — fall back so the user isn't stuck.
          pending.current.delete(id);
          resolve(runOnMainThread(op, payload));
        }, WORKER_TIMEOUT_MS);

        pending.current.set(id, {
          // If the worker resolves with null (onerror path), fall back.
          resolve: (v) => {
            if (v == null) {
              resolve(runOnMainThread(op, payload));
            } else {
              resolve(v as OpResult<T>);
            }
          },
          timer,
        });

        try {
          worker.postMessage(request);
        } catch {
          clearTimeout(timer);
          pending.current.delete(id);
          resolve(runOnMainThread(op, payload));
        }
      });
    },
    [ensureWorker, runOnMainThread],
  );

  return { process };
}
