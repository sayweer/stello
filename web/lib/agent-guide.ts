import { deployment, example } from "./site";

/**
 * Everything a coding agent needs to wire Stello into someone else's project,
 * generated from the same deployment record the site and the SDK read. An
 * address can never drift between the docs, the package and this file.
 *
 * Written for a reader that will act on it rather than skim it: every rule that
 * an agent would otherwise get wrong is stated as a rule, with the consequence
 * attached. The security-critical one is `router.require_auth()`.
 */

const VERSION = "0.1.0";

export const agentFacts = {
  version: VERSION,
  router: deployment.routerId,
  landing: deployment.landing,
  usdc: deployment.usdc.sac,
  network: deployment.network,
  anchor: deployment.anchorDomain,
  exampleTarget: example.targetId,
  exampleRoute: example.routeId,
};

/** The short index, in the shape agents and crawlers expect at /llms.txt. */
export function llmsTxt(origin: string): string {
  return `# Stello

> A bank transfer is a contract call. Stello lets people without a crypto wallet use a
> Soroban contract on Stellar: they send an ordinary bank transfer, and the contract is
> called with the money already in it. Integration is one contract function, one route
> registration, and one npm package.

Status: testnet preview (${agentFacts.network}), mock Turkish anchor, simulated bank transfers and KYC.
SDK version: ${VERSION}. License: MIT.

## For coding agents

- [Full integration guide](${origin}/llms-full.txt): everything below in one file — contract
  interface, route registration, SDK usage, and the rules that are easy to get wrong.
- [Claude Code skill](${origin}/stello-skill.md): save as .claude/skills/stello-integration/SKILL.md
- [AGENTS.md snippet](${origin}/agents-snippet.md): paste into AGENTS.md for Cursor or Codex

## Docs

- [What Stello is](${origin}/docs): the payment path, who owns which piece, the trust model
- [Installation](${origin}/docs/installation): package, key handling, first payment end to end
- [Contract and route](${origin}/docs/contracts): the on_deposit interface and route registration
- [SDK reference](${origin}/docs/sdk): the Stello class and the helpers around it
- [Relay](${origin}/docs/relay): what the relay does, why it is trusted, origin allow-lists
- [Integrating with an agent](${origin}/docs/agents): these files, and how to point a coding agent at them
- [Example app](${origin}/docs/example): the piggy bank contract and the separate campaign app
- [Publishing](${origin}/docs/publishing): building the archive and releasing to npm

## On chain (${agentFacts.network})

- Router: ${agentFacts.router}
- Landing account: ${agentFacts.landing}
- USDC (SAC): ${agentFacts.usdc}
- Example target (piggy bank), route ${agentFacts.exampleRoute}: ${agentFacts.exampleTarget}

## Source

- [GitHub](https://github.com/sayweer/stello): router contract, SDK, example target
`;
}

