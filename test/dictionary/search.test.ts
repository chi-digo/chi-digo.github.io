import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";

import { clearCache } from "../../lib/dictionary/loader";
import { searchAll, searchDropdown } from "../../lib/dictionary/search";
import { restoreFetch, setFetchFixtures } from "../helpers/fetch";

const baseFixtures = {
  "/data/fuzzy-rules.json": {
    version: "1.0",
    description: "test rules",
    digraph_normalizations: [
      { from: "ng", to: "ng'", note: "normalize ng" },
    ],
    rules: [],
  },
};

describe("searchAll", () => {
  after(() => {
    restoreFetch();
    clearCache();
  });

  it("returns empty groups for blank queries", async () => {
    assert.deepEqual(await searchAll("  "), {
      dg: [],
      sw: [],
      en: [],
      total: 0,
    });
  });

  it("returns exact digo matches followed by prefix matches", async () => {
    setFetchFixtures({
      ...baseFixtures,
      "/data/ch.idx.json": [
        { sk: "cha", hw: "cha", id: "cha.1", pos: "dzina", eq: "tea" },
        { sk: "chafu", hw: "chafu", id: "chafu", pos: "sifa", eq: "dirty" },
        { sk: "chakula", hw: "chakula", id: "chakula", pos: "dzina", eq: "food" },
      ],
      "/data/reverse-sw.json": {},
      "/data/reverse-en.json": {},
    });
    clearCache();

    const results = await searchAll("cha");

    assert.deepEqual(results.dg.map((result) => result.headword), [
      "cha",
      "chafu",
      "chakula",
    ]);
    assert.equal(results.total, 3);
  });

  it("returns reverse matches when no digo index results exist", async () => {
    setFetchFixtures({
      ...baseFixtures,
      "/data/reverse-sw.json": {
        salamu: [["s", "salama.1"]],
      },
      "/data/reverse-en.json": {
        greeting: [["g", "greet.1"]],
      },
    });
    clearCache();

    const results = await searchAll("greet");

    assert.deepEqual(results.dg, []);
    assert.deepEqual(results.en, [
      {
        id: "greet.1",
        headword: "greet",
        pos: "",
        equivalent: "greeting",
        letter: "g",
        language: "en",
      },
    ]);
    assert.equal(results.total, 1);
  });

  it("falls back to fuzzy digo search when direct and reverse results are empty", async () => {
    setFetchFixtures({
      ...baseFixtures,
      "/data/reverse-sw.json": {},
      "/data/reverse-en.json": {},
      "/data/ng_.idx.json": [
        {
          sk: "ng'ombe",
          hw: "ng'ombe",
          id: "ng'ombe",
          pos: "dzina",
          eq: "cow",
        },
      ],
    });
    clearCache();

    const results = await searchAll("ngombe");

    assert.deepEqual(results.dg.map((result) => result.headword), ["ng'ombe"]);
    assert.equal(results.total, 1);
  });

  it("falls back to morphological digo search after fuzzy search finds nothing", async () => {
    setFetchFixtures({
      ...baseFixtures,
      "/data/reverse-sw.json": {},
      "/data/reverse-en.json": {},
      "/data/m.idx.json": [],
      "/data/r.idx.json": [
        {
          sk: "rigo",
          hw: "rigo",
          id: "rigo.1",
          pos: "dzina",
          eq: "root",
        },
      ],
    });
    clearCache();

    const results = await searchAll("akamarigo");

    assert.deepEqual(results.dg.map((result) => result.headword), ["rigo"]);
    assert.equal(results.total, 1);
  });
});

describe("searchDropdown", () => {
  beforeEach(() => {
    clearCache();
  });

  it("requires at least two characters before searching", async () => {
    assert.deepEqual(await searchDropdown("a"), {
      dg: [],
      sw: [],
      en: [],
      total: 0,
    });
  });
});
