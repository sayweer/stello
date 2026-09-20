# stello-sdk

**A bank transfer is a contract call.**

Let people who have no crypto wallet — and no wish to learn what one is — use your Soroban contract. They send an ordinary bank transfer; your contract gets called with the money already in it. When they are owed something, it goes back to their IBAN.

Your users see an IBAN and a reference code. Nothing else.

```
bank app ──TRY──▶ anchor ──USDC──▶ landing account ──▶ router.dispatch ──▶ your_contract.on_deposit(user, amount, arg)
```

> Testnet preview, against the Turkish mock anchor (`tr-mock-anchor.fly.dev`). Bank transfers and KYC are simulated. The package currently embeds this testnet deployment; it is not a configurable mainnet on-ramp.

## Install before the npm release

Requires Node.js **22.12+**. From the Stello repository, run `pnpm install` and `pnpm sdk:pack`. This produces `artifacts/stello-sdk-0.1.0.tgz`, including JavaScript, TypeScript declarations and the license.

Copy the archive into your app's `vendor/` directory, then install it:

```bash
pnpm add ./vendor/stello-sdk-0.1.0.tgz @stellar/stellar-sdk
```

Your app does not need this repository or a workspace link. Once the package has been published to npm, the equivalent command is `pnpm add stello-sdk @stellar/stellar-sdk`. It will not work before publication.

## Integrate in three steps

### 1. Add one function to your contract

```rust
pub fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool {
    // Only the router may say that money arrived.
    let router: Address = env.storage().instance().get(&DataKey::Router).unwrap();
    router.require_auth();

    // The tokens are already in this contract. Do whatever your app does:
    // credit the user, mint a ticket, count a vote.
    true // return false only if you refunded `user` yourself
}
```

`arg` is up to 64 bytes that your frontend attaches to the payment. What they mean is entirely yours. A complete, tested example lives in [`contracts/example-target`](https://github.com/sayweer/stello/tree/main/contracts/example-target).

### 2. Register a route — once, permissionless

```bash
stellar contract invoke --id CAG2IZHZK6VLNW3ASXENFLCL6SN6KS72JMLNF4GO2ZIFV5WURN2BYFZV \
  --source-account you --network testnet \
  -- register_route --owner <your G...> --target <your C...> --name "My app"
# → 7   (your route id)
```

Nobody approves this. The router is shared infrastructure.

### 3. Use the client

```ts
import { Keypair } from "@stellar/stellar-sdk";
import { Stello } from "stello-sdk";

const stello = new Stello({
  route: 7, // use the route you registered
  relayUrl: "https://YOUR_STELLO_HOST/api/relay",
});
const keypair = Keypair.random(); // persist this; do not generate it on every render

// Opens a ticket and asks the anchor where to pay it.
const deposit = await stello.requestDeposit({
  keypair,
  amountTry: "250",
  arg: new Uint8Array([1]), // your bytes; browser-safe, at most 64 bytes
  onStep: (step) => console.log(step),
});
showToUser(deposit.iban, deposit.reference);

// Resolves once your on_deposit has run.
const { amount, accepted } = await stello.waitForDeposit({ handle: deposit });

// Later, when your contract has paid the user back: USDC → lira → their IBAN.
await stello.withdrawToIban({ keypair });
```

A Stello-operated relay must be running. Integrators do not need the landing secret. The placeholder URL above is not a hosted service; for local work use `http://localhost:3000/api/relay` with Stello's dev server or run `pnpm relayer` in the Stello repository.

### Client/server boundary

```ts
// App / browser
import { Stello, readContract, invokeContract } from "stello-sdk";

// Stello operator only — never put the landing key in a browser
import { relayOnce } from "stello-sdk/server";
```

For browser calls to the hosted relay, its server must include your app's origin in `STELLO_ALLOWED_ORIGINS` (comma-separated). The endpoint supports `POST` and CORS `OPTIONS`. CORS is not authentication or rate limiting. `relayUrl` is optional when an independent relay loop is running.

`router` overrides only the router address on the embedded network. It does not change the landing account, anchor or token. `withdrawToIban` defaults to the user's whole USDC balance; pass `amount` (bigint) to withdraw a specific amount. The mock anchor requires at least 1 USDC.

## What the client does for you

| Call | What happens |
|---|---|
| `ensureReady(keypair)` | Creates and funds the account, adds the USDC trustline, signs in to the anchor (SEP-10, challenge verified before signing) and registers the customer (SEP-12). Every step checks first, so it is cheap to call on each page load. |
| `requestDeposit({ keypair, arg, amountTry })` | Opens a ticket on the router, derives the muxed address for it, and asks the anchor for payment instructions (SEP-6). |
| `waitForDeposit({ handle })` | Waits for the anchor to settle and for the router to dispatch. Completion is read from the router's own `Dispatched` event — no app state is consulted, which is why this works for any contract. |
| `withdrawToIban({ keypair })` | SEP-6 withdrawal: a classic payment to the anchor with the memo it asked for, then waits for the payout. |
| `readContract` / `invokeContract` | Call your own contract with plain JavaScript values — the interface is read off the network, no generated bindings. |
| `simulateBankTransfer(handle, amount)` | Sandbox only: stands in for the user's banking app. |

## How a transfer finds your contract

A ticket id becomes the **muxed id** of the landing account (`M...`). The anchor pays that address; Horizon reports which ticket the payment belongs to; the relay calls `router.dispatch(ticket, amount, payment_ref)`, which moves the USDC to your contract and calls `on_deposit` **in the same transaction**. The payment reference is recorded on-chain before the external calls, so a relay running twice can never pay twice.

Why a router at all: an anchor cannot deposit to a contract address, and a token transfer never triggers a function. "Deposit *and* call" needs something in between.

## Trust model — read this

- **The relay is a trusted party.** For the few seconds between the anchor's payment and the dispatch, the landing account holds the money, and the relay is what reports the amount. After that, everything is enforced by contracts.
- The relay filters the configured treasury, asset, landing account, muxed id and deployment time. Unknown tickets are reported for manual refund.
- The user's key lives in their browser. Clearing site data loses it. A passkey smart account is the roadmap answer.
- Testnet accounts are funded by friendbot; mainnet needs sponsored reserves.
- A target returning `false` must refund the user itself. The router does not enforce that refund. A panic rolls the dispatch back.
- The relay scans the most recent 50 payments per pass. Durable catch-up and high-volume operation are not implemented. Event lookup depends on RPC retention.

## Live on testnet

| | |
|---|---|
| Router | `CAG2IZHZK6VLNW3ASXENFLCL6SN6KS72JMLNF4GO2ZIFV5WURN2BYFZV` |
| Example target (piggy bank), route 2 | `CDF6WDCS3M36RN6ERREM4B5ZT74RL5SU3I2TLJ2JXB5DCODMHPP266UH` |
| Landing account | `GBWOY746OPO2GOADBVBZKDXZC6VAEYB5JGKGKWB7ETGEH6UUELJYNTFL` |

A full app built on this SDK — a dominant-assurance crowdfunding campaign — is maintained in the separate `stello-kampanya` project. It installs this package as an archive before the registry release. Its GitHub publication is a separate step.

## License

MIT
