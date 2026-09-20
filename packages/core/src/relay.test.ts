import assert from "node:assert/strict";
import { test } from "node:test";

import { collect } from "./relay.ts";
import { config } from "./config.ts";

const TREASURY = config.treasury;

/** A payment shaped the way Horizon returns it. */
function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: "240518172673",
    type: "payment",
    transaction_successful: true,
    created_at: "2099-01-01T00:00:00Z",
    asset_code: config.usdc.code,
    asset_issuer: config.usdc.issuer,
    from: TREASURY,
    to: config.landing,
    to_muxed_id: "7",
    amount: "2.0396090",
    ...overrides,
  };
}

test("accepts an anchor deposit addressed to a ticket", () => {
  assert.deepEqual(collect([payment()], TREASURY), [
    { operationId: "240518172673", ticket: 7n, amount: 20396090n },
  ]);
});

test("ignores anything that is not the anchor paying a ticket", () => {
  const rejected = [
    payment({ type: "create_account" }),
    payment({ transaction_successful: false }),
    payment({ asset_code: "XLM" }),
    // Same code, different issuer: a fake USDC must never count.
    payment({ asset_issuer: "GDGW3JLFB2PIHMT6ANVG3XWGE36CH22ZM7CBFTKFDLH72GEFRB6Y7AUC" }),
    payment({ from: "GBML2OOQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" }),
    payment({ to: "GBML2OOQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" }),
    // A plain payment to the landing account carries no ticket.
    payment({ to_muxed_id: undefined }),
  ];

  for (const record of rejected) {
    assert.deepEqual(collect([record], TREASURY), [], JSON.stringify(record).slice(0, 80));
  }
});

test("ignores payments that predate the current deployment", () => {
  // Redeploying restarts ticket numbering, so an old payment would otherwise be
  // matched against a brand new ticket belonging to someone else.
  const old = payment({ created_at: "2020-01-01T00:00:00Z" });
  assert.deepEqual(collect([old], TREASURY), []);
});

test("reads the amount without losing the last digit", () => {
  const [candidate] = collect([payment({ amount: "1019.8045430" })], TREASURY);
  assert.equal(candidate?.amount, 10198045430n);
});
