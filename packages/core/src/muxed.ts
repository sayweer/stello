import { Account, MuxedAccount } from "@stellar/stellar-sdk";

/**
 * The address a participant's bank transfer is paid into.
 *
 * A muxed account is one Stellar account with a 64-bit id attached: every
 * deposit lands in the same landing account, but Horizon reports which ticket
 * it belongs to. That id is what ties an off-chain transfer to a user, a route
 * and an argument — the whole trick behind "a bank transfer is a contract call".
 */
export function ticketAddress(landing: string, ticketId: bigint | number | string): string {
  return new MuxedAccount(new Account(landing, "0"), String(ticketId)).accountId();
}

/** Reads the ticket id back out of an `M...` address. */
export function ticketIdFromAddress(muxedAddress: string): string {
  return MuxedAccount.fromAddress(muxedAddress, "0").id();
}
