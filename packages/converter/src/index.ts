/**
 * @parsy/converter
 *
 * JSON → typed code generation. Converts a JSON document into type
 * definitions for TypeScript, Go, and Java.
 *
 * Pipeline:  JSON text → parse → infer TypeModel (IR) → language renderer
 *
 * The TypeModel is a normalized intermediate representation shared by all
 * renderers. Inference handles: primitive/object/array/null detection,
 * array element-type unification (including mixed-type merging),
 * nested-object naming, optional fields, and struct-signature reuse so
 * same-shape nested objects share one named type.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Languages the converter can generate. */
export type TargetLanguage = "typescript" | "go" | "java";

export interface ConvertOptions {
  language: TargetLanguage;
  /** Name for the root generated type (defaults to "Root"). */
  rootName?: string;
}

export interface ConvertResult {
  ok: boolean;
  /** Generated source code (empty on failure). */
  output: string;
  error: string | null;
}

/** Convenience list for UI dropdowns. */
export const SUPPORTED_LANGUAGES: readonly TargetLanguage[] = [
  "typescript",
  "go",
  "java",
] as const;

// ---------------------------------------------------------------------------
// Type model (IR)
// ---------------------------------------------------------------------------

export type PrimitiveKind = "string" | "number" | "boolean" | "null";

export interface ObjectType {
  kind: "object";
  fields: Map<string, TypeNode>;
  fieldOrder: string[];
  /** Structural signature for same-shape dedup (e.g. "{name:string,age:number}"). */
  signature: string;
}

export interface ArrayType {
  kind: "array";
  /** Unified element type (objects merged across elements). null = empty array. */
  elementType: TypeNode | null;
}

export interface PrimitiveType {
  kind: "primitive";
  /** Which primitives this node can be (a Set for union inference). */
  types: Set<PrimitiveKind>;
}

export type TypeNode = ObjectType | ArrayType | PrimitiveType;

/** A named object type collected during inference, for top-level rendering. */
export interface NamedType {
  name: string;
  object: ObjectType;
}

export interface TypeModel {
  root: TypeNode;
  namedTypes: NamedType[];
}

// ---------------------------------------------------------------------------
// Inference engine
// ---------------------------------------------------------------------------

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function primitiveKindOf(value: unknown): PrimitiveKind {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return t;
  return "null";
}

/** Capitalize + sanitize a key into a valid type name. */
function toTypeName(key: string): string {
  const cleaned = key.replace(/[^A-Za-z0-9_$]/g, "");
  const base = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return base || "Item";
}

/** Rough singularization for naming array element types (users -> user). */
function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses") || word.endsWith("xes")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** A short structural signature of a node (for dedup). */
function nodeSignature(node: TypeNode): string {
  switch (node.kind) {
    case "primitive":
      return [...node.types].sort().join("|");
    case "array":
      return node.elementType ? `[${nodeSignature(node.elementType)}]` : "[]";
    case "object":
      return node.signature;
  }
}

/**
 * Merge two TypeNodes into one. Used to unify array element types and to
 * merge fields across multiple object samples. Object fields merge
 * field-by-field; primitives union into a set.
 */
function mergeTypes(a: TypeNode, b: TypeNode): TypeNode {
  if (a.kind === "primitive" && b.kind === "primitive") {
    const types = new Set(a.types);
    for (const t of b.types) types.add(t);
    return { kind: "primitive", types };
  }
  if (a.kind === "array" && b.kind === "array") {
    if (!a.elementType) return { kind: "array", elementType: b.elementType };
    if (!b.elementType) return { kind: "array", elementType: a.elementType };
    return {
      kind: "array",
      elementType: mergeTypes(a.elementType, b.elementType),
    };
  }
  if (a.kind === "object" && b.kind === "object") {
    return mergeObjects(a, b);
  }
  // Heterogeneous merge (e.g. object | string) — rare; fall back to a
  // permissive primitive so renderers don't crash.
  return { kind: "primitive", types: new Set<PrimitiveKind>(["null"]) };
}

function mergeObjects(a: ObjectType, b: ObjectType): ObjectType {
  const fields = new Map(a.fields);
  const fieldOrder = [...a.fieldOrder];
  for (const k of b.fieldOrder) {
    if (fields.has(k)) {
      fields.set(k, mergeTypes(fields.get(k)!, b.fields.get(k)!));
    } else {
      fields.set(k, b.fields.get(k)!);
      fieldOrder.push(k);
    }
  }
  const sigParts = fieldOrder.map(
    (k) => `${k}:${nodeSignature(fields.get(k)!)}`,
  );
  return {
    kind: "object",
    fields,
    fieldOrder,
    signature: `{${sigParts.join(",")}}`,
  };
}

/**
 * Allocates stable names for object types and dedupes same-signature shapes.
 * The first time a signature is seen, a name is minted; later occurrences
 * reuse it (so two "address" objects share one named type).
 */
