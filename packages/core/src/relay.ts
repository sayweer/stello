import type { Keypair } from "@stellar/stellar-sdk";

import { toStroops } from "./amounts.ts";
import { paymentRef } from "./codec.ts";
import { config, horizon } from "./config.ts";
import { contractErrorCode, dispatch, isPaid, RouterError } from "./contracts.ts";

/**
 * The relay: the one piece that cannot live on-chain.
 *
 * It watches the landing account, and for every USDC payment the anchor
 * delivered to a ticket's muxed address it calls `router.dispatch`. It keeps no
 * database — the contract's `Paid(payment_ref)` entry is the source of truth,
 * so running two relays, or restarting one mid-flight, is harmless.
 *
 * This is also the trust assumption to be honest about: for the few seconds
 * between the anchor's payment and the dispatch, the landing account holds the
 * money, and it is the relay that reports the amount. Everything after that is
 * enforced by the contracts.
 */

export interface Dispatched {
  operationId: string;
  ticket: bigint;
  amount: bigint;
  accepted: boolean;
}

export interface Skipped {
  operationId: string;
  reason: "already-paid" | "unknown-ticket" | "too-many-failures";
}

export interface RelayResult {
  dispatched: Dispatched[];
  skipped: Skipped[];
  failed: { operationId: string; error: string }[];
}

export interface RelayOptions {
  /** Signs the dispatch; must be the router's configured relayer. */
  landing: Keypair;
  /** How many recent payments to inspect. */
  limit?: number;
  /** Who the payment must come from. Defaults to the anchor's treasury. */
  source?: string;
  onEvent?: (message: string) => void;
}

/** Payments proven settled on-chain, so later passes skip them for free. */
const settled = new Set<string>();
/** Payments that keep failing — logged loudly rather than retried forever. */
const failures = new Map<string, number>();
const MAX_FAILURES = 3;

interface Candidate {
  operationId: string;
  ticket: bigint;
  amount: bigint;
}

function collect(records: any[], source: string): Candidate[] {
  return records
    .filter(
      (record) =>
        record.type === "payment" &&
        record.transaction_successful !== false &&
        record.asset_code === config.usdc.code &&
        record.asset_issuer === config.usdc.issuer &&
        record.from === source &&
        record.to === config.landing &&
        record.to_muxed_id &&
        // A redeploy restarts ticket numbering, so payments that predate the
        // current contracts must never be matched against a new ticket.
        record.created_at >= config.deployedAt,
    )
    .map((record) => ({
      operationId: String(record.id),
      ticket: BigInt(record.to_muxed_id),
      amount: toStroops(record.amount),
    }));
}

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /tx_bad_seq|TRY_AGAIN_LATER|timeout|429|502|503/i.test(message);
}

/**
 * One pass over the landing account. Returns what it did, so a script or an
 * API route can report it; safe to call as often as you like.
 */
export async function relayOnce(options: RelayOptions): Promise<RelayResult> {
  const { landing, limit = 50, source = config.treasury, onEvent } = options;
  const result: RelayResult = { dispatched: [], skipped: [], failed: [] };

  const page = await horizon
    .payments()
    .forAccount(config.landing)
    .order("desc")
    .limit(limit)
    .call();

  const candidates = collect(page.records, source);
  if (candidates.length === 0) return result;

  // Ask the chain once per unseen payment instead of sending doomed
  // transactions; the contract's AlreadyPaid is still the final word.
  const pending: Candidate[] = [];
  await Promise.all(
    candidates.map(async (candidate) => {
      if (settled.has(candidate.operationId)) return;
      if (await isPaid(paymentRef(candidate.operationId))) {
        settled.add(candidate.operationId);
        result.skipped.push({ operationId: candidate.operationId, reason: "already-paid" });
        return;
      }
      pending.push(candidate);
    }),
  );

  // Oldest first: the room sees pledges land in the order people paid.
  pending.sort((a, b) => (BigInt(a.operationId) < BigInt(b.operationId) ? -1 : 1));

  for (const candidate of pending) {
    if ((failures.get(candidate.operationId) ?? 0) >= MAX_FAILURES) {
      result.skipped.push({ operationId: candidate.operationId, reason: "too-many-failures" });
      continue;
    }

    try {
      const accepted = await dispatchWithRetry(landing, candidate, onEvent);
      settled.add(candidate.operationId);
      failures.delete(candidate.operationId);
      result.dispatched.push({ ...candidate, accepted });
      onEvent?.(
        `dispatched ticket ${candidate.ticket} (${candidate.amount} stroops, accepted=${accepted})`,
      );
    } catch (error) {
      const code = contractErrorCode(error);
      if (code === RouterError.AlreadyPaid) {
        settled.add(candidate.operationId);
        result.skipped.push({ operationId: candidate.operationId, reason: "already-paid" });
        continue;
      }
      if (code === RouterError.NotFound) {
        // Someone deposited to a muxed id that is not a ticket of this router.
        // The money sits in the landing account and needs a human.
        result.skipped.push({ operationId: candidate.operationId, reason: "unknown-ticket" });
        onEvent?.(`no ticket ${candidate.ticket} for payment ${candidate.operationId} — needs a manual refund`);
        continue;
      }

      const count = (failures.get(candidate.operationId) ?? 0) + 1;
      failures.set(candidate.operationId, count);
      const message = error instanceof Error ? error.message : String(error);
      result.failed.push({ operationId: candidate.operationId, error: message });
      onEvent?.(`dispatch failed (${count}/${MAX_FAILURES}) for ${candidate.operationId}: ${message}`);
    }
  }

  return result;
}

async function dispatchWithRetry(
  landing: Keypair,
  candidate: Candidate,
  onEvent?: (message: string) => void,
  attempts = 5,
): Promise<boolean> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await dispatch(landing, {
        ticket: candidate.ticket,
        amount: candidate.amount,
        paymentRef: paymentRef(candidate.operationId),
      });
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;
      onEvent?.(`retrying ${candidate.operationId} (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError;
}

/** Test seam: forget what this process learned about past payments. */
export function resetRelayState(): void {
  settled.clear();
  failures.clear();
}