/** The complete guide: enough to perform the integration without other pages. */
export function llmsFullTxt(origin: string): string {
  return `# Stello — integration guide for coding agents

A bank transfer is a contract call. Stello lets people who have no crypto wallet use a
Soroban contract: they send an ordinary bank transfer, and the contract is called with the
money already in it. When they are owed something, it goes back to their IBAN.

This file is the whole integration. If you are an agent acting on a user's repository, you
can complete it from here alone.

Version: ${VERSION} · Network: ${agentFacts.network} · Anchor: ${agentFacts.anchor} (mock)
Docs: ${origin}/docs · Source: https://github.com/sayweer/stello · License: MIT

## When this applies

Use Stello when the user wants people to pay into their Soroban contract with a bank
transfer instead of a crypto wallet — crowdfunding, deposits, subscriptions, top-ups,
ticket sales. Do NOT reach for it when the users already hold wallets and pay on-chain
directly; it adds an anchor and a relay you would not otherwise need.

## What it is not, today

- Testnet only, against a mock Turkish anchor. Bank transfers and KYC are simulated.
- The package embeds this one deployment. It is not a configurable mainnet on-ramp.
- The relay is a trusted party (see "Trust", below). Say so to the user; do not present
  Stello as trustless.

## The shape of the integration

    bank app --TRY--> anchor --USDC--> landing account --> router.dispatch
                                                            |
                                                            +--> your_contract.on_deposit(user, amount, arg)

Three steps: one contract function, one route registration, one package.

## Step 1 — the contract function

Add this to the user's Soroban contract. Store the router and token addresses at
construction; \`on_deposit\` needs both.

    #![no_std]
    use soroban_sdk::{contract, contractimpl, contracttype, token::TokenClient,
                      Address, Bytes, Env};

    #[contracttype]
    #[derive(Clone)]
    pub enum DataKey { Router, Token, Balance(Address) }

    #[contract]
    pub struct MyApp;

    #[contractimpl]
    impl MyApp {
        pub fn __constructor(env: Env, router: Address, token: Address) {
            env.storage().instance().set(&DataKey::Router, &router);
            env.storage().instance().set(&DataKey::Token, &token);
        }

        pub fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool {
            // MANDATORY. Without it, anyone can call on_deposit and be credited
            // for a transfer that never happened.
            let router: Address = env.storage().instance().get(&DataKey::Router).unwrap();
            router.require_auth();

            // The tokens are already in this contract. Do the app's work here.
            let key = DataKey::Balance(user.clone());
            let balance: i128 = env.storage().persistent().get(&key).unwrap_or(0) + amount;
            env.storage().persistent().set(&key, &balance);
            true
        }
    }

RULES — each one has bitten someone:

1. \`router.require_auth()\` is not optional. It is the only thing separating a real
   deposit from a forged one. Never generate \`on_deposit\` without it.
2. \`arg\` is at most 64 bytes, defined entirely by the app. The router does not read it.
3. Return \`true\` when the deposit was taken. Return \`false\` ONLY if the contract has
   already refunded \`user\` itself — the router does not refund on your behalf.
4. Panicking rolls the whole dispatch back: the token transfer is undone and the money
   stays in the landing account for the relay to retry. Use this for "impossible" states,
   not for ordinary refusals.
5. \`amount\` is i128 in the token's smallest unit. USDC has 7 decimals, so 1 USDC is
   10_000_000.
6. The tokens arrive BEFORE \`on_deposit\` runs. Do not try to pull them in.

A complete, tested contract to copy:
https://github.com/sayweer/stello/tree/main/contracts/example-target

## Step 2 — register a route, once

Deploy the target contract with the router address and the USDC token address, then
register it. Registration is permissionless — nobody approves it.

    stellar contract deploy \\
      --wasm target/wasm32v1-none/release/my_app.wasm \\
      --source-account YOUR_IDENTITY --network ${agentFacts.network} \\
      -- --router ${agentFacts.router} \\
         --token ${agentFacts.usdc}

    stellar contract invoke \\
      --id ${agentFacts.router} \\
      --source-account YOUR_IDENTITY --network ${agentFacts.network} \\
      -- register_route \\
      --owner YOUR_G_ADDRESS \\
      --target YOUR_CONTRACT_C_ADDRESS \\
      --name "My app"

The call prints a route id. Keep it; the client needs it. Registering twice creates a
second route pointing at the same contract — register once and store the number.

## Step 3 — the client

The package is not on npm yet. Build an archive from the Stello repository and install it
from the app's vendor directory:

    git clone https://github.com/sayweer/stello.git && cd stello
    pnpm install && pnpm sdk:pack      # -> artifacts/stello-sdk-${VERSION}.tgz

    # in the user's app
    pnpm add ./vendor/stello-sdk-${VERSION}.tgz @stellar/stellar-sdk

After the npm release the equivalent is \`pnpm add stello-sdk @stellar/stellar-sdk\`. That
command does not work before publication — do not write it into a user's package.json yet.

    import { Keypair } from "@stellar/stellar-sdk";
    import { Stello, fromStroops } from "stello-sdk";

    const stello = new Stello({
      route: YOUR_ROUTE_ID,
      relayUrl: "https://YOUR_STELLO_HOST/api/relay", // optional
    });

    // Persist this key. Do NOT call Keypair.random() on every render.
    const keypair = loadOrCreateKeypair();

    const payment = await stello.requestDeposit({
      keypair,
      amountTry: "250",              // lira, as a string
      arg: new Uint8Array([1]),      // your bytes, <= 64
      onStep: (step, detail) => console.log(step, detail),
    });
    // Show payment.iban and payment.reference to the user.

    const result = await stello.waitForDeposit({ handle: payment });
    // result: { ticket, amount, accepted, paymentRef }
    if (!result.accepted) {
      // The contract refused and refunded. Tell the user why in your own words.
    }

    // Later, after your contract has paid the user back in USDC:
    const payout = await stello.withdrawToIban({ keypair });
    console.log(fromStroops(payout.usdc), payout.tryAmount);

RULES:

1. Persist the keypair (localStorage, secure storage, your own backend). The SDK does not
   store it. A regenerated key loses the user's account and money.
2. \`amountTry\` is a string in lira. \`result.amount\` is a bigint in stroops — render it
   with \`fromStroops\`, never with Number().
3. In a browser use \`Uint8Array\` for \`arg\`. Do not add a Buffer polyfill for this.
4. Run the interactive flow in a client component or a user event, not during render or
   server rendering.
5. \`relayUrl\` is optional: it only makes the payment land sooner. If a relay loop is
   running, the payment lands anyway.
6. Never import \`stello-sdk/server\` into client code. It holds the relay, which needs the
   landing account's secret key.

## API surface

    new Stello({ route, router?, relayUrl? })
      ensureReady(keypair, onStep?)                 -> anchor session token
      requestDeposit({ keypair, arg, amountTry, onStep? }) -> DepositHandle
      waitForDeposit({ handle, triggerRelay?, onStep?, timeoutMs? }) -> DispatchResult
      findDispatch({ ticket, fromLedger })          -> DispatchResult | null
      withdrawToIban({ keypair, amount?, onStep? }) -> { usdc, tryAmount }
      simulateBankTransfer(handle, amountTry)       -> void   (mock anchor only)

    DepositHandle  { ticket, depositId, iban?, reference?, estimatedUsdc?, token, fromLedger }
    DispatchResult { ticket, amount, accepted, paymentRef }

    readContract<T>(contractId, method, args?)              -> T
    invokeContract<T>(contractId, keypair, method, args?)   -> T
    toStroops(string) -> bigint      fromStroops(bigint) -> string
    ticketAddress(landing, ticketId) -> muxed M... address
    config            the embedded deployment record

\`DepositHandle\` carries a bigint and an anchor session token. It is not JSON-serialisable
as-is, and the token should not be logged or shared.

## How a payment actually finds the contract

The ticket id becomes the muxed id of the landing account (an \`M...\` address). The anchor
pays that address; Horizon reports which ticket the payment belongs to; the relay calls
\`router.dispatch(ticket, amount, payment_ref)\`, which moves the USDC to the target and
calls \`on_deposit\` in the same transaction. The payment reference is written on-chain
before the external calls, so a relay running twice cannot pay twice.

Why a router exists at all: an anchor cannot deposit to a contract address, and a token
transfer never triggers a function. "Deposit AND call" needs something in between.

## Trust — state this honestly to the user

- The relay is trusted. For the seconds between the anchor's payment and the dispatch, the
  landing account holds the money, and the relay is what reports the amount. Everything
  after the dispatch is enforced by contracts.
- The anchor is trusted with the fiat leg and the KYC.
- The relay only acts on payments from the anchor's treasury, in the anchor's USDC, to the
  landing account, carrying a known ticket, newer than the deployment. Anything else is
  ignored and reported for manual handling.
- The user's key lives wherever the app puts it. Clearing browser storage loses it.
- Testnet accounts are funded by friendbot. Mainnet would need sponsored reserves, a real
  anchor, key recovery and a relay someone operates.

## Verifying your work

After wiring it up, check these rather than assuming:

1. The route points at the right contract:
   \`stellar contract invoke --id ${agentFacts.router} --network ${agentFacts.network} --send=no -- get_route --route YOUR_ROUTE_ID\`
2. A ticket belongs to the user who opened it: \`get_ticket --ticket N\` on the router.
3. The dispatch happened: \`stello.findDispatch({ ticket, fromLedger })\` returns
   \`{ amount, accepted }\`. This reads the router's own event, so it works without
   touching the target contract's state.
4. The contract recorded it: \`readContract(targetId, "balance", { user })\` or whatever
   view the app exposes.

## Common mistakes

- Omitting \`router.require_auth()\` — forged deposits.
- Returning \`false\` without refunding — the user loses the money.
- Regenerating the keypair on each render — the user loses their account.
- Treating \`amount\` as a decimal number — it is a bigint of stroops.
- Importing the relay into browser code — leaks the landing key.
- Writing \`pnpm add stello-sdk\` before the package is published — it fails.
- Assuming \`accepted: false\` means the router refunded — the target must do it.
`;
}

