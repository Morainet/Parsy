/**
 * Tree-building utilities for the JSON Tree Viewer.
 *
 * Pure, framework-agnostic functions: turn a parsed JSON value into a node
 * tree, build JSONPath strings, and match nodes against a search query.
 * No React, no DOM — safe to unit-test and (later) extract into @parsy/json-core.
 */

/** The JSON value type a node holds. */
export type JsonType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null";

/** A single node in the rendered tree. */
export interface TreeNode {
  /** Object key or array index (as a string). The root node uses "$". */
  key: string;
  /** JSONPath, e.g. "$.user.address.city". */
  path: string;
  /** Leaf values carry their primitive; containers carry `undefined`. */
  value: string | number | boolean | null;
  /** What kind of JSON value this node represents. */
  type: JsonType;
  /** Present only for object/array nodes. */
  children?: TreeNode[];
  /** Number of children (object key count / array length). 0 for leaves. */
  size: number;
  /** Depth from the root (root is 0). Used for default-expand logic. */
  depth: number;
}

/** Result of building a tree from raw JSON text. */
export interface BuildResult {
  ok: boolean;
  /** The root node on success. */
  root: TreeNode | null;
  /** Human-readable error on failure (already localized by the caller). */
  error: string | null;
}

/** Detect the JsonType of an already-parsed value. */
export function jsonTypeOf(value: unknown): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  if (t === "object") return "object";
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  return "null";
}

/**
 * Append a key segment to a parent JSONPath.
 * Object keys that are simple identifiers use ".key"; everything else
 * (array indices, keys with spaces/symbols) uses bracket "[\"key\"]" form.
 */
export function appendPath(parentPath: string, key: string): string {
  // Root's children start from "$".
  if (parentPath === "$") {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `$.${key}` : `$["${key}"]`;
  }
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${parentPath}.${key}`
    : `${parentPath}["${key}"]`;
}

/**
 * Recursively build a TreeNode tree from a parsed JSON value.
 * Includes cycle detection so pathological inputs (e.g. from `JSON.parse`
 * revivers producing cycles) can't hang the UI.
 */
export function buildNode(
  value: unknown,
  key: string,
  path: string,
  depth: number,
  seen: WeakSet<object>,
): TreeNode {
  const type = jsonTypeOf(value);

  if (type === "object" || type === "array") {
    const obj = value as object;
    // Cycle guard: stop recursing into an object we've already visited.
    if (seen.has(obj)) {
      return { key, path, value: null, type, size: 0, depth };
    }
    seen.add(obj);

    const entries =
      type === "array"
        ? (obj as unknown[]).map((v, i) => [String(i), v] as const)
        : Object.entries(obj as Record<string, unknown>);

    const children = entries.map(([k, v]) =>
      buildNode(v, k, appendPath(path, k), depth + 1, seen),
    );

    return {
      key,
      path,
      value: null,
      type,
      children,
      size: children.length,
      depth,
    };
  }

  // Leaf value.
  return {
    key,
    path,
    value: value as string | number | boolean | null,
    type,
    size: 0,
    depth,
  };
}

/**
 * Parse JSON text and build the tree in one shot.
 * Does NOT throw — callers branch on `ok`.
 */
export function buildTree(json: string): BuildResult {
  const trimmed = (json ?? "").trim();
  if (trimmed.length === 0) {
    return { ok: false, root: null, error: "empty" };
  }
  try {
    const parsed = JSON.parse(trimmed);
    const root = buildNode(parsed, "$", "$", 0, new WeakSet());
    return { ok: true, root, error: null };
  } catch {
    // The precise localized message is resolved by the caller via the error
    // code from validateJSON; here we only signal failure.
    return { ok: false, root: null, error: "invalid" };
  }
}

/**
 * Collect the paths of all nodes that should be expanded so that every
 * match for `query` is visible. A node matches when its key or (leaf) value
 * contains the query (case-insensitive).
 *
 * Returns a Set of container paths to expand (ancestors of every match).
 */
export function collectSearchMatches(
  root: TreeNode,
  query: string,
): { matches: Set<string>; expand: Set<string> } {
  const q = query.trim().toLowerCase();
  const matches = new Set<string>();
  const expand = new Set<string>();

  if (q.length === 0) {
    return { matches, expand };
  }

  const walk = (node: TreeNode, ancestors: string[]) => {
    const keyHit = node.key.toLowerCase().includes(q);
    const valueHit =
      node.type !== "object" &&
      node.type !== "array" &&
      String(node.value).toLowerCase().includes(q);

    if (keyHit || valueHit) {
      matches.add(node.path);
      // Expand every ancestor so this match is visible.
      for (const a of ancestors) expand.add(a);
    }

    if (node.children) {
      const nextAncestors = node.type === "object" || node.type === "array"
        ? [...ancestors, node.path]
        : ancestors;
      for (const child of node.children) walk(child, nextAncestors);
    }
  };

  walk(root, []);
  return { matches, expand };
}

/**
 * Collect every container path under `root` (for "expand all"),
 * or every container path down to a given max depth (for default expand).
 */
export function collectContainerPaths(
  root: TreeNode,
  maxDepth?: number,
): Set<string> {
  const paths = new Set<string>();
  const walk = (node: TreeNode) => {
    if (node.type === "object" || node.type === "array") {
      paths.add(node.path);
      if (maxDepth === undefined || node.depth < maxDepth) {
        node.children?.forEach(walk);
      }
    }
  };
  walk(root);
  return paths;
}

/** Count total nodes in the tree (for the status bar). */
export function countNodes(root: TreeNode): number {
  let n = 1;
  if (root.children) {
    for (const c of root.children) n += countNodes(c);
  }
  return n;
}
