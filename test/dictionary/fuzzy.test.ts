import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { digoize } from "../../lib/dictionary/fuzzy";
import { restoreFetch, setFetchFixtures } from "../helpers/fetch";

const fixtures = {
  "/data/fuzzy-rules.json": {
    version: "1.0",
    description: "test rules",
    digraph_normalizations: [
      { from: "ng", to: "ng'", note: "normalize ng" },
    ],
    rules: [
      {
        id: "ch_ts",
        swahili: "ch",
        digo: "ts",
        example: { sw: "chai", dg: "tsai" },
        position: "before_vowel",
      },
      {
        id: "j_dz",
        swahili: "j",
        digo: "dz",
        example: { sw: "jicho", dg: "dzitso" },
        position: "any",
      },
      {
        id: "initial_h",
        swahili: "",
        digo: "h",
        example: { sw: "enda", dg: "henda" },
        position: "word_initial_before_vowel",
      },
    ],
  },
};

describe("digoize", () => {
  before(() => {
    setFetchFixtures(fixtures);
  });

  after(() => {
    restoreFetch();
  });

  it("normalizes digraphs before applying replacement rules", async () => {
    assert.equal(await digoize("Ngoma"), "ng'oma");
  });

  it("applies before-vowel rules only when the next character is a vowel", async () => {
    assert.equal(await digoize("chai"), "tsai");
    assert.equal(await digoize("chwa"), "chwa");
  });

  it("applies general replacements and adds initial h before vowels", async () => {
    assert.equal(await digoize("jina"), "dzina");
    assert.equal(await digoize("enda"), "henda");
  });
});
