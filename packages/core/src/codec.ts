import { Buffer } from "buffer";

/**
 * Identity of an off-chain payment, as the router stores it: the Horizon
 * operation id right-aligned in 32 bytes. Unique per payment, which is what
 * makes `dispatch` idempotent.
 */
export function paymentRef(operationId: string): Buffer {
  const ref = Buffer.alloc(32);
  ref.writeBigUInt64BE(BigInt(operationId), 24);
  return ref;
}
