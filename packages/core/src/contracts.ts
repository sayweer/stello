import { contract, Keypair } from "@stellar/stellar-sdk";

import { config } from "./config.ts";

/**
 * Typed access to the two contracts.
 *
 * `contract.Client.from` reads each contract's interface off the network, so
 * arguments and return values cross the boundary as plain JavaScript values —
 * no hand-built ScVals, no generated bindings to keep in sync.
 */

export interface Route {
  owner: string;
  target: string;
  name: string;
}

export interface Ticket {
  route: number;
  user: string;
  arg: Buffer;
}

/** A unit enum crosses the boundary as its u32 discriminant. */
export const Status = { Open: 0, Succeeded: 1, Failed: 2 } as const;
export type Status = (typeof Status)[keyof typeof Status];

export function statusName(status: Status): "Open" | "Succeeded" | "Failed" {
  return (["Open", "Succeeded", "Failed"] as const)[status] ?? "Open";
}

export interface Campaign {
  organizer: string;
  title: string;
  goal: bigint;
  deadline: bigint;
  bonus: bigint;
  bonus_funded: bigint;
  cap: bigint;
  total: bigint;
  weight_sum: bigint;
  pledgers: number;
  status: Status;
  proceeds_taken: boolean;
  bonus_reclaimed: boolean;
}

export interface Pledge {
  amount: bigint;
  claimed: boolean;
}

/** Contract error codes, as the contracts define them. */
export const RouterError = { NotFound: 1, AlreadyPaid: 2, InvalidAmount: 3, TooLong: 4 } as const;
export const CampaignError = {
  NotFound: 1,
  BadState: 2,
  TooEarly: 3,
  AlreadyClaimed: 4,
  InvalidParam: 5,
} as const;

/** Reads the `Error(Contract, #N)` code out of whatever the SDK threw. */
export function contractErrorCode(error: unknown): number | undefined {
  const message = error instanceof Error ? error.message : String(error);
  const match = /Error\(Contract, #(\d+)\)/.exec(message);
  return match?.[1] ? Number(match[1]) : undefined;
}

const clients = new Map<string, Promise<any>>();

function client(contractId: string, signer?: Keypair): Promise<any> {
  const key = `${contractId}:${signer?.publicKey() ?? "read-only"}`;
  let cached = clients.get(key);
  if (!cached) {
    cached = contract.Client.from({
      contractId,
      rpcUrl: config.rpcUrl,
      networkPassphrase: config.passphrase,
      allowHttp: config.rpcUrl.startsWith("http://"),
      ...(signer
        ? {
            publicKey: signer.publicKey(),
            ...contract.basicNodeSigner(signer, config.passphrase),
          }
        : {}),
    });
    clients.set(key, cached);
  }
  return cached;
}

const router = (signer?: Keypair) => client(config.routerId, signer);
const campaign = (signer?: Keypair) => client(config.campaignId, signer);

/**
 * Contract functions that return `Result` arrive wrapped; unwrapping turns a
 * contract error into a thrown one, which is what callers here expect.
 */
function unwrap<T>(value: any): T {
  return value && typeof value.unwrap === "function" ? (value.unwrap() as T) : (value as T);
}

/** Simulates a read-only call and returns its value. */
async function read<T>(target: Promise<any>, method: string, ...args: unknown[]): Promise<T> {
  const instance = await target;
  const tx = await instance[method](...args);
  return unwrap<T>(tx.result);
}

/** Signs, submits and waits for a state-changing call. */
async function send<T>(target: Promise<any>, method: string, ...args: unknown[]): Promise<T> {
  const instance = await target;
  const tx = await instance[method](...args);
  const sent = await tx.signAndSend();
  return unwrap<T>(sent.result);
}

// --- router ---

export async function openTicket(
  user: Keypair,
  route: number,
  arg: Buffer,
): Promise<bigint> {
  return send<bigint>(router(user), "open_ticket", {
    user: user.publicKey(),
    route,
    arg,
  });
}

export async function dispatch(
  relayer: Keypair,
  { ticket, amount, paymentRef }: { ticket: bigint; amount: bigint; paymentRef: Buffer },
): Promise<boolean> {
  return send<boolean>(router(relayer), "dispatch", {
    ticket,
    amount,
    payment_ref: paymentRef,
  });
}

export async function isPaid(paymentRef: Buffer): Promise<boolean> {
  return read<boolean>(router(), "is_paid", { payment_ref: paymentRef });
}

export async function getTicket(ticket: bigint): Promise<Ticket | undefined> {
  return read<Ticket | undefined>(router(), "get_ticket", { ticket });
}

export async function getRoute(route: number): Promise<Route | undefined> {
  return read<Route | undefined>(router(), "get_route", { route });
}

// --- campaign ---

export async function createCampaign(
  organizer: Keypair,
  params: {
    title: string;
    goal: bigint;
    deadline: bigint;
    bonus: bigint;
    cap: bigint;
  },
): Promise<bigint> {
  return send<bigint>(campaign(organizer), "create", {
    organizer: organizer.publicKey(),
    ...params,
  });
}

export async function getCampaign(id: bigint): Promise<Campaign | undefined> {
  return read<Campaign | undefined>(campaign(), "get_campaign", { campaign: id });
}

export async function getPledge(id: bigint, user: string): Promise<Pledge | undefined> {
  return read<Pledge | undefined>(campaign(), "get_pledge", { campaign: id, user });
}

export async function quoteClaim(id: bigint, user: string): Promise<bigint> {
  return read<bigint>(campaign(), "quote_claim", { campaign: id, user });
}

export async function campaignCount(): Promise<bigint> {
  return read<bigint>(campaign(), "count");
}

export async function pledgerAt(id: bigint, index: number): Promise<string | undefined> {
  return read<string | undefined>(campaign(), "pledger_at", { campaign: id, index });
}

export async function settle(payer: Keypair, id: bigint): Promise<Status> {
  return send<Status>(campaign(payer), "settle", { campaign: id });
}

/** Permissionless: `payer` covers the fee, `user` receives the money. */
export async function claim(payer: Keypair, id: bigint, user: string): Promise<bigint> {
  return send<bigint>(campaign(payer), "claim", { campaign: id, user });
}

export async function withdrawProceeds(organizer: Keypair, id: bigint): Promise<bigint> {
  return send<bigint>(campaign(organizer), "withdraw_proceeds", { campaign: id });
}

export async function reclaimBonus(organizer: Keypair, id: bigint): Promise<bigint> {
  return send<bigint>(campaign(organizer), "reclaim_bonus", { campaign: id });
}
