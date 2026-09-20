import type { Keypair } from "@stellar/stellar-sdk";

import { fromStroops, toStroops } from "./amounts.ts";
import {
  accountExists,
  addTrustline,
  fundWithFriendbot,
  hasTrustline,
  payClassic,
  usdcBalance,
} from "./account.ts";
import {
  deposit,
  login,
  price,
  putCustomer,
  simulateBankTransfer,
  waitFor,
  withdraw,
} from "./anchor.ts";
import { encodeArg, KIND_BONUS, KIND_PLEDGE } from "./codec.ts";
import { config } from "./config.ts";
import {
  campaignCount,
  claim,
  getCampaign,
  getPledge,
  openTicket,
  pledgerAt,
  quoteClaim,
  Status,
  withdrawProceeds,
  type Campaign,
} from "./contracts.ts";
import { ticketAddress } from "./muxed.ts";

/**
 * The whole product, as functions a user interface can call.
 *
 * Nothing here touches React or the DOM, and nothing above here touches
 * stellar-sdk: the UI decides how a step looks, these functions decide what a
 * step means. Every flow re-checks state before acting, so an interrupted one
 * can simply be called again.
 */

export type StepName =
  | "account"
  | "trustline"
  | "signin"
  | "customer"
  | "ticket"
  | "deposit"
  | "waiting-transfer"
  | "waiting-chain"
  | "settled"
  | "claimed"
  | "withdrawing"
  | "paid-out";

export type OnStep = (step: StepName, detail?: string) => void;

/** Fee the organizer pays on top of the bonus, in stroops. */
const MIN_WITHDRAW = 10_000_000n; // the anchor refuses less than 1 USDC

export interface JoinHandle {
  ticket: bigint;
  depositId: string;
  /** Where the participant sends the money. */
  iban?: string;
  reference?: string;
  estimatedUsdc?: string;
  token: string;
}

/**
 * Gets a browser-generated key to the point where it can send and receive:
 * funded, trustlined and known to the anchor. Each step is skipped if it is
 * already done, so this is cheap to call on every page load.
 */
export async function ensureReady(keypair: Keypair, onStep?: OnStep): Promise<string> {
  const account = keypair.publicKey();

  if (!(await accountExists(account))) {
    onStep?.("account");
    await fundWithFriendbot(account);
  }
  if (!(await hasTrustline(account))) {
    onStep?.("trustline");
    await addTrustline(keypair);
  }

  onStep?.("signin");
  const token = await login(keypair);
  onStep?.("customer");
  await putCustomer(token, account);
  return token;
}

/**
 * Opens a ticket and asks the anchor for payment instructions. What comes back
 * is what the participant sees: an IBAN and a reference code.
 */
export async function startJoin({
  keypair,
  campaignId,
  amountTry,
  kind = KIND_PLEDGE,
  onStep,
}: {
  keypair: Keypair;
  campaignId: bigint;
  amountTry: string;
  kind?: typeof KIND_PLEDGE | typeof KIND_BONUS;
  onStep?: OnStep;
}): Promise<JoinHandle> {
  const token = await ensureReady(keypair, onStep);

  onStep?.("ticket");
  const ticket = await openTicket(keypair, config.routeId, encodeArg(kind, campaignId));

  onStep?.("deposit");
  const instructions = await deposit(token, {
    account: ticketAddress(config.landing, ticket),
    amountTry,
  });
  const quote = await price(amountTry).catch(() => null);

  return {
    ticket,
    depositId: instructions.id,
    iban: instructions.iban,
    reference: instructions.reference,
    estimatedUsdc: quote?.usdc,
    token,
  };
}

/** Demo only: stands in for the participant's banking app. */
export async function confirmDemoTransfer(handle: JoinHandle, amountTry: string): Promise<void> {
  await simulateBankTransfer(handle.depositId, amountTry);
}

/**
 * Waits for the bank transfer to become an on-chain pledge: the anchor settles,
 * the relay dispatches, the campaign records it.
 *
 * `triggerRelay` is how the caller nudges the relay — calling `relayOnce`
 * directly in Node, or POSTing to /api/relay in the browser.
 */
export async function waitForDeposit({
  keypair,
  campaignId,
  handle,
  triggerRelay,
  onStep,
  timeoutMs = 120_000,
}: {
  keypair: Keypair;
  campaignId: bigint;
  handle: JoinHandle;
  triggerRelay?: () => Promise<unknown>;
  onStep?: OnStep;
  timeoutMs?: number;
}): Promise<{ pledged: bigint; delivered: string | undefined }> {
  onStep?.("waiting-transfer");
  const settledTx = await waitFor(handle.token, handle.depositId, ["completed"], {
    timeoutMs,
    onUpdate: (tx) => onStep?.("waiting-transfer", tx.status),
  });

  onStep?.("waiting-chain");
  const before = (await getPledge(campaignId, keypair.publicKey()))?.amount ?? 0n;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await triggerRelay?.();
    const pledge = await getPledge(campaignId, keypair.publicKey());
    if (pledge && pledge.amount > before) {
      return { pledged: pledge.amount, delivered: settledTx.amount_out };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("the transfer arrived but never became a pledge");
}

/** Organizer flow: lock the bonus that makes the promise credible. */
export async function fundBonus({
  keypair,
  campaignId,
  onStep,
  triggerRelay,
}: {
  keypair: Keypair;
  campaignId: bigint;
  onStep?: OnStep;
  triggerRelay?: () => Promise<unknown>;
}): Promise<Campaign> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`campaign ${campaignId} does not exist`);

  const missing = campaign.bonus - campaign.bonus_funded;
  if (missing <= 0n) return campaign;

  // Ask for slightly more lira than the shortfall so the anchor's fee does not
  // leave the bonus a few stroops short; the contract refunds any excess.
  const quote = await price("100").catch(() => null);
  const perTry = quote ? Number(toStroops(quote.usdc)) / 100 : 0;
  const amountTry = perTry > 0 ? Math.ceil((Number(missing) / perTry) * 1.01).toString() : "100";

  const handle = await startJoin({
    keypair,
    campaignId,
    amountTry,
    kind: KIND_BONUS,
    onStep,
  });
  await confirmDemoTransfer(handle, amountTry);
  await waitForDeposit({ keypair, campaignId, handle, triggerRelay, onStep });

  const updated = await getCampaign(campaignId);
  return updated!;
}

