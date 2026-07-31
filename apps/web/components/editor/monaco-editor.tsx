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

    // Define custom JSON-friendly themes tuned to our brand palette.
    // Light theme: warm off-white bg, indigo keys, vivid value colors.
    monaco.editor.defineTheme("parsy-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "string.key.json", foreground: "4338ca" }, // indigo keys
        { token: "string.value.json", foreground: "047857" }, // emerald strings
        { token: "number.json", foreground: "b45309" }, // amber numbers
        { token: "keyword.json", foreground: "7c3aed" }, // violet true/false
        { token: "keyword.json", fontStyle: "italic" },
        { token: "string.value.json", fontStyle: "" },
      ],
      colors: {
        "editor.background": "#fcfcfd",
        "editor.foreground": "#1e293b",
        "editorLineNumber.foreground": "#cbd5e1",
        "editorLineNumber.activeForeground": "#64748b",
        "editor.selectionBackground": "#e0e7ff",
        "editor.inactiveSelectionBackground": "#eef2ff",
        "editor.lineHighlightBackground": "#f8fafc",
        "editor.lineHighlightBorder": "#00000000",
        "editorCursor.foreground": "#4f46e5",
        "editorIndentGuide.background1": "#eef2f7",
        "editorIndentGuide.activeBackground1": "#cbd5e1",
        "editorBracketMatch.background": "#c7d2fe80",
        "editorBracketMatch.border": "#818cf8",
      },
    });

    // Dark theme: deep slate bg, lighter indigo keys, bright value colors.
    monaco.editor.defineTheme("parsy-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "string.key.json", foreground: "a5b4fc" }, // indigo-300 keys
        { token: "string.value.json", foreground: "6ee7b7" }, // emerald-300 strings
        { token: "number.json", foreground: "fcd34d" }, // amber-300 numbers
        { token: "keyword.json", foreground: "c4b5fd", fontStyle: "italic" }, // violet-300
      ],
      colors: {
        "editor.background": "#0f1729",
        "editor.foreground": "#e2e8f0",
        "editorLineNumber.foreground": "#334155",
        "editorLineNumber.activeForeground": "#94a3b8",
        "editor.selectionBackground": "#312e81",
        "editor.inactiveSelectionBackground": "#1e1b4b",
        "editor.lineHighlightBackground": "#111c33",
        "editor.lineHighlightBorder": "#00000000",
        "editorCursor.foreground": "#818cf8",
        "editorIndentGuide.background1": "#1e293b",
        "editorIndentGuide.activeBackground1": "#475569",
        "editorBracketMatch.background": "#4338ca60",
        "editorBracketMatch.border": "#6366f1",
      },
    });

    // Apply the theme matching the current color mode.
    monaco.editor.setTheme(resolvedTheme === "dark" ? "parsy-dark" : "parsy-light");

    // Configure JSON-friendly defaults.
    monaco.languages.json?.jsonDefaults.setDiagnosticsOptions({
      validate: !readOnly,
      allowComments: false,
      schemaValidation: "error",
    });
  };

  // Re-apply the custom theme when the color mode changes.
  React.useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    monaco.editor.setTheme(resolvedTheme === "dark" ? "parsy-dark" : "parsy-light");
  }, [resolvedTheme]);

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
        theme={resolvedTheme === "dark" ? "parsy-dark" : "parsy-light"}
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
          // Industry-standard code-editor values: 14px is the sweet spot
          // (matches VS Code / CodeMirror / jsoneditoronline defaults).
          // line-height 21 ≈ 1.5x for comfortable scanning.
          fontSize: 14,
          lineHeight: 21,
          // letterSpacing 0 — monospace fonts self-align; any tracking breaks
          // JSON indentation alignment.
          letterSpacing: 0,
          fontFamily:
            "'JetBrains Mono', 'Fira Code', var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontLigatures: true,
          wordWrap: wordWrap ? "on" : "off",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          cursorBlinking: "smooth",
          tabSize: 2,
          insertSpaces: true,
          renderLineHighlight: "all",
          roundedSelection: true,
          padding: { top: 14, bottom: 14 },
          guides: {
            indentation: true,
            bracketPairs: true,
          },
          bracketPairColorization: {
            enabled: true,
          },
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
