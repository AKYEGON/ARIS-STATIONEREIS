import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PUBLIC_PRODUCT_COLUMNS,
  PUBLIC_VARIANT_COLUMNS,
  catalogSearchTerm,
} from "./publicCatalog.ts";

describe("public catalog columns", () => {
  it("leaves wholesale cost off the storefront select", () => {
    assert.equal(PUBLIC_PRODUCT_COLUMNS.includes("cost_price"), false);
    assert.equal(PUBLIC_VARIANT_COLUMNS.includes("cost_price"), false);
    assert.equal(PUBLIC_PRODUCT_COLUMNS.includes("price"), true);
    assert.equal(PUBLIC_VARIANT_COLUMNS.includes("price"), true);
  });
});

describe("catalogSearchTerm", () => {
  it("strips characters that would break a PostgREST or() filter", () => {
    assert.equal(catalogSearchTerm("pen, (blue)"), "pen blue");
    assert.equal(catalogSearchTerm(`100% "a4" note_book`), "100 a4 note book");
  });

  it("returns an empty string when the query is only punctuation", () => {
    assert.equal(catalogSearchTerm("(),"), "");
  });
});
