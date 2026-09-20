import assert from "node:assert/strict";
import { test } from "node:test";

import { divideAmounts, fromStroops, toStroops } from "./amounts.ts";

test("parses the amount strings Horizon returns", () => {
  assert.equal(toStroops("12.3450000"), 123450000n);
  assert.equal(toStroops("1"), 10000000n);
  assert.equal(toStroops("0.0000001"), 1n);
  assert.equal(toStroops("0"), 0n);
  assert.equal(toStroops("  2.5  "), 25000000n);
});

test("does not lose precision the way floating point would", () => {
  // Number("0.1") * 1e7 is 999999.9999999999.
  assert.equal(toStroops("0.1"), 1000000n);
  assert.equal(toStroops("1019.8045430"), 10198045430n);
});

test("rejects anything that is not an amount", () => {
  for (const bad of ["", "abc", "1.23456789", "1,5", "1e7"]) {
    assert.throws(() => toStroops(bad), `should reject ${bad}`);
  }
});

test("round-trips through stroops", () => {
  for (const amount of ["12.345", "0.0000001", "1", "0", "1019.804543"]) {
    assert.equal(fromStroops(toStroops(amount)), amount);
  }
  assert.equal(fromStroops(123450000n), "12.345");
  assert.equal(fromStroops(-25000000n), "-2.5");
});

test("divides a lira amount by a SEP-38 rate without floating point", () => {
  // 100 TRY at 49.0290051 TRY per USDC, as the anchor quoted it on testnet.
  assert.equal(divideAmounts("100", "49.0290051"), "2.0396089");
  assert.equal(divideAmounts("10", "4"), "2.5");
});
