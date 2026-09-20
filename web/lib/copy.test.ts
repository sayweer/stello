import { test } from "node:test";
import assert from "node:assert/strict";
import { DOC_SLUGS, LANGS, getCopy, swapLang } from "./copy";
import type { Block } from "./copy/blocks";

/**
 * The type system already forces both languages to have every field. What it
 * cannot see is a translation that quietly says less — a paragraph dropped, a
 * table row missing, a code sample that drifted from the one above it. These
 * compare the two dictionaries structurally instead.
 */

const shape = (blocks: Block[]) => blocks.map((b) => b.t).join(",");

test("both languages document the same pages", () => {
  for (const lang of LANGS) {
    assert.deepEqual(Object.keys(getCopy(lang).docs).sort(), [...DOC_SLUGS].sort());
  }
});

test("a page has the same blocks in the same order in both languages", () => {
  for (const slug of DOC_SLUGS) {
    assert.equal(
      shape(getCopy("tr").docs[slug].blocks),
      shape(getCopy("en").docs[slug].blocks),
      `docs["${slug}"] differs in structure between languages`,
    );
  }
});

test("tables and lists carry the same number of entries", () => {
  for (const slug of DOC_SLUGS) {
    const a = getCopy("tr").docs[slug].blocks;
    const b = getCopy("en").docs[slug].blocks;
    a.forEach((block, i) => {
      const other = b[i];
      if (block.t === "table" && other.t === "table") {
        assert.equal(block.rows.length, other.rows.length, `${slug}: table rows`);
      }
      if (block.t === "list" && other.t === "list") {
        assert.equal(block.items.length, other.items.length, `${slug}: list items`);
      }
      if (block.t === "steps" && other.t === "steps") {
        assert.equal(block.items.length, other.items.length, `${slug}: steps`);
      }
    });
  }
});

test("code samples are identical apart from what the reader reads", () => {
  /**
   * Removes what a translation is allowed to change: comments, quoted prose
   * the sample prints back, and `<placeholders like this>` that tell the reader
   * what to substitute. The rule in each case is a space — an import specifier,
   * a method name or an amount never has one, so they stay in the comparison
   * where they belong.
   */
  const strip = (code: string) =>
    code
      .split("\n")
      .map((line) => line.replace(/\s*(\/\/|#).*$/, ""))
      .join("\n")
      .replace(/"[^"\n]*\s[^"\n]*"/g, '"…"')
      .replace(/<[^<>\n]*\s[^<>\n]*>/g, "<…>");

  for (const slug of DOC_SLUGS) {
    const a = getCopy("tr").docs[slug].blocks;
    const b = getCopy("en").docs[slug].blocks;
    a.forEach((block, i) => {
      const other = b[i];
      if (block.t === "code" && other.t === "code") {
        assert.equal(strip(block.code), strip(other.code), `${slug}: code block ${i}`);
      }
    });
  }
});

test("the home page offers the same number of cards in both languages", () => {
  const tr = getCopy("tr").home;
  const en = getCopy("en").home;
  assert.equal(tr.facts.length, en.facts.length);
  assert.equal(tr.steps.length, en.steps.length);
  assert.equal(tr.flow.length, en.flow.length);
  assert.equal(tr.receiptRows.length, en.receiptRows.length);
  assert.deepEqual(
    tr.steps.map((s) => s.href),
    en.steps.map((s) => s.href),
  );
});

test("the toggle keeps the reader on the same page", () => {
  assert.equal(swapLang("/tr/docs/sdk", "en"), "/en/docs/sdk");
  assert.equal(swapLang("/en", "tr"), "/tr");
  assert.equal(swapLang("/tr", "en"), "/en");
  // A path that never had a prefix still gains one rather than losing its tail.
  assert.equal(swapLang("/docs/sdk", "en"), "/en/docs/sdk");
});