class TypeNamer {
  private bySig = new Map<string, string>();
  private taken = new Set<string>();
  private intros: Array<{ key: string; signature: string }> = [];
  private counter = 0;

  introduce(key: string, signature: string): void {
    if (this.bySig.has(signature)) return;
    const base = toTypeName(key) || `Type${++this.counter}`;
    this.bySig.set(signature, this.unique(base));
    this.intros.push({ key, signature });
  }

  nameFor(signature: string): string | undefined {
    return this.bySig.get(signature);
  }

  list(): Array<{ key: string; signature: string; name: string }> {
    return this.intros.map((i) => ({
      key: i.key,
      signature: i.signature,
      name: this.bySig.get(i.signature)!,
    }));
  }

  private unique(base: string): string {
    let name = base;
    while (this.taken.has(name)) name = `${base}${++this.counter}`;
    this.taken.add(name);
    return name;
  }
}

/**
 * Walk the parsed value, infer TypeNodes, and capture every distinct object
 * shape (by signature) with its real ObjectType so renderers have field data.
 */
function buildModel(value: unknown, rootName: string): TypeModel {
  const namer = new TypeNamer();
  const captured = new Map<string, ObjectType>();

  const root = infer(value, rootName, rootName, namer, captured);

  // Reserve the root name against the root's signature (if it's an object)
  // so nested objects with the same shape reuse it rather than minting a dup.
  if (root.kind === "object") {
    namer.introduce(rootName, root.signature);
  }

  const namedTypes: NamedType[] = [];
  for (const { signature, name } of namer.list()) {
    if (name === rootName) continue;
    const obj = captured.get(signature);
    if (obj) namedTypes.push({ name, object: obj });
  }
  return { root, namedTypes };
}

function infer(
  value: unknown,
  key: string,
  assignedName: string,
  namer: TypeNamer,
  captured: Map<string, ObjectType>,
): TypeNode {
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", elementType: null };
    let merged: TypeNode | null = null;
    for (const el of value) {
      const elName = toTypeName(singularize(key));
      const elType = infer(el, singularize(key), elName, namer, captured);
      merged = merged ? mergeTypes(merged, elType) : elType;
    }
    return { kind: "array", elementType: merged };
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const fields = new Map<string, TypeNode>();
    const fieldOrder: string[] = [];
    const sigParts: string[] = [];
    for (const fk of Object.keys(obj)) {
      fieldOrder.push(fk);
      const child = infer(obj[fk], fk, toTypeName(fk), namer, captured);
      fields.set(fk, child);
      sigParts.push(`${fk}:${nodeSignature(child)}`);
    }
    const signature = `{${sigParts.join(",")}}`;
    const objectType: ObjectType = { kind: "object", fields, fieldOrder, signature };
    namer.introduce(assignedName, signature);
    if (!captured.has(signature)) captured.set(signature, objectType);
    return objectType;
  }
  return { kind: "primitive", types: new Set([primitiveKindOf(value)]) };
}

// ---------------------------------------------------------------------------
// Convert entry point
// ---------------------------------------------------------------------------

const RENDERERS: Record<
  TargetLanguage,
  (model: TypeModel, rootName: string) => string
> = {
  typescript: renderTypeScript,
  go: renderGo,
  java: renderJava,
};

/**
 * Convert JSON text into a target language's type definitions.
 * Never throws — failures are reported via `result.error`.
 */
export function convertJSON(
  json: string,
  options: ConvertOptions,
): ConvertResult {
  const input = typeof json === "string" ? json : "";
  if (input.trim().length === 0) {
    return { ok: false, output: "", error: "Input is empty." };
  }
  try {
    const parsed = JSON.parse(input);
    const rootName = options.rootName || "Root";
    const model = buildModel(parsed, rootName);
    const renderer = RENDERERS[options.language];
    return { ok: true, output: renderer(model, rootName), error: null };
  } catch (err) {
    return {
      ok: false,
      output: "",
      error: err instanceof Error ? err.message : "Invalid JSON.",
    };
  }
}

// ---------------------------------------------------------------------------
// Shared renderer helpers
// ---------------------------------------------------------------------------

function primitiveDisplay(
  types: Set<PrimitiveKind>,
  lang: TargetLanguage,
): string {
  const map: Record<TargetLanguage, Record<PrimitiveKind, string>> = {
    typescript: {
      string: "string",
      number: "number",
      boolean: "boolean",
      null: "null",
    },
    go: {
      string: "string",
      number: "float64",
      boolean: "bool",
      null: "interface{}",
    },
    java: {
      string: "String",
      number: "Double",
      boolean: "Boolean",
      null: "Object",
    },
  };
  const m = map[lang];
  const parts = [...types].map((t) => m[t]);
  if (parts.length === 1) return parts[0];
  if (lang === "typescript") return [...new Set(parts)].sort().join(" | ");
  const nonNull = parts.filter((p) => p !== m.null);
  return nonNull[0] ?? parts[0];
}

