import assert from "node:assert/strict";
import { test } from "node:test";

import { paymentRef } from "./codec.ts";

test("payment references are the operation id right-aligned in 32 bytes", () => {
  const ref = paymentRef("240518172673");

  assert.equal(ref.length, 32);
  assert.equal(ref.readBigUInt64BE(24), 240518172673n);
  assert.equal(ref.subarray(0, 24).every((byte) => byte === 0), true);
  assert.notDeepEqual(paymentRef("1"), paymentRef("2"));
});