/** A Claude Code skill: the same guide, shaped as a skill file. */
export function skillMd(origin: string): string {
  return `---
name: stello-integration
description: Add bank-transfer payments to a Soroban contract with Stello, so people without a crypto wallet can use it. Use when the user wants users to pay into their Stellar/Soroban contract by bank transfer or IBAN, mentions Stello or stello-sdk, or asks how to accept fiat into a Soroban app. Covers the on_deposit contract interface, route registration and the TypeScript client.
---

# Stello integration

A bank transfer is a contract call. Read the full guide before acting:

    ${origin}/llms-full.txt

## Before you start

Establish these three things with the user; guessing any of them produces broken code.

1. Which contract receives the money, and what should happen when it arrives.
2. What the app needs to know per payment — this becomes \`arg\`, at most 64 bytes.
3. Whether a route is already registered. If so, get the route id; if not, register once.

## The integration, in order

1. **Contract** — add \`on_deposit(env, user: Address, amount: i128, arg: Bytes) -> bool\`.
   The first line must load the stored router address and call \`require_auth()\` on it.
   Without that line anyone can forge a deposit. Store the router and token addresses in
   \`__constructor\`.
2. **Route** — deploy, then \`register_route\` on the router. Permissionless, one time.
   Keep the route id it prints.
3. **Client** — install the package, construct \`new Stello({ route })\`, call
   \`requestDeposit\`, show \`iban\` and \`reference\`, then \`waitForDeposit\`.

## Rules that are easy to get wrong

- \`router.require_auth()\` is mandatory and security-critical.
- Returning \`false\` obliges the contract to have refunded the user itself.
- A panic rolls the whole dispatch back; the money stays at the landing account.
- \`amount\` is i128 stroops — USDC has 7 decimals, so 1 USDC is 10_000_000.
- \`amountTry\` is a string in lira; render results with \`fromStroops\`.
- The keypair must be persisted, never regenerated per render.
- \`stello-sdk/server\` holds the relay and must never reach client code.
- The package is not on npm yet — install the archive from \`vendor/\`.

## Be honest about the state

Testnet only, mock anchor, simulated bank transfers and KYC. The relay is a trusted party
for the seconds it holds the payment. Tell the user this rather than presenting Stello as
trustless or production-ready.

## Verify before reporting success

- \`get_route\` on the router returns the user's contract.
- \`findDispatch({ ticket, fromLedger })\` returns \`{ amount, accepted }\`.
- The target's own view shows the recorded deposit.

On chain (${agentFacts.network}): router \`${agentFacts.router}\`, USDC \`${agentFacts.usdc}\`,
example target \`${agentFacts.exampleTarget}\` on route ${agentFacts.exampleRoute}.
`;
}

/** The block a developer pastes into AGENTS.md for Cursor, Codex and friends. */
export function agentsSnippet(origin: string): string {
  return `<!-- Stello: bank-transfer payments into a Soroban contract -->
## Stello

This project uses [Stello](${origin}) so people without a crypto wallet can pay into our
Soroban contract with an ordinary bank transfer.

**Read ${origin}/llms-full.txt before changing payment code.**

Non-negotiable rules:

- \`on_deposit\` must begin by loading the stored router address and calling
  \`require_auth()\` on it. Without that, anyone can forge a deposit.
- Returning \`false\` from \`on_deposit\` means this contract already refunded the user.
  The router does not refund on our behalf.
- \`arg\` is at most 64 bytes and its meaning is ours alone.
- Amounts crossing the contract boundary are i128 stroops (7 decimals). Convert with
  \`toStroops\` / \`fromStroops\`, never with Number().
- The user's keypair is persisted by this app. Never call \`Keypair.random()\` outside
  first-time creation.
- Never import \`stello-sdk/server\` into client code — it carries the relay key.

Our route id and contract addresses live in the app's deployment record. Testnet only:
bank transfers and KYC are simulated, and the relay is a trusted party.
`;
}
