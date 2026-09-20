import { nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import type { Keypair } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";

import { fromStroops } from "./amounts.ts";
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
import { config, soroban } from "./config.ts";
import { openTicket } from "./contracts.ts";
import { ticketAddress } from "./muxed.ts";

/**
 * The integration layer, as an app that is not Stello would use it.
 *
 * A Soroban app adds one function to its contract:
 *
 *     fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool
 *
 * registers a route on the router once, and then hands its users this client.
 * From here the user only ever sees an IBAN and a reference code: no wallet to
 * install, no seed phrase, no exchange. The contract gets called with the money
 * already in it.
 *
 * Nothing in this file knows what the receiving contract does. `arg` is opaque
 * bytes the app defines, and "did it land" is answered by the router's own
 * `Dispatched` event rather than by reading app state.
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

/** The anchor refuses to cash out less than this. */
export const MIN_WITHDRAW = 10_000_000n;

/** Everything the app needs to show the user, and to follow the payment. */
export interface DepositHandle {
  /** The ticket this payment is tied to; also the muxed id the anchor pays. */
  ticket: bigint;
  /** The anchor's order id, for polling its side. */
  depositId: string;
  /** Where the user sends the money, as the anchor phrased it. */
  iban?: string;
  reference?: string;
  /** What the lira are worth right now, fees included — indicative only. */
  estimatedUsdc?: string;
  /** Anchor session, reused by the rest of the flow. */
  token: string;
  /** Ledger the ticket was opened at: the floor for the event search. */
  fromLedger: number;
}

/** What the router did with the payment, read off the chain. */
export interface DispatchResult {
  ticket: bigint;
  amount: bigint;
  /** What `on_deposit` returned. False means the app refused and refunded. */
  accepted: boolean;
  paymentRef: Buffer;
}

export interface StelloOptions {
  /** The route id `register_route` gave you. */
  route: number;
  /** Router deployment to use. Defaults to the one in deployments/testnet.json. */
  router?: string;
  /**
   * Stello's hosted relay endpoint. When set, `waitForDeposit` nudges it so the
   * payment is dispatched right away instead of on the relay's next pass. Your
   * app never holds the landing account's key — the relay is Stello's job.
   */
  relayUrl?: string;
}

export class Stello {
  private readonly router: string;

  constructor(private readonly options: StelloOptions) {
    this.router = options.router ?? config.routerId;
  }

  /**
   * Brings a browser-generated key to the point where it can be paid: funded,
   * trustlined, and known to the anchor. Every step checks first, so this is
   * cheap to call on each page load.
   */
  async ensureReady(keypair: Keypair, onStep?: OnStep): Promise<string> {
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
   * Opens a ticket and asks the anchor where to pay it. `arg` is handed to your
   * contract untouched when the money lands — up to 64 bytes, and what it means
   * is entirely yours.
   */
  async requestDeposit({
    keypair,
    arg,
    amountTry,
    onStep,
  }: {
    keypair: Keypair;
    arg: Uint8Array;
    amountTry: string;
    onStep?: OnStep;
  }): Promise<DepositHandle> {
    if (arg.byteLength > 64) throw new Error("arg must be at most 64 bytes");
    const token = await this.ensureReady(keypair, onStep);

    onStep?.("ticket");
    // Recorded before the ticket exists, so the event search can never match a
    // dispatch that happened before this deposit.
    const fromLedger = (await soroban.getLatestLedger()).sequence;
    const ticket = await openTicket(keypair, this.options.route, Buffer.from(arg), this.router);

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
      fromLedger,
    };
  }

  /**
   * Sandbox only: stands in for the user walking to their banking app. On a
   * real anchor this step does not exist — the bank tells it.
   */
  async simulateBankTransfer(handle: DepositHandle, amountTry: string): Promise<void> {
    await simulateBankTransfer(handle.depositId, amountTry);
  }

  /**
   * Waits for the transfer to reach your contract: the anchor settles it, the
   * relay dispatches it, and `on_deposit` runs.
   *
   * `triggerRelay` nudges the relay — calling `relayOnce` in Node, or POSTing
   * to your /api/relay route in a browser. It is optional: a relay running on
   * its own loop picks the payment up anyway, this only makes it faster.
   */
  async waitForDeposit({
    handle,
    triggerRelay,
    onStep,
    timeoutMs = 120_000,
  }: {
    handle: DepositHandle;
    triggerRelay?: () => Promise<unknown>;
    onStep?: OnStep;
    timeoutMs?: number;
  }): Promise<DispatchResult> {
    onStep?.("waiting-transfer");
    await waitFor(handle.token, handle.depositId, ["completed"], {
      timeoutMs,
      onUpdate: (tx) => onStep?.("waiting-transfer", tx.status),
    });

    onStep?.("waiting-chain");
    const nudge =
      triggerRelay ??
      (this.options.relayUrl
        ? () => fetch(this.options.relayUrl!, { method: "POST" }).catch(() => undefined)
        : undefined);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await nudge?.();
      const dispatched = await this.findDispatch(handle);
      if (dispatched) return dispatched;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("havale geldi ama zincire yazılmadı");
  }

  /**
   * Reads the router's own record of this payment. This is what makes the
   * client app-agnostic: no app state is consulted, only the event the router
   * publishes for every dispatch.
   */
  async findDispatch(handle: {
    ticket: bigint;
    fromLedger: number;
  }): Promise<DispatchResult | null> {
    const events = await soroban.getEvents({
      startLedger: handle.fromLedger,
      filters: [
        {
          type: "contract",
          contractIds: [this.router],
          topics: [
            [
              nativeToScVal("dispatched", { type: "symbol" }).toXDR("base64"),
              nativeToScVal(handle.ticket, { type: "u64" }).toXDR("base64"),
            ],
          ],
        },
      ],
      limit: 10,
    });

    const event = events.events[0];
    if (!event) return null;

    const value = scValToNative(event.value) as {
      amount: bigint;
      accepted: boolean;
      payment_ref: Buffer;
    };
    return {
      ticket: handle.ticket,
      amount: value.amount,
      accepted: value.accepted,
      paymentRef: Buffer.from(value.payment_ref),
    };
  }

  /**
   * The way out: USDC sitting in the user's account becomes lira in the IBAN
   * their KYC is registered against. How the USDC got there is your contract's
   * business — a refund, a payout, a withdrawal.
   */
  async withdrawToIban({
    keypair,
    amount,
    onStep,
  }: {
    keypair: Keypair;
    /** Defaults to the whole balance. */
    amount?: bigint;
    onStep?: OnStep;
  }): Promise<{ usdc: bigint; tryAmount?: string }> {
    const balance = amount ?? (await usdcBalance(keypair.publicKey()));
    if (balance < MIN_WITHDRAW) {
      throw new Error(
        `kurum 1 USDC'den azını çekmiyor (bakiye ${fromStroops(balance)})`,
      );
    }

    const token = await login(keypair);
    onStep?.("withdrawing");
    const instructions = await withdraw(token, { amountUsdc: fromStroops(balance) });

    // The anchor's watcher only sees classic payments, never contract
    // transfers — so the way out is always a plain payment from the user.
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
}
