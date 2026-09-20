import { Networks, StellarToml, Transaction, WebAuth } from "@stellar/stellar-sdk";
import type { Keypair } from "@stellar/stellar-sdk";

import { config } from "./config.ts";

/**
 * SEP client for the anchor: discovery (SEP-1), authentication (SEP-10),
 * customer registration (SEP-12), deposits and withdrawals (SEP-6) and
 * indicative prices (SEP-38).
 *
 * Nothing about the anchor is hardcoded — every endpoint is read from its
 * stellar.toml, which is what lets the same code point at a real Turkish
 * anchor the day one exists.
 */

export class AnchorError extends Error {
  constructor(
    readonly status: number,
    readonly endpoint: string,
    readonly body: unknown,
  ) {
    super(`anchor ${endpoint} failed with ${status}: ${JSON.stringify(body)}`);
    this.name = "AnchorError";
  }
}

export interface AnchorEndpoints {
  webAuth: string;
  transferServer: string;
  kycServer: string;
  quoteServer?: string;
  signingKey: string;
}

export interface DepositInstructions {
  id: string;
  /** Where the participant sends the money, as the anchor phrased it. */
  iban?: string;
  reference?: string;
  raw: Record<string, unknown>;
}

export interface AnchorTransaction {
  id: string;
  status: string;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  stellar_transaction_id?: string;
  [key: string]: unknown;
}

export interface WithdrawInstructions {
  id: string;
  /** The anchor's treasury account the USDC must be sent to. */
  accountId: string;
  memo?: string;
  memoType?: string;
  raw: Record<string, unknown>;
}

let endpointsCache: AnchorEndpoints | undefined;
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function readJson(response: Response, endpoint: string): Promise<any> {
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!response.ok) throw new AnchorError(response.status, endpoint, body);
  return body;
}

/** SEP-1: read the anchor's stellar.toml. Cached for the process lifetime. */
export async function discover(domain = config.anchorDomain): Promise<AnchorEndpoints> {
  if (endpointsCache) return endpointsCache;

  const toml = await StellarToml.Resolver.resolve(domain);
  const required = {
    webAuth: toml.WEB_AUTH_ENDPOINT,
    transferServer: toml.TRANSFER_SERVER,
    kycServer: toml.KYC_SERVER,
    signingKey: toml.SIGNING_KEY,
  };
  for (const [name, value] of Object.entries(required)) {
    if (!value) throw new Error(`${domain} stellar.toml is missing ${name}`);
  }

  endpointsCache = {
    ...(required as AnchorEndpoints),
    quoteServer: toml.ANCHOR_QUOTE_SERVER,
  };
  return endpointsCache;
}

/**
 * SEP-10: exchange a signed challenge for a session token.
 *
 * The challenge is validated before signing — an anchor that asked us to sign
 * something else entirely would be caught here rather than by the user.
 */
export async function login(keypair: Keypair): Promise<string> {
  const cached = tokenCache.get(keypair.publicKey());
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const { webAuth, signingKey } = await discover();
  const account = keypair.publicKey();

  const challenge = await readJson(
    await fetch(`${webAuth}?account=${account}&home_domain=${config.anchorDomain}`),
    "GET /auth",
  );

  const { tx } = WebAuth.readChallengeTx(
    challenge.transaction,
    signingKey,
    challenge.network_passphrase ?? Networks.TESTNET,
    config.anchorDomain,
    new URL(webAuth).host,
  );
  (tx as Transaction).sign(keypair);

  const { token } = await readJson(
    await fetch(webAuth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: (tx as Transaction).toXDR() }),
    }),
    "POST /auth",
  );

  // Trust the token's own expiry rather than guessing a lifetime.
  const [, payload] = token.split(".");
  const expiresAt = payload
    ? JSON.parse(Buffer.from(payload, "base64").toString()).exp * 1000
    : Date.now() + 5 * 60_000;
  tokenCache.set(account, { token, expiresAt });
  return token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** SEP-12: register the customer. KYC is simulated on the mock anchor. */
export async function putCustomer(
  token: string,
  account: string,
  fields: Record<string, string> = {},
): Promise<void> {
  const { kycServer } = await discover();
  await readJson(
    await fetch(`${kycServer}/customer`, {
      method: "PUT",
      headers: { ...auth(token), "Content-Type": "application/json" },
      body: JSON.stringify({ account, ...fields }),
    }),
    "PUT /customer",
  );
}

