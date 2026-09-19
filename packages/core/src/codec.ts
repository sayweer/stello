/**
 * The two byte strings that travel between the client, the router and the
 * campaign contract.
 */

/** `arg` payload: `[kind u8][campaign id u64 big-endian]`. */
export const ARG_LENGTH = 9;
export const KIND_PLEDGE = 1;
export const KIND_BONUS = 2;

export type Kind = typeof KIND_PLEDGE | typeof KIND_BONUS;

export function encodeArg(kind: Kind, campaignId: bigint | number): Buffer {
  const arg = Buffer.alloc(ARG_LENGTH);
  arg.writeUInt8(kind, 0);
  arg.writeBigUInt64BE(BigInt(campaignId), 1);
  return arg;
}

export function decodeArg(arg: Uint8Array): { kind: number; campaignId: bigint } {
  if (arg.length !== ARG_LENGTH) {
    throw new Error(`arg must be ${ARG_LENGTH} bytes, got ${arg.length}`);
  }
  const buffer = Buffer.from(arg);
  return { kind: buffer.readUInt8(0), campaignId: buffer.readBigUInt64BE(1) };
}

/**
 * Identity of an off-chain payment, as the contract stores it: the Horizon
 * operation id right-aligned in 32 bytes. Unique per payment, which is what
 * makes `dispatch` idempotent.
 */
export function paymentRef(operationId: string): Buffer {
  const ref = Buffer.alloc(32);
  ref.writeBigUInt64BE(BigInt(operationId), 24);
  return ref;
}
