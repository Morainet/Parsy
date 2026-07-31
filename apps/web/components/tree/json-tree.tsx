"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { JsonErrorCode } from "@parsy/json-core";
import { TreeToolbar } from "@/components/tree/tree-toolbar";
import { TreeNodeView } from "@/components/tree/tree-node";
import { TreeEmpty } from "@/components/tree/tree-empty";
import { useJsonWorker } from "@/hooks/use-json-worker";
import { useTreeStore } from "@/store/tree-store";
import { SAMPLE_JSON } from "@/lib/sample-json";
import {
  buildTree,
  collectContainerPaths,
  collectSearchMatches,
  countNodes,
  type TreeNode,
} from "@/lib/tree";
import { cn, byteLength, formatBytes } from "@/lib/utils";

// Monaco is client-only; load it lazily (same pattern as JsonTool).
const MonacoEditor = dynamic(() => import("@/components/editor/monaco-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  ),
});

interface JsonTreeProps {
  title: string;
  description: string;
}

/** Map a JsonErrorCode to a localized message via the `errors` namespace. */
function useLocalizedErrorMessage() {
  const tErrors = useTranslations("errors");
  return React.useCallback(
    (code: string | undefined) => {
      const key = (code ?? "unknown") as JsonErrorCode;
      try {
        return tErrors(key);
      } catch {
        return tErrors("unknown");
      }
    },
    [tErrors],
  );
}

/**
 * JSON Tree Viewer.
 *
 * Layout: left Monaco input + right live tree. The input is parsed on every
 * change (debounced); the parsed tree drives the right pane. Validation runs
 * in the Web Worker (reuse) so the UI thread stays free on big input.
 */