function typeNameOf(
  node: TypeNode,
  lang: TargetLanguage,
  namer: TypeNamer,
): string {
  switch (node.kind) {
    case "primitive":
      return primitiveDisplay(node.types, lang);
    case "array": {
      const el = node.elementType;
      if (!el) {
        return lang === "typescript"
          ? "unknown[]"
          : lang === "go"
            ? "[]interface{}"
            : "List<Object>";
      }
      const inner = typeNameOf(el, lang, namer);
      if (lang === "typescript") return `${inner}[]`;
      if (lang === "go") return `[]${inner}`;
      return `List<${inner}>`;
    }
    case "object": {
      const name = namer.nameFor(node.signature);
      if (name) return name;
      return lang === "typescript"
        ? "Record<string, unknown>"
        : lang === "go"
          ? "map[string]interface{}"
          : "Object";
    }
  }
}

/** Build a namer pre-primed with a model's captured names (for renderers). */
function primeNamer(model: TypeModel, rootName: string): TypeNamer {
  const namer = new TypeNamer();
  for (const nt of model.namedTypes) namer.introduce(nt.name, nt.object.signature);
  if (model.root.kind === "object") namer.introduce(rootName, model.root.signature);
  return namer;
}

// ---- TypeScript -----------------------------------------------------------

function renderTypeScript(model: TypeModel, rootName: string): string {
  const namer = primeNamer(model, rootName);
  const lines: string[] = [];

  for (const nt of model.namedTypes) {
    lines.push(...renderTsInterface(nt.name, nt.object, namer));
    lines.push("");
  }
  if (model.root.kind === "object") {
    lines.push(...renderTsInterface(rootName, model.root, namer));
  } else {
    lines.push(
      `export type ${rootName} = ${typeNameOf(model.root, "typescript", namer)};`,
    );
  }
  return lines.join("\n").trimEnd() + "\n";
}

function renderTsInterface(
  name: string,
  obj: ObjectType,
  namer: TypeNamer,
): string[] {
  const lines = [`export interface ${name} {`];
  for (const fieldKey of obj.fieldOrder) {
    const field = obj.fields.get(fieldKey)!;
    const optional = field.kind === "primitive" && field.types.has("null");
    const type = typeNameOf(field, "typescript", namer);
    const safeKey = IDENT_RE.test(fieldKey) ? fieldKey : `"${fieldKey}"`;
    lines.push(`  ${safeKey}${optional ? "?" : ""}: ${type};`);
  }
  lines.push("}");
  return lines;
}

// ---- Go -------------------------------------------------------------------

function renderGo(model: TypeModel, rootName: string): string {
  const namer = primeNamer(model, rootName);
  const lines: string[] = ["package main", ""];

  for (const nt of model.namedTypes) {
    lines.push(...renderGoStruct(nt.name, nt.object, namer));
    lines.push("");
  }
  if (model.root.kind === "object") {
    lines.push(...renderGoStruct(rootName, model.root, namer));
  } else {
    lines.push(
      `type ${rootName} = ${typeNameOf(model.root, "go", namer)}`,
    );
  }
  return lines.join("\n").trimEnd() + "\n";
}

function renderGoStruct(
  name: string,
  obj: ObjectType,
  namer: TypeNamer,
): string[] {
  const lines = [`type ${name} struct {`];
  for (const fieldKey of obj.fieldOrder) {
    const field = obj.fields.get(fieldKey)!;
    const type = typeNameOf(field, "go", namer);
    const exported = toExportedGoField(fieldKey);
    lines.push(`	${exported} ${type} \`json:"${fieldKey}"\``);
  }
  lines.push("}");
  return lines;
}

function toExportedGoField(key: string): string {
  const cleaned = key.replace(/[^A-Za-z0-9]/g, " ");
  return (
    cleaned
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("") || "Field"
  );
}

// ---- Java -----------------------------------------------------------------

function renderJava(model: TypeModel, rootName: string): string {
  const namer = primeNamer(model, rootName);
  const lines: string[] = [
    "import java.util.List;",
    "",
    `public class ${rootName} {`,
  ];

  if (model.root.kind === "object") {
    for (const fieldKey of model.root.fieldOrder) {
      const field = model.root.fields.get(fieldKey)!;
      lines.push(
        `    public ${typeNameOf(field, "java", namer)} ${javaFieldName(fieldKey)};`,
      );
    }
  }

  for (const nt of model.namedTypes) {
    lines.push("");
    lines.push(`    public static class ${nt.name} {`);
    for (const fieldKey of nt.object.fieldOrder) {
      const field = nt.object.fields.get(fieldKey)!;
      lines.push(
        `        public ${typeNameOf(field, "java", namer)} ${javaFieldName(fieldKey)};`,
      );
    }
    lines.push("    }");
  }

  lines.push("}");
  return lines.join("\n").trimEnd() + "\n";
}

function javaFieldName(key: string): string {
  const cleaned = key.replace(/[^A-Za-z0-9]/g, "");
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1) || "field";
}
