/**
 * End-to-end proof, with no UI involved: real anchor, real testnet.
 *
 *   pnpm e2e --stage anchor   just the SEP client (deposit lands as USDC)
 *   pnpm e2e --stage chain    router + example target, no anchor involved
 *   pnpm e2e --stage full     bank transfer → on_deposit → back out to an IBAN
 *
 * Every stage exits non-zero the moment a check fails, so a green run is
 * evidence rather than decoration.
 */
import { Keypair } from "@stellar/stellar-sdk";

import { readFileSync } from "node:fs";

import {
  accountExists,
  addTrustline,
  config,
  deposit,
  discover,
  fromStroops,
  fundWithFriendbot,
  getRoute,
  getTicket,
  hasTrustline,
  invokeContract,
  login,
  openTicket,
  price,
  putCustomer,
  readContract,
  simulateBankTransfer,
  Stello,
  ticketAddress,
  ticketIdFromAddress,
  usdcBalance,
  waitFor,
} from "stello-sdk";
import { relayOnce } from "stello-sdk/server";

const stage = argValue("--stage") ?? "anchor";
const started = Date.now();

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function step(message: string): void {
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`[${seconds.padStart(5)}s] ${message}`);
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

/** Brings a fresh browser-style key to the point where it can be paid. */
async function onboard(keypair: Keypair): Promise<string> {
  const account = keypair.publicKey();
  if (!(await accountExists(account))) {
    await fundWithFriendbot(account);
    step(`funded ${account.slice(0, 8)}…`);
  }
  if (!(await hasTrustline(account))) {
    await addTrustline(keypair);
    step("USDC trustline added");
  }

  const token = await login(keypair);
  step("signed in to the anchor (SEP-10)");
  await putCustomer(token, account);
  step("customer registered (SEP-12)");
  return token;
}

async function anchorStage(): Promise<void> {
  const endpoints = await discover();
  step(`anchor ${config.anchorDomain} → ${endpoints.transferServer}`);

  const keypair = Keypair.random();
  const token = await onboard(keypair);

  const amountTry = "100";
  const quote = await price(amountTry);
  step(`${amountTry} TRY ≈ ${quote?.usdc ?? "?"} USDC (rate ${quote?.rate ?? "?"})`);

  const instructions = await deposit(token, {
    account: keypair.publicKey(),
    amountTry,
  });
  step(`deposit ${instructions.id} → IBAN ${instructions.iban ?? "?"}`);

  await simulateBankTransfer(instructions.id, amountTry);
  step("bank transfer simulated");

  const settled = await waitFor(token, instructions.id, ["completed"], {
    onUpdate: (tx) => step(`  status: ${tx.status}`),
  });
  step(`anchor delivered ${settled.amount_out} USDC (fee ${settled.amount_fee})`);

  const balance = await usdcBalance(keypair.publicKey());
  step(`on-chain balance: ${fromStroops(balance)} USDC`);
  check(balance > 0n, "the deposit never reached the account");
  check(
    settled.stellar_transaction_id,
    "the anchor reported no Stellar transaction for the deposit",
  );
}

const example = JSON.parse(
  readFileSync(new URL("../deployments/example.json", import.meta.url), "utf8"),
) as { targetId: string; routeId: number };

const balanceOf = (user: string) =>
  readContract<bigint>(example.targetId, "balance", { user });

/** The router and the example target, against the live deployment. No anchor involved. */
async function chainStage(): Promise<void> {
  const route = await getRoute(example.routeId);
  check(route?.target === example.targetId, "the example route points somewhere else");
  step(`route ${example.routeId} → ${route?.name} (${example.targetId.slice(0, 8)}…)`);

  const user = Keypair.random();
  await fundWithFriendbot(user.publicKey());
  const ticket = await openTicket(user, example.routeId, Buffer.from([1]));
  const stored = await getTicket(ticket);
  check(stored?.user === user.publicKey(), "the ticket does not belong to the user");
  check(stored?.route === example.routeId, "the ticket points at the wrong route");

  const address = ticketAddress(config.landing, ticket);
  step(`ticket ${ticket} → pay into ${address}`);
  check(ticketIdFromAddress(address) === String(ticket), "muxed address lost the ticket id");
  check((await balanceOf(user.publicKey())) === 0n, "a fresh user should have nothing saved");
}

function landingKeypair(): Keypair {
  const secret = process.env.LANDING_SECRET;
  check(secret, "LANDING_SECRET is not set (scripts/deploy.sh writes it to .env)");
  const keypair = Keypair.fromSecret(secret);
  check(keypair.publicKey() === config.landing, "LANDING_SECRET is not the deployed landing account");
  return keypair;
}

/**
 * The whole layer without a UI, as an integrating app experiences it: a bank
 * transfer becomes a contract call, and the money comes back out to an IBAN.
 */
async function fullStage(): Promise<void> {
  const landing = landingKeypair();
  const stello = new Stello({ route: example.routeId });
  const onStep = (name: string, detail?: string) => step(`  ${name}${detail ? `: ${detail}` : ""}`);

  const user = Keypair.random();
  const handle = await stello.requestDeposit({
    keypair: user,
    arg: Buffer.from([1]),
    amountTry: "100",
    onStep,
  });
  step(`ticket ${handle.ticket}, IBAN: ${handle.iban}`);

  await stello.simulateBankTransfer(handle, "100");
  step("bank transfer simulated");

  const dispatched = await stello.waitForDeposit({
    handle,
    triggerRelay: () => relayOnce({ landing, onEvent: (message) => step(`  relay: ${message}`) }),
    onStep,
  });
  step(`router dispatched ${fromStroops(dispatched.amount)} USDC, accepted=${dispatched.accepted}`);
  check(dispatched.accepted, "the example target should accept the deposit");

  const saved = await balanceOf(user.publicKey());
  check(saved === dispatched.amount, "the contract did not record what the router delivered");
  step(`on_deposit ran: ${fromStroops(saved)} USDC saved in the contract`);

  await invokeContract(example.targetId, user, "withdraw", { user: user.publicKey() });
  const { usdc, tryAmount } = await stello.withdrawToIban({ keypair: user, onStep });
  step(`cashed out ${fromStroops(usdc)} USDC → ${tryAmount} TRY`);
  check(tryAmount !== undefined, "the anchor never paid out");
}

const stages: Record<string, () => Promise<void>> = {
  anchor: anchorStage,
  chain: chainStage,
  full: fullStage,
};

const run = stages[stage];
check(run, `unknown stage "${stage}" (have: ${Object.keys(stages).join(", ")})`);
await run();
step("PASSED");
