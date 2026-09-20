/**
 * The relay loop: watches the landing account and turns each settled bank
 * transfer into a contract call.
 *
 *   pnpm relayer
 *
 * Stateless by design — stopping and restarting it changes nothing, and it can
 * run next to the /api/relay route without the two stepping on each other.
 */
import { Keypair } from "@stellar/stellar-sdk";

import { config, relayOnce } from "@stello/core";

const secret = process.env.LANDING_SECRET;
if (!secret) {
  console.error("LANDING_SECRET is not set (scripts/deploy.sh writes it to .env)");
  process.exit(1);
}

const landing = Keypair.fromSecret(secret);
if (landing.publicKey() !== config.landing) {
  console.error(
    `LANDING_SECRET is for ${landing.publicKey()}, but the deployment expects ${config.landing}`,
  );
  process.exit(1);
}

const log = (message: string) =>
  console.log(`${new Date().toISOString().slice(11, 19)}  ${message}`);

log(`relaying payments to ${config.routerId}`);
log(`landing account ${config.landing}`);

let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
  log("stopping");
});

while (!stopping) {
  try {
    const result = await relayOnce({ landing, onEvent: log });
    for (const skipped of result.skipped) {
      if (skipped.reason !== "already-paid") log(`skipped ${skipped.operationId}: ${skipped.reason}`);
    }
  } catch (error) {
    log(`pass failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
