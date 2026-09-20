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
  campaignView,
  claimAndWithdraw,
  confirmDemoTransfer,
  config,
  createCampaign,
  deposit,
  discover,
  encodeArg,
  fromStroops,
  fundBonus,
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
  refundAll,
  relayOnce,
  simulateBankTransfer,
  startJoin,
  Status,
  statusName,
  ticketAddress,
  ticketIdFromAddress,
  usdcBalance,
  waitFor,
  waitForDeposit,
  withdrawProceedsToIban,
} from "@stello/core";

/** 1 USDC in stroops. */
const USDC = 10_000_000n;

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

function landingKeypair(): Keypair {
  const secret = process.env.LANDING_SECRET;
  check(secret, "LANDING_SECRET is not set (scripts/deploy.sh writes it to .env)");
  const keypair = Keypair.fromSecret(secret);
  check(keypair.publicKey() === config.landing, "LANDING_SECRET is not the deployed landing account");
  return keypair;
}

/** One bank transfer, end to end: deposit → relay → pledge on-chain. */
async function relayStage(): Promise<void> {
  const landing = landingKeypair();
  const organizer = Keypair.random();
  await fundWithFriendbot(organizer.publicKey());

  const id = await createCampaign(organizer, {
    title: "e2e relay stage",
    goal: 100n * USDC,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 900),
    bonus: 0n,
    cap: 4n * USDC,
  });
  step(`campaign ${id} (no bonus, so it is live immediately)`);

  const user = Keypair.random();
  const handle = await startJoin({
    keypair: user,
    campaignId: id,
    amountTry: "100",
    onStep: (name, detail) => step(`  ${name}${detail ? `: ${detail}` : ""}`),
  });
  step(`ticket ${handle.ticket} → ${ticketAddress(config.landing, handle.ticket)}`);
  step(`IBAN: ${handle.iban}`);

  await confirmDemoTransfer(handle, "100");
  step("bank transfer simulated");

  const { pledged, delivered } = await waitForDeposit({
    keypair: user,
    campaignId: id,
    handle,
    triggerRelay: () => relayOnce({ landing, onEvent: (message) => step(`  relay: ${message}`) }),
    onStep: (name, detail) => step(`  ${name}${detail ? `: ${detail}` : ""}`),
  });

  step(`router dispatched ${fromStroops(delivered)} USDC, pledge on-chain: ${fromStroops(pledged)} USDC`);
  check(pledged > 0n, "the bank transfer never became a pledge");
}

/** The whole product without a UI: both outcomes of a campaign. */
async function fullStage(): Promise<void> {
  const landing = landingKeypair();
  const relay = () => relayOnce({ landing, onEvent: (message) => step(`  relay: ${message}`) });
  const succeed = argValue("--path") === "success";

  const organizer = Keypair.random();
  await fundWithFriendbot(organizer.publicKey());
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 240);
  const id = await createCampaign(organizer, {
    title: succeed ? "e2e success path" : "e2e refund path",
    // The refund path must miss its goal; the success path must reach it.
    goal: succeed ? 1n * USDC : 1000n * USDC,
    deadline,
    bonus: succeed ? 0n : 1n * USDC,
    cap: 4n * USDC,
  });
  step(`campaign ${id}, deadline in ${Number(deadline) - Math.floor(Date.now() / 1000)}s`);

  if (!succeed) {
    step("organizer locks the bonus by bank transfer");
    const funded = await fundBonus({
      keypair: organizer,
      campaignId: id,
      triggerRelay: relay,
      onStep: (name, detail) => step(`  ${name}${detail ? `: ${detail}` : ""}`),
    });
    check(funded.bonus_funded >= funded.bonus, "the bonus was not fully funded");
    step(`bonus locked: ${fromStroops(funded.bonus_funded)} USDC — the campaign is live`);
  }

  const participants = [Keypair.random(), Keypair.random()];
  for (const [index, participant] of participants.entries()) {
    const handle = await startJoin({ keypair: participant, campaignId: id, amountTry: "100" });
    await confirmDemoTransfer(handle, "100");
    const { pledged } = await waitForDeposit({
      keypair: participant,
      campaignId: id,
      handle,
      triggerRelay: relay,
    });
    step(`participant ${index + 1} pledged ${fromStroops(pledged)} USDC`);
  }

  const view = await campaignView(id);
  step(`total ${fromStroops(view!.total)} USDC from ${view!.pledgers} people (${view!.percent}%)`);

  step("waiting for the deadline");
  while (Math.floor(Date.now() / 1000) <= Number(deadline)) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  if (succeed) {
    const { usdc, tryAmount } = await withdrawProceedsToIban({
      keypair: organizer,
      campaignId: id,
      onStep: (name, detail) => step(`  ${name}${detail ? `: ${detail}` : ""}`),
    });
    step(`organizer cashed out ${fromStroops(usdc)} USDC → ${tryAmount} TRY`);
    check(tryAmount !== undefined, "the anchor never paid out the proceeds");
    check((await getCampaign(id))?.status === Status.Succeeded, "the campaign should have succeeded");
    return;
  }

  // Nobody signs for themselves: a third party refunds the whole room.
  const stranger = Keypair.random();
  await fundWithFriendbot(stranger.publicKey());
  const { refunded, total } = await refundAll({
    payer: stranger,
    campaignId: id,
    onProgress: (done, all, user) => step(`  refunded ${done}/${all}: ${user.slice(0, 8)}…`),
  });
  step(`refunded ${refunded} people, ${fromStroops(total)} USDC including the bonus`);
  check(refunded === participants.length, "not everyone was refunded");

  const first = participants[0]!;
  const paid = await quoteClaim(id, first.publicKey());
  check(paid === 0n, "a refunded pledge should no longer be claimable");
  const balance = await usdcBalance(first.publicKey());
  step(`participant 1 balance after the refund: ${fromStroops(balance)} USDC`);
  check(balance > 2n * USDC, "the refund should be the pledge plus a bonus share");

  const { usdc, tryAmount } = await claimAndWithdraw({
    keypair: first,
    campaignId: id,
    onStep: (name, detail) => step(`  ${name}${detail ? `: ${detail}` : ""}`),
  });
  step(`participant 1 cashed out ${fromStroops(usdc)} USDC → ${tryAmount} TRY`);
  check(tryAmount !== undefined, "the anchor never paid out to the participant");
}

const stages: Record<string, () => Promise<void>> = {
  anchor: anchorStage,
  chain: chainStage,
  relay: relayStage,
  full: fullStage,
};

const run = stages[stage];
check(run, `unknown stage "${stage}" (have: ${Object.keys(stages).join(", ")})`);
await run();
step("PASSED");
