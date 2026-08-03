import { describe, it, expect } from "vitest";
import { convertJSON, SUPPORTED_LANGUAGES } from "./index";

const SAMPLE = JSON.stringify({
  name: "Parsy",
  version: "1.0.0",
  active: true,
  author: { name: "Morainet" },
  tags: ["json", "tool"],
  users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
});

describe("convertJSON — shared", () => {
  it("returns error for empty input", () => {
    const r = convertJSON("", { language: "typescript" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Input is empty.");
  });

  it("returns error for invalid JSON", () => {
    const r = convertJSON("{broken", { language: "typescript" });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("SUPPORTED_LANGUAGES has 8 entries", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
  });
});

describe("convertJSON — TypeScript", () => {
  it("generates interface with correct types", () => {
    const r = convertJSON(SAMPLE, { language: "typescript", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("export interface Root");
    expect(r.output).toContain("name: string");
    expect(r.output).toContain("active: boolean");
    expect(r.output).toContain("tags: string[]");
  });

  it("generates nested interfaces", () => {
    const r = convertJSON(SAMPLE, { language: "typescript", rootName: "Root" });
    expect(r.output).toContain("export interface Author");
    expect(r.output).toContain("export interface User");
    expect(r.output).toContain("author: Author");
    expect(r.output).toContain("users: User[]");
  });

  it("handles non-object root (primitive)", () => {
    const r = convertJSON("42", { language: "typescript", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("type Root = number");
  });

  it("handles non-object root (array)", () => {
    const r = convertJSON("[1,2,3]", { language: "typescript", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("type Root = number[]");
  });
});

describe("convertJSON — Go", () => {
  it("generates struct with JSON tags", () => {
    const r = convertJSON(SAMPLE, { language: "go", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("type Root struct");
    expect(r.output).toContain('json:"name"');
    expect(r.output).toContain("bool");
    expect(r.output).toContain("[]string");
  });

  it("handles non-object root", () => {
    const r = convertJSON("42", { language: "go", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("type Root = float64");
  });
});

describe("convertJSON — Java", () => {
  it("generates class with nested static classes", () => {
    const r = convertJSON(SAMPLE, { language: "java", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("public class Root");
    expect(r.output).toContain("public static class Author");
    expect(r.output).toContain("List<String>");
  });
});

describe("convertJSON — Kotlin", () => {
  it("generates data class", () => {
    const r = convertJSON(SAMPLE, { language: "kotlin", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("data class Root");
    expect(r.output).toContain("val name: String");
  });
});

describe("convertJSON — Swift", () => {
  it("generates Codable struct", () => {
    const r = convertJSON(SAMPLE, { language: "swift", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("struct Root: Codable");
    expect(r.output).toContain("let name: String");
    expect(r.output).toContain("[String]");
  });
});

describe("convertJSON — Rust", () => {
  it("generates struct with serde derive", () => {
    const r = convertJSON(SAMPLE, { language: "rust", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("pub struct Root");
    expect(r.output).toContain("Serialize, Deserialize");
    expect(r.output).toContain("pub name: String");
    expect(r.output).toContain("Vec<String>");
  });

  it("handles non-object root with type alias", () => {
    const r = convertJSON("[1,2]", { language: "rust", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("pub type Root = Vec<f64>");
  });
});

describe("convertJSON — C#", () => {
  it("generates class with properties", () => {
    const r = convertJSON(SAMPLE, { language: "csharp", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("public class Root");
    expect(r.output).toContain("{ get; set; }");
    expect(r.output).toContain("List<string>");
  });

  it("handles non-object root with using alias", () => {
    const r = convertJSON("42", { language: "csharp", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("using Root = double");
  });
});

describe("convertJSON — Dart", () => {
  it("generates class with named constructor", () => {
    const r = convertJSON(SAMPLE, { language: "dart", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("class Root");
    expect(r.output).toContain("final String name");
    expect(r.output).toContain("required this");
    expect(r.output).toContain("List<String>");
  });

  it("handles non-object root with typedef", () => {
    const r = convertJSON("42", { language: "dart", rootName: "Root" });
    expect(r.ok).toBe(true);
    expect(r.output).toContain("typedef Root = double");
  });
});
