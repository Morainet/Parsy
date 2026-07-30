/**
 * @parsy/converter
 *
 * Placeholder scaffold. The actual JSON → language code generation
 * (Java, Kotlin, Swift, TypeScript, Go, Rust, C#, Dart) will be
 * implemented in Sprint 4 per the product roadmap.
 *
 * Types here are intentionally stable so downstream code can already
 * reference the future API surface.
 */

/** Languages the converter will eventually target. */
export type TargetLanguage =
  | "java"
  | "kotlin"
  | "swift"
  | "typescript"
  | "go"
  | "rust"
  | "csharp"
  | "dart";

export interface ConvertOptions {
  language: TargetLanguage;
  /** Root class / struct name to generate. */
  rootName?: string;
}

export interface ConvertResult {
  ok: boolean;
  /** Generated source code (empty on failure / not-yet-implemented). */
  output: string;
  error: string | null;
}

/**
 * Convert a JSON string into a target language's type definitions.
 *
 * @remark Not implemented yet — returns a clear "coming soon" result so the
 * UI can render an honest placeholder instead of a silent no-op.
 */
export function convertJSON(
  _json: string,
  _options: ConvertOptions,
): ConvertResult {
  return {
    ok: false,
    output: "",
    error: "JSON → code conversion ships in Sprint 4. Stay tuned.",
  };
}
