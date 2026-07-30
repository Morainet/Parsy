"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Editor, { type OnMount, type OnChange } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Monaco is strictly client-only (it touches `window` / workers at module
 * load). We gate it behind `next/dynamic` with `ssr: false` so it never
 * runs during server rendering.
 *
 * The outer `MonacoEditor` (the default export below) is a thin server-safe
 * wrapper that renders the dynamically-imported inner editor on the client.
 */

interface MonacoEditorProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  wordWrap?: boolean;
  onChange?: (value: string) => void;
  /** 1-based line numbers to highlight as errors (e.g. from validation). */
  errorLine?: number | null;
  className?: string;
  /** Optional label for screen readers. */
  ariaLabel?: string;
  /** Localized "loading" text shown while Monaco boots. */
  loadingLabel?: string;
}

function MonacoEditorInner({
  value,
  language = "json",
  readOnly = false,
  wordWrap = false,
  onChange,
  errorLine,
  className,
  ariaLabel,
  loadingLabel,
}: MonacoEditorProps) {
  const { resolvedTheme } = useTheme();
  const monacoRef = React.useRef<Parameters<OnMount>[1] | null>(null);
  const editorRef = React.useRef<Parameters<OnMount>[0] | null>(null);
  const decorationsRef = React.useRef<string[]>([]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSON-friendly defaults.
    monaco.languages.json?.jsonDefaults.setDiagnosticsOptions({
      validate: !readOnly,
      allowComments: false,
      schemaValidation: "error",
    });
  };

  // Re-apply the error-line decoration whenever it changes.
  React.useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      errorLine
        ? [
            {
              range: new monaco.Range(errorLine, 1, errorLine, 1),
              options: {
                isWholeLine: true,
                className: "jfp-error-line",
                glyphMarginClassName: "jfp-error-glyph",
              },
            },
          ]
        : [],
    );
  }, [errorLine]);

  const handleChange: OnChange = (val) => {
    onChange?.(val ?? "");
  };

  return (
    <div className={cn("h-full w-full overflow-hidden", className)}>
      <Editor
        language={language}
        value={value}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        onMount={handleMount}
        onChange={handleChange}
        loading={
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            {loadingLabel ?? "Loading…"}
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 20,
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontLigatures: true,
          wordWrap: wordWrap ? "on" : "off",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          tabSize: 2,
          insertSpaces: true,
          renderLineHighlight: "all",
          roundedSelection: true,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            useShadows: false,
          },
          automaticLayout: true,
          ariaLabel: ariaLabel ?? "JSON editor",
        }}
      />
    </div>
  );
}

// Server-safe wrapper: only mounts the real editor in the browser.
// We assert the dynamic component to a concrete React component type so the
// JSX parser and prop-checking have a stable signature to work against.
const MonacoEditor = dynamic<MonacoEditorProps>(
  async () => ({ default: MonacoEditorInner }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
) as unknown as React.ComponentType<MonacoEditorProps>;

export default MonacoEditor;