/**
 * SEP-6 deposit. `amountTry` is in lira — the anchor quotes the USDC itself.
 * `account` may be a muxed `M...` address, which is how a deposit is tied to a
 * ticket.
 */
export async function deposit(
  token: string,
  { account, amountTry }: { account: string; amountTry: string },
): Promise<DepositInstructions> {
  const { transferServer } = await discover();
  const query = new URLSearchParams({
    asset_code: config.usdc.code,
    account,
    amount: amountTry,
    type: "bank_account",
    funding_method: "bank_account",
  });

  const body = await readJson(
    await fetch(`${transferServer}/deposit?${query}`, { headers: auth(token) }),
    "GET /deposit",
  );

  const instructions = (body.instructions ?? {}) as Record<string, { value?: string }>;
  return {
    id: body.id,
    iban: instructions.bank_number?.value ?? body.how,
    reference: instructions.bank_branch_number?.value ?? body.external_transaction_id,
    raw: body,
  };
}

/**
 * Sandbox only: pretends the participant walked to their banking app and sent
 * the money. A real anchor learns this from its bank.
 */
export async function simulateBankTransfer(id: string, amountTry: string): Promise<void> {
  const { transferServer } = await discover();
  await readJson(
    await fetch(`${transferServer}/tx/${id}/simulate-bank-transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountTry }),
    }),
    "POST /simulate-bank-transfer",
  );
}

export async function transaction(token: string, id: string): Promise<AnchorTransaction> {
  const { transferServer } = await discover();
  const body = await readJson(
    await fetch(`${transferServer}/transaction?id=${id}`, { headers: auth(token) }),
    "GET /transaction",
  );
  return body.transaction;
}

/** Polls until the anchor reports one of `statuses`, or gives up. */
export async function waitFor(
  token: string,
  id: string,
  statuses: string[],
  options: { timeoutMs?: number; onUpdate?: (tx: AnchorTransaction) => void } = {},
): Promise<AnchorTransaction> {
  const { timeoutMs = 120_000, onUpdate } = options;
  const deadline = Date.now() + timeoutMs;
  let last = "";

  while (Date.now() < deadline) {
    const tx = await transaction(token, id);
    if (tx.status !== last) {
      last = tx.status;
      onUpdate?.(tx);
    }
    if (statuses.includes(tx.status)) return tx;
    if (tx.status === "error" || tx.status === "refunded") {
      throw new Error(`anchor transaction ${id} ended as ${tx.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`anchor transaction ${id} stayed in "${last}" for ${timeoutMs}ms`);
}

/**
 * SEP-6 withdrawal: the anchor names the account and memo to send USDC to, and
 * pays out lira to the customer's registered IBAN.
 */
export async function withdraw(
  token: string,
  { amountUsdc }: { amountUsdc: string },
): Promise<WithdrawInstructions> {
  const { transferServer } = await discover();
  const query = new URLSearchParams({
    asset_code: config.usdc.code,
    type: "bank_account",
    funding_method: "bank_account",
    amount: amountUsdc,
  });

  const body = await readJson(
    await fetch(`${transferServer}/withdraw?${query}`, { headers: auth(token) }),
    "GET /withdraw",
  );
  return {
    id: body.id,
    accountId: body.account_id,
    memo: body.memo,
    memoType: body.memo_type,
    raw: body,
  };
}

/** SEP-38: what a lira amount is worth in USDC right now, fees included. */
export async function price(amountTry: string): Promise<{ usdc: string; rate: string } | null> {
  const { quoteServer } = await discover();
  if (!quoteServer) return null;

  const query = new URLSearchParams({
    sell_asset: "iso4217:TRY",
    sell_amount: amountTry,
    buy_asset: `stellar:${config.usdc.code}:${config.usdc.issuer}`,
  });
  const body = await readJson(
    await fetch(`${quoteServer}/prices?${query}`, {}),
    "GET /prices",
  );

  const quote = body.buy_assets?.[0];
  return quote ? { usdc: quote.amount, rate: quote.price } : null;
}
