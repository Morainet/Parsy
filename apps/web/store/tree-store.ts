"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * State for the JSON Tree Viewer.
 *
 * Kept separate from `json-store` (the formatter/validator/minifier store)
 * because the tree has fundamentally different state: a set of expanded
 * paths, a search query, and matched-node paths. Mixing them would break the
 * formatter store's ToolMode/ToolStatus invariants.
 *
 * SECURITY: as with the formatter store, user JSON is never persisted — only
 * the default-expand-depth preference survives a reload.
 */

/** Paths that are currently expanded (object/array node paths). */
export type ExpandedSet = Set<string>;

/** Paths that match the current search query (for highlighting). */
export type MatchSet = Set<string>;

interface TreeState {
  // --- input (NOT persisted) ---
  input: string;

  // --- ephemeral tree state ---
  expanded: ExpandedSet;
  query: string;
  matches: MatchSet;

  // --- preferences (persisted) ---
  /** Depth to auto-expand when new JSON is loaded. Infinity = expand all. */
  defaultExpandDepth: number;

  // --- actions ---
  setInput: (input: string) => void;
  setExpanded: (expanded: ExpandedSet) => void;
  toggle: (path: string) => void;
  expandAll: (paths: Iterable<string>) => void;
  collapseAll: () => void;
  setQuery: (query: string) => void;
  setMatches: (matches: MatchSet, expandToo: ExpandedSet) => void;
  setDefaultExpandDepth: (depth: number) => void;
  reset: () => void;
}

export const useTreeStore = create<TreeState>()(
  persist(
    (set) => ({
      input: "",
      expanded: new Set<string>(),
      query: "",
      matches: new Set<string>(),
      defaultExpandDepth: 2,

      setInput: (input) => set({ input }),
      setExpanded: (expanded) => set({ expanded }),
      toggle: (path) =>
        set((s) => {
          const next = new Set(s.expanded);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return { expanded: next };
        }),
      expandAll: (paths) => set({ expanded: new Set(paths) }),
      collapseAll: () => set({ expanded: new Set<string>() }),
      setQuery: (query) => set({ query }),
      setMatches: (matches, expandToo) =>
        set((s) => ({
          matches,
          // Merge auto-expand paths into the expanded set so matches are visible.
          expanded: new Set([...s.expanded, ...expandToo]),
        })),
      setDefaultExpandDepth: (depth) => set({ defaultExpandDepth: depth }),
      reset: () =>
        set({
          input: "",
          expanded: new Set<string>(),
          query: "",
          matches: new Set<string>(),
        }),
    }),
    {
      name: "parsy-tree-prefs",
      // SECURITY: only persist the default-expand-depth preference.
      partialize: (state) => ({
        defaultExpandDepth: state.defaultExpandDepth,
      }),
      // zustand persists plain JSON; reconstruct Set on rehydrate.
      merge: (persisted, current) => {
        const p = (persisted as Partial<TreeState>) ?? {};
        return {
          ...current,
          ...p,
          // Always start fresh for ephemeral state.
          input: "",
          expanded: new Set<string>(),
          query: "",
          matches: new Set<string>(),
        };
      },
    },
  ),
);
