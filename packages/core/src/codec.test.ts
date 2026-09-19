import assert from "node:assert/strict";
import { test } from "node:test";

import { ARG_LENGTH, decodeArg, encodeArg, KIND_BONUS, KIND_PLEDGE, paymentRef } from "./codec.ts";

test("arg carries the kind and the campaign id", () => {
  const arg = encodeArg(KIND_PLEDGE, 1);

  assert.equal(arg.length, ARG_LENGTH);
  assert.equal(arg.toString("hex"), "010000000000000001");
  assert.deepEqual(decodeArg(arg), { kind: KIND_PLEDGE, campaignId: 1n });
  assert.deepEqual(decodeArg(encodeArg(KIND_BONUS, 258n)), {
    kind: KIND_BONUS,
    campaignId: 258n,
  });
});

test("decoding refuses a payload the contract would reject", () => {
  assert.throws(() => decodeArg(Buffer.alloc(8)));
  assert.throws(() => decodeArg(Buffer.alloc(10)));
});

test("payment references are the operation id right-aligned in 32 bytes", () => {
  const ref = paymentRef("240518172673");

  assert.equal(ref.length, 32);
  assert.equal(ref.readBigUInt64BE(24), 240518172673n);
  assert.equal(ref.subarray(0, 24).every((byte) => byte === 0), true);
  // Distinct payments never collide.
  assert.notDeepEqual(paymentRef("1"), paymentRef("2"));
});
