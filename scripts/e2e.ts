/**
 * End-to-end proof, with no UI involved: real anchor, real testnet.
 *
 *   pnpm e2e --stage anchor   just the SEP client (deposit lands as USDC)
 *
 * Every stage exits non-zero the moment a check fails, so a green run is
 * evidence rather than decoration.
 */
import { Keypair } from "@stellar/stellar-sdk";

import {
  accountExists,
  addTrustline,
  campaignCount,
  config,
  createCampaign,
  deposit,
  discover,
  encodeArg,
  fromStroops,
  fundWithFriendbot,
  getCampaign,
  getTicket,
  hasTrustline,
  KIND_PLEDGE,
  login,
  openTicket,
  price,
  putCustomer,
  quoteClaim,
  simulateBankTransfer,
  Status,
  statusName,
  ticketAddress,
  ticketIdFromAddress,
  usdcBalance,
  waitFor,
} from "@stello/core";

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

/** The contract client, against the live deployment. No anchor involved. */
async function chainStage(): Promise<void> {
  const before = await campaignCount();
  step(`campaigns so far: ${before}`);

  const organizer = Keypair.random();
  await fundWithFriendbot(organizer.publicKey());
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
  const id = await createCampaign(organizer, {
    title: "e2e chain stage",
    goal: 100n * 10_000_000n,
    deadline,
    bonus: 0n,
    cap: 4n * 10_000_000n,
  });
  step(`created campaign ${id}`);
  check(id === before + 1n, "campaign ids should be sequential");

  const created = await getCampaign(id);
  check(created?.organizer === organizer.publicKey(), "organizer was not stored");
  check(created?.deadline === deadline, "deadline was not stored");
  check(created?.status === Status.Open, "a fresh campaign should be open");
  step(
    `read back: goal ${created?.goal}, cap ${created?.cap}, status ${statusName(created!.status)}`,
  );

  const user = Keypair.random();
  await fundWithFriendbot(user.publicKey());
  const ticket = await openTicket(user, config.routeId, encodeArg(KIND_PLEDGE, id));
  const stored = await getTicket(ticket);
  check(stored?.user === user.publicKey(), "the ticket does not belong to the user");
  check(stored?.route === config.routeId, "the ticket points at the wrong route");

  const address = ticketAddress(config.landing, ticket);
  step(`ticket ${ticket} → pay into ${address}`);
  check(ticketIdFromAddress(address) === String(ticket), "muxed address lost the ticket id");

  check((await quoteClaim(id, user.publicKey())) === 0n, "nothing is claimable yet");
}

const stages: Record<string, () => Promise<void>> = {
  anchor: anchorStage,
  chain: chainStage,
};

const run = stages[stage];
check(run, `unknown stage "${stage}" (have: ${Object.keys(stages).join(", ")})`);
await run();
step("PASSED");