/**
 * The refund path end to end: settle if needed, claim (no signature required),
 * then cash out to the participant's IBAN.
 */
export async function claimAndWithdraw({
  keypair,
  campaignId,
  onStep,
}: {
  keypair: Keypair;
  campaignId: bigint;
  onStep?: OnStep;
}): Promise<{ usdc: bigint; tryAmount?: string }> {
  const account = keypair.publicKey();
  const pledge = await getPledge(campaignId, account);

  if (pledge && !pledge.claimed) {
    onStep?.("claimed");
    await claim(keypair, campaignId, account);
  }

  const balance = await usdcBalance(account);
  if (balance < MIN_WITHDRAW) {
    throw new Error(
      `the anchor will not cash out less than 1 USDC (balance ${fromStroops(balance)})`,
    );
  }

  const token = await login(keypair);
  onStep?.("withdrawing");
  const instructions = await withdraw(token, { amountUsdc: fromStroops(balance) });
  await payClassic(keypair, {
    destination: instructions.accountId,
    amount: balance,
    memo: instructions.memo,
  });

  const done = await waitFor(token, instructions.id, ["completed"], {
    onUpdate: (tx) => onStep?.("withdrawing", tx.status),
  });
  onStep?.("paid-out");
  return { usdc: balance, tryAmount: done.amount_out };
}

/** Organizer's success path: take the proceeds and cash them out. */
export async function withdrawProceedsToIban({
  keypair,
  campaignId,
  onStep,
}: {
  keypair: Keypair;
  campaignId: bigint;
  onStep?: OnStep;
}): Promise<{ usdc: bigint; tryAmount?: string }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`campaign ${campaignId} does not exist`);
  if (!campaign.proceeds_taken) {
    onStep?.("settled");
    await withdrawProceeds(keypair, campaignId);
  }

  const balance = await usdcBalance(keypair.publicKey());
  const token = await login(keypair);
  onStep?.("withdrawing");
  const instructions = await withdraw(token, { amountUsdc: fromStroops(balance) });
  await payClassic(keypair, {
    destination: instructions.accountId,
    amount: balance,
    memo: instructions.memo,
  });
  const done = await waitFor(token, instructions.id, ["completed"], {
    onUpdate: (tx) => onStep?.("withdrawing", tx.status),
  });
  onStep?.("paid-out");
  return { usdc: balance, tryAmount: done.amount_out };
}

/**
 * Refunds everyone who pledged, in one go. This is what makes "if it does not
 * happen, your money comes back by itself" literally true: claim needs no
 * signature from the pledger, and always pays the pledger.
 */
export async function refundAll({
  payer,
  campaignId,
  onProgress,
}: {
  payer: Keypair;
  campaignId: bigint;
  onProgress?: (done: number, total: number, user: string) => void;
}): Promise<{ refunded: number; total: bigint }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`campaign ${campaignId} does not exist`);

  let refunded = 0;
  let total = 0n;
  for (let index = 0; index < campaign.pledgers; index++) {
    const user = await pledgerAt(campaignId, index);
    if (!user) continue;

    const pledge = await getPledge(campaignId, user);
    if (!pledge || pledge.claimed) continue;

    total += await claim(payer, campaignId, user);
    refunded++;
    onProgress?.(refunded, campaign.pledgers, user);
  }
  return { refunded, total };
}

// --- views ---

export interface CampaignView {
  id: bigint;
  title: string;
  organizer: string;
  goal: bigint;
  total: bigint;
  percent: number;
  pledgers: number;
  bonus: bigint;
  bonusFunded: bigint;
  cap: bigint;
  live: boolean;
  status: Status;
  deadline: number;
  secondsLeft: number;
  mine?: { pledged: bigint; claimed: boolean; claimable: bigint };
}

export async function campaignView(id: bigint, user?: string): Promise<CampaignView | null> {
  const campaign = await getCampaign(id);
  if (!campaign) return null;

  const deadline = Number(campaign.deadline);
  const view: CampaignView = {
    id,
    title: campaign.title,
    organizer: campaign.organizer,
    goal: campaign.goal,
    total: campaign.total,
    percent: campaign.goal > 0n ? Number((campaign.total * 100n) / campaign.goal) : 0,
    pledgers: campaign.pledgers,
    bonus: campaign.bonus,
    bonusFunded: campaign.bonus_funded,
    cap: campaign.cap,
    live: campaign.bonus_funded >= campaign.bonus,
    status: campaign.status,
    deadline,
    secondsLeft: Math.max(0, deadline - Math.floor(Date.now() / 1000)),
  };

  if (user) {
    const pledge = await getPledge(id, user);
    if (pledge) {
      view.mine = {
        pledged: pledge.amount,
        claimed: pledge.claimed,
        claimable: pledge.claimed ? 0n : await quoteClaim(id, user),
      };
    }
  }
  return view;
}

export async function listCampaigns(): Promise<CampaignView[]> {
  const count = await campaignCount();
  const views = await Promise.all(
    Array.from({ length: Number(count) }, (_, index) => campaignView(BigInt(index + 1))),
  );
  return views.filter((view): view is CampaignView => view !== null).reverse();
}
