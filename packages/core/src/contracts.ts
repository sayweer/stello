import { contract, Keypair } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";

import { config } from "./config.ts";

/**
 * Access to the router — and to your own contract.
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

/** Contract error codes, as the contracts define them. */
export const RouterError = { NotFound: 1, AlreadyPaid: 2, InvalidAmount: 3, TooLong: 4 } as const;

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

/**
 * Contract functions that return `Result` arrive wrapped; unwrapping turns a
 * contract error into a thrown one, which is what callers here expect.
 */
function unwrap<T>(value: any): T {
  return value && typeof value.unwrap === "function" ? (value.unwrap() as T) : (value as T);
}

/** Simulates a read-only call and returns its value. */
export async function readContract<T>(
  contractId: string,
  method: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return read<T>(client(contractId), method, args);
}

/** Signs, submits and waits for a state-changing call on any contract. */
export async function invokeContract<T>(
  contractId: string,
  signer: Keypair,
  method: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return send<T>(client(contractId, signer), method, args);
}

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
  arg: Uint8Array,
  /** Router deployment; defaults to the one in deployments/testnet.json. */
  routerId: string = config.routerId,
): Promise<bigint> {
  return send<bigint>(client(routerId, user), "open_ticket", {
    user: user.publicKey(),
    route,
    arg: Buffer.from(arg),
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