export function JsonTree({ title, description }: JsonTreeProps) {
  const t = useTranslations("tree");
  const tEditor = useTranslations("editor");
  const tStatus = useTranslations("tool.status");
  const localizeError = useLocalizedErrorMessage();

  const {
    input,
    query,
    matches,
    defaultExpandDepth,
    setInput,
    expandAll: expandAllPaths,
    collapseAll,
    setQuery,
    setMatches,
    reset,
  } = useTreeStore();

  const { process } = useJsonWorker();

  // Parsed tree + validity state, derived from input.
  const [tree, setTree] = React.useState<TreeNode | null>(null);
  const [errorCode, setErrorCode] = React.useState<string | null>(null);
  const [errorLine, setErrorLine] = React.useState<number | null>(null);
  const [errorColumn, setErrorColumn] = React.useState<number | null>(null);

  // Debounced parse + validate on input change.
  const parseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (parseTimer.current) clearTimeout(parseTimer.current);
    parseTimer.current = setTimeout(async () => {
      const text = input;
      if (text.trim().length === 0) {
        setTree(null);
        setErrorCode(null);
        setErrorLine(null);
        setErrorColumn(null);
        return;
      }
      // Build tree client-side (fast O(n)).
      const built = buildTree(text);
      if (built.ok && built.root) {
        setTree(built.root);
        setErrorCode(null);
        setErrorLine(null);
        setErrorColumn(null);
        // Default-expand top levels on first valid parse of this input.
        const paths = collectContainerPaths(built.root, defaultExpandDepth);
        useTreeStore.setState({ expanded: paths });
      } else {
        setTree(null);
        // Get precise error from the worker's validate op.
        const result = await process("validate", { json: text });
        if (!result.valid && result.error) {
          setErrorCode(result.error.code);
          setErrorLine(result.error.line);
          setErrorColumn(result.error.column);
        } else {
          setErrorCode("unknown");
        }
      }
    }, 200);
    return () => {
      if (parseTimer.current) clearTimeout(parseTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, defaultExpandDepth]);

  // Debounced search: collect matches + auto-expand their ancestors.
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (!tree || query.trim().length === 0) {
        setMatches(new Set(), new Set());
        return;
      }
      const { matches: m, expand } = collectSearchMatches(tree, query);
      setMatches(m, expand);
    }, 200);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, query]);

  const hasInput = input.trim().length > 0;
  const isValid = tree !== null;
  const matchCount = matches.size;

  // Action handlers.
  const handleExpandAll = () => {
    if (tree) expandAllPaths(collectContainerPaths(tree));
  };
  const handleCollapseAll = () => {
    collapseAll();
  };
  const handleClear = () => {
    reset();
    setTree(null);
  };
  const handleLoadSample = () => {
    setInput(SAMPLE_JSON);
  };

  const errorMessage = localizeError(errorCode ?? undefined);

  // Empty/error state for the right pane.
  let emptyState: "empty" | "valid-empty" | "error" = "empty";
  if (errorCode) emptyState = "error";
  else if (hasInput && isValid && (!tree?.children || tree.children.length === 0)) {
    emptyState = "valid-empty";
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-[1600px] flex-col px-3 py-4 sm:px-5">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Toolbar */}
      <TreeToolbar
        hasInput={hasInput}
        query={query}
        matchCount={matchCount}
        onQueryChange={setQuery}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onClear={handleClear}
        onLoadSample={handleLoadSample}
      />

      {/* Editors */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 py-3 md:grid-cols-2">
        {/* Left: Monaco input */}
        <div className="relative flex min-h-[260px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <span className="pointer-events-none absolute left-3 top-2.5 z-10 select-none rounded-md bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
            {t("input")}
          </span>
          <div className="h-full w-full pt-8">
            <MonacoEditor
              value={input}
              onChange={setInput}
              errorLine={errorLine}
              loadingLabel={tEditor("loading")}
              ariaLabel={tEditor("inputAria")}
            />
          </div>
        </div>

        {/* Right: tree view */}
        <div className="relative flex min-h-[260px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="pointer-events-none absolute left-3 top-2.5 z-10 flex items-center gap-2">
            <span className="select-none rounded-md bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
              {t("tree")}
            </span>
            {tree && (
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto pt-8">
            {tree ? (
              <ul role="tree" className="p-3 text-sm">
                {/* Render root's children (root itself is "$"). */}
                {tree.children && tree.children.length > 0 ? (
                  tree.children.map((child) => (
                    <TreeNodeView key={child.path} node={child} />
                  ))
                ) : (
                  // Root is a primitive (e.g. JSON is just "hello" or 42).
                  <TreeNodeView node={tree} isRoot />
                )}
              </ul>
            ) : (
              <TreeEmpty
                state={emptyState}
                errorMessage={errorMessage}
                errorLine={errorLine}
                errorColumn={errorColumn}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs text-muted-foreground shadow-soft backdrop-blur">
        <StatusPill
          hasInput={hasInput}
          isValid={isValid}
          errorCode={errorCode}
          errorMessage={errorMessage}
          errorLine={errorLine}
          errorColumn={errorColumn}
        />
        {hasInput && (
          <>
            <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />
            <Metric label={tStatus("input")}>
              {input.length.toLocaleString()} {tStatus("chars")} ·{" "}
              {formatBytes(byteLength(input))}
            </Metric>
            {tree && (
              <Metric label={t("nodes")}>
                {countNodes(tree).toLocaleString()}
              </Metric>
            )}
            {matchCount > 0 && query && (
              <Metric label={t("matches")}>{matchCount}</Metric>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusPill({
  hasInput,
  isValid,
  errorCode,
  errorMessage,
  errorLine,
  errorColumn,
}: {
  hasInput: boolean;
  isValid: boolean;
  errorCode: string | null;
  errorMessage: string;
  errorLine: number | null;
  errorColumn: number | null;
}) {
  const t = useTranslations("tree");
  const tStatus = useTranslations("tool.status");
  if (!hasInput) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs">
        {tStatus("idle")}
      </span>
    );
  }
  if (errorCode) {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 text-destructive">
        <span className="truncate" title={errorMessage}>
          {errorMessage}
        </span>
        {errorLine != null && errorColumn != null && (
          <span className="shrink-0 font-mono text-[11px] text-destructive/80">
            (L{errorLine}:C{errorColumn})
          </span>
        )}
      </span>
    );
  }
  if (isValid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        {t("validTree")}
      </span>
    );
  }
  return null;
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="text-foreground/90">{children}</span>
    </span>
  );
}
