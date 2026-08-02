"use client";

import { useEffect, useCallback } from "react";

interface HotkeyOptions {
  /** Key code, e.g. "Enter", "k", "s". Case-insensitive. */
  key: string;
  /** Require Cmd (Mac) or Ctrl (others). Defaults to true. */
  mod?: boolean;
  /** Require Shift. Defaults to false. */
  shift?: boolean;
  /** Don't fire when focus is in an input/textarea (default: true = skip inputs). */
  ignoreInputs?: boolean;
}

/**
 * Register a global keyboard shortcut. Cleans up on unmount.
 *
 * Example: run the primary action on Cmd/Ctrl+Enter.
 *   useHotkey({ key: "Enter", mod: true }, handleRun);
 */
export function useHotkey(
  options: HotkeyOptions,
  handler: () => void,
) {
  const { key, mod = true, shift = false, ignoreInputs = true } = options;

  const callback = useCallback(
    (e: KeyboardEvent) => {
      // Match the key (case-insensitive for letters).
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      // Modifier checks.
      const hasMod = e.metaKey || e.ctrlKey;
      if (mod && !hasMod) return;
      if (!mod && hasMod) return; // don't fire plain-key when mod is required

      if (shift && !e.shiftKey) return;
      if (!shift && e.shiftKey && mod) return;

      // Skip when typing in an input (unless explicitly allowed).
      if (ignoreInputs) {
        const el = e.target as HTMLElement | null;
        const tag = el?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || el?.isContentEditable) {
          return;
        }
      }

      e.preventDefault();
      handler();
    },
    [key, mod, shift, ignoreInputs, handler],
  );

  useEffect(() => {
    window.addEventListener("keydown", callback);
    return () => window.removeEventListener("keydown", callback);
  }, [callback]);
}
