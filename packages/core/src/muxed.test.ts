import assert from "node:assert/strict";
import { test } from "node:test";

import { ticketAddress, ticketIdFromAddress } from "./muxed.ts";

const LANDING = "GBWOY746OPO2GOADBVBZKDXZC6VAEYB5JGKGKWB7ETGEH6UUELJYNTFL";

test("a ticket becomes a muxed address of the landing account", () => {
  const address = ticketAddress(LANDING, 1);

  assert.equal(address.startsWith("M"), true);
  assert.equal(ticketIdFromAddress(address), "1");
});

test("every ticket gets its own address", () => {
  assert.notEqual(ticketAddress(LANDING, 1), ticketAddress(LANDING, 2));
  assert.equal(ticketIdFromAddress(ticketAddress(LANDING, 424242n)), "424242");
});
