import {
  BASE_FEE,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import { fromStroops, toStroops } from "./amounts.ts";
import { config, horizon, usdc } from "./config.ts";

/**
 * Classic-account plumbing the participant never sees: a key is created in
 * their browser, funded, and given a USDC trustline so the anchor can pay it.
 */

export function newKeypair(): Keypair {
  return Keypair.random();
}

export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await horizon.loadAccount(publicKey);
    return true;
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 404) return false;
    throw error;
  }
}

/** Testnet only. On mainnet this is where sponsored reserves would go. */
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const response = await fetch(`${config.friendbotUrl}/?addr=${publicKey}`);
  if (!response.ok && !(await accountExists(publicKey))) {
    throw new Error(`friendbot refused to fund ${publicKey}: ${response.status}`);
  }
}

export async function hasTrustline(publicKey: string): Promise<boolean> {
  const account = await horizon.loadAccount(publicKey);
  return account.balances.some(
    (balance) =>
      "asset_code" in balance &&
      balance.asset_code === usdc.getCode() &&
      balance.asset_issuer === usdc.getIssuer(),
  );
}

export async function addTrustline(keypair: Keypair): Promise<string> {
  const account = await horizon.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.passphrase,
  })
    .addOperation(Operation.changeTrust({ asset: usdc }))
    .setTimeout(60)
    .build();

  tx.sign(keypair);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

export async function usdcBalance(publicKey: string): Promise<bigint> {
  const account = await horizon.loadAccount(publicKey);
  const balance = account.balances.find(
    (entry) =>
      "asset_code" in entry &&
      entry.asset_code === usdc.getCode() &&
      entry.asset_issuer === usdc.getIssuer(),
  );
  return balance ? toStroops(balance.balance) : 0n;
}

/**
 * A plain classic payment. Withdrawals must go out this way: the anchor's
 * watcher only sees classic payment operations, not contract transfers.
 */
export async function payClassic(
  keypair: Keypair,
  { destination, amount, memo }: { destination: string; amount: bigint; memo?: string },
): Promise<string> {
  const account = await horizon.loadAccount(keypair.publicKey());
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.passphrase,
  })
    .addOperation(
      Operation.payment({ destination, asset: usdc, amount: fromStroops(amount) }),
    )
    .setTimeout(60);

  if (memo) builder.addMemo(Memo.id(memo));

  const tx = builder.build();
  tx.sign(keypair);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}
