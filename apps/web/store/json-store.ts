"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JsonError } from "@parsy/json-core";

/** The three operating modes the shared tool component can open in. */
export type ToolMode = "format" | "minify" | "validate";

/** Indent option expressed as the worker payload expects it. */
export type IndentOption = 2 | 4 | "\t";

/** What the status bar shows for the current input. */
export interface ToolStatus {
  state: "idle" | "valid" | "invalid" | "processing";
  error: JsonError | null;
  /** Last operation wall-clock time in ms (format/minify), if measured. */
  durationMs: number | null;
}

interface JsonState {
  // --- inputs (NOT persisted, by design — never store user data) ---
  input: string;
  output: string;

  // --- preferences (persisted) ---
  mode: ToolMode;
  indent: IndentOption;
  wordWrap: boolean;

  // --- ephemeral status ---
  status: ToolStatus;

  // --- actions ---
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setMode: (mode: ToolMode) => void;
  setIndent: (indent: IndentOption) => void;
  setWordWrap: (wordWrap: boolean) => void;
  setStatus: (status: Partial<ToolStatus>) => void;
  reset: () => void;
}

const initialStatus: ToolStatus = {
  state: "idle",
  error: null,
  durationMs: null,
};

export const useJsonStore = create<JsonState>()(
  persist(
    (set) => ({
      input: "",
      output: "",

      mode: "format",
      indent: 2,
      wordWrap: false,

      status: initialStatus,

      setInput: (input) => set({ input }),
      setOutput: (output) => set({ output }),
      setMode: (mode) => set({ mode }),
      setIndent: (indent) => set({ indent }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setStatus: (patch) =>
        set((s) => ({ status: { ...s.status, ...patch } })),
      reset: () => set({ input: "", output: "", status: initialStatus }),
    }),
    {
      name: "jfp-preferences",
      // SECURITY: only persist user preferences. Never persist the actual
      // JSON input/output — it may contain secrets.
      partialize: (state) => ({
        indent: state.indent,
        wordWrap: state.wordWrap,
      }),
    },
  ),
);
