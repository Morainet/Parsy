import { describe, it, expect } from "vitest";
import {
  formatJSON,
  minifyJSON,
  validateJSON,
  repairJSON,
  offsetToLineColumn,
} from "./index";

describe("formatJSON", () => {
  it("formats valid JSON with 2-space indent", () => {
    const result = formatJSON('{"a":1,"b":2}');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("supports 4-space indent", () => {
    const result = formatJSON('{"a":1}', { indent: 4 });
    expect(result.output).toBe('{\n    "a": 1\n}');
  });

  it("supports tab indent", () => {
    const result = formatJSON('{"a":1}', { indent: "\t" });
    expect(result.output).toBe('{\n\t"a": 1\n}');
  });

  it("returns error for empty input", () => {
    const result = formatJSON("   ");
    expect(result.ok).toBe(false);
    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe("empty");
  });

  it("returns error code for invalid JSON", () => {
    const result = formatJSON('{"a":}');
    expect(result.ok).toBe(false);
    expect(result.error).not.toBeNull();
    expect(typeof result.error!.code).toBe("string");
    expect(result.error!.line).toBeGreaterThan(0);
  });
});

describe("minifyJSON", () => {
  it("removes whitespace from formatted JSON", () => {
    const result = minifyJSON('{\n  "a": 1,\n  "b": 2\n}');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('{"a":1,"b":2}');
  });

  it("returns error for empty input", () => {
    const result = minifyJSON("");
    expect(result.ok).toBe(false);
    expect(result.error!.code).toBe("empty");
  });
});

describe("validateJSON", () => {
  it("returns valid for correct JSON", () => {
    const result = validateJSON('{"name":"test","value":42}');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns invalid with line/column for broken JSON", () => {
    const result = validateJSON('{"a":1,}');
    expect(result.valid).toBe(false);
    expect(result.error).not.toBeNull();
    expect(result.error!.line).toBeGreaterThan(0);
    expect(result.error!.column).toBeGreaterThan(0);
  });

  it("returns invalid for empty input", () => {
    const result = validateJSON("");
    expect(result.valid).toBe(false);
    expect(result.error!.code).toBe("empty");
  });
});

describe("repairJSON", () => {
  it("fixes unquoted keys", () => {
    const result = repairJSON('{name: "test"}');
    expect(result.ok).toBe(true);
    expect(result.output).toContain('"name"');
  });

  it("fixes single quotes", () => {
    const result = repairJSON("{'name': 'test'}");
    expect(result.ok).toBe(true);
    expect(result.output).toContain('"name"');
    expect(result.output).toContain('"test"');
  });

  it("fixes trailing commas", () => {
    const result = repairJSON('{"a": 1, "b": 2,}');
    expect(result.ok).toBe(true);
    expect(() => JSON.parse(result.output)).not.toThrow();
  });

  it("fixes comments", () => {
    const result = repairJSON('{\n  // comment\n  "a": 1\n}');
    expect(result.ok).toBe(true);
    expect(() => JSON.parse(result.output)).not.toThrow();
  });

  it("returns error for empty input", () => {
    const result = repairJSON("");
    expect(result.ok).toBe(false);
    expect(result.error!.code).toBe("empty");
  });
});

describe("offsetToLineColumn", () => {
  it("returns 1:1 for offset 0", () => {
    expect(offsetToLineColumn("hello", 0)).toEqual({ line: 1, column: 1 });
  });

  it("computes line and column for single line", () => {
    expect(offsetToLineColumn("hello world", 5)).toEqual({ line: 1, column: 6 });
  });

  it("computes line and column across newlines", () => {
    const text = "line1\nline2\nline3";
    expect(offsetToLineColumn(text, 6)).toEqual({ line: 2, column: 1 });
    expect(offsetToLineColumn(text, 12)).toEqual({ line: 3, column: 1 });
  });
});
