import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { stripPrefixes } from "../../lib/dictionary/morphology";

describe("stripPrefixes", () => {
  it("normalizes casing and strips a single prefix", () => {
    assert.deepEqual(stripPrefixes("Makala"), ["kala", "la"]);
  });

  it("strips nested prefixes without adding duplicates", () => {
    assert.deepEqual(stripPrefixes("Akachisomo"), ["chisomo", "somo"]);
  });

  it("stops recursion before stripping beyond the depth limit", () => {
    assert.deepEqual(stripPrefixes("Akachimarigo"), [
      "chimarigo",
      "marigo",
      "rigo",
    ]);
  });

  it("ignores stems shorter than two characters", () => {
    assert.deepEqual(stripPrefixes("akaa"), []);
  });
});
