/**
 * Reads a dispatch back through the SDK, the way an integrating app does.
 *
 *   node --import tsx scripts/check-dispatch.ts <router C...> <ticket> [expected stroops]
 *
 * This is the anchor-free half of the claim: the router publishes what it did,
 * and any app can read it without touching the receiving contract's state.
 */
import { Stello, soroban } from "@stello/core";

const [router, ticket, expected] = process.argv.slice(2);

if (!router || !ticket) {
  console.error("kullanım: check-dispatch.ts <router> <ticket> [beklenen stroop]");
  process.exit(2);
}

const stello = new Stello({ route: 1, router });
const latest = (await soroban.getLatestLedger()).sequence;

// The dispatch just happened, so a short window is enough — and it keeps the
// query inside whatever the RPC still retains.
const found = await stello.findDispatch({
  ticket: BigInt(ticket),
  fromLedger: Math.max(1, latest - 2000),
});

if (!found) {
  console.error(`FAIL: ${ticket} numaralı bilet için dispatch olayı bulunamadı`);
  process.exit(1);
}

console.log(
  `SDK okudu: bilet ${found.ticket}, ${found.amount} stroop, accepted=${found.accepted}`,
);

if (expected && found.amount !== BigInt(expected)) {
  console.error(`FAIL: ${expected} bekleniyordu, ${found.amount} bulundu`);
  process.exit(1);
}
if (!found.accepted) {
  console.error("FAIL: ilk dispatch kabul edilmiş olmalıydı");
  process.exit(1);
}
