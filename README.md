<div align="center">

# Stello

**A bank transfer is a contract call.**

Let people without a crypto wallet use your Soroban contract.
They send an ordinary bank transfer; your contract is called with the money already in it.

[![npm](https://img.shields.io/npm/v/stello-sdk?color=FDDA24&label=stello-sdk)](https://www.npmjs.com/package/stello-sdk)
[![license](https://img.shields.io/badge/license-MIT-black)](LICENSE)
[![network](https://img.shields.io/badge/network-Stellar%20testnet-black)](https://stellar.expert/explorer/testnet/contract/CAG2IZHZK6VLNW3ASXENFLCL6SN6KS72JMLNF4GO2ZIFV5WURN2BYFZV)

[**Documentation**](https://stello-web.vercel.app/en) ·
[**Live example**](https://stello-core-et2a.vercel.app) ·
[**For coding agents**](https://stello-web.vercel.app/llms-full.txt) ·
[**Türkçe**](https://stello-web.vercel.app/tr)

</div>

---

## The problem

A Soroban contract can only be used by someone who already has a wallet, some XLM for fees,
and a way to get money on chain. For most people in most places, that is three walls before
the product even starts. The usual answer — "tell them to install a wallet" — is the reason
so many good contracts have no users.

Stello removes all three. Your user stays in the banking app they already have.

## How it works

```
 banking app          anchor              landing account            your contract
     │                  │                        │                        │
     │──── TRY ────────▶│                        │                        │
     │                  │──── USDC ─────────────▶│                        │
     │                  │   to M(landing, id)    │                        │
     │                  │                        │── router.dispatch ────▶│
     │                  │                        │   transfer + call      │
     │                  │                        │   in one transaction   │
```

1. **A ticket is opened.** The SDK records the user, the target route and up to 64 bytes of
   your own argument on the shared router.
2. **The anchor returns payment details.** The user sees an IBAN and a reference code.
3. **The payment lands.** It arrives at a [muxed address][muxed] whose id *is* the ticket id,
   which is what ties an anonymous bank transfer to a specific pledge.
4. **The router dispatches.** It moves the USDC to your contract and calls `on_deposit` in the
   **same transaction** — so the money and the call either both happen or neither does.

[muxed]: https://developers.stellar.org/docs/learn/encyclopedia/transactions-specialized/muxed-accounts

## The whole integration

**One function in your contract:**

```rust
pub fn on_deposit(env: Env, user: Address, amount: i128, arg: Bytes) -> bool {
    let router: Address = env.storage().instance().get(&DataKey::Router).unwrap();
    router.require_auth();          // mandatory — without it, deposits can be forged

    // The tokens are already here. Apply your own rules.
    credit(&env, &user, amount);
    true
}
```

**One route, registered once, permissionlessly:**

```bash
stellar contract invoke --id <ROUTER> --source-account you --network testnet \
  -- register_route --owner <YOUR_G> --target <YOUR_C> --name "My app"
```

**One package in your app:**

```bash
pnpm add stello-sdk @stellar/stellar-sdk
```

```ts
import { Stello, fromStroops } from "stello-sdk";

const stello = new Stello({ route: YOUR_ROUTE_ID });

const payment = await stello.requestDeposit({
  keypair,                       // the user key your app persists
  amountTry: "100",
  arg: new Uint8Array([1]),      // yours; the router never reads it
});
// Show payment.iban and payment.reference to the user.

const result = await stello.waitForDeposit({ handle: payment });
console.log(fromStroops(result.amount), result.accepted);
```

That is the entire surface. No wallet, no chain concepts, and nothing about Stello in your
user interface.

## Status

Stellar **testnet**, against a **mock Turkish anchor**. Bank transfers and KYC are simulated;
no real money moves. The contracts, the router's authorization tree, the muxed-address
attribution and the atomic dispatch are all real and verifiable on chain.

| | |
| --- | --- |
| Router | [`CAG2IZHZ…RN2BYFZV`](https://stellar.expert/explorer/testnet/contract/CAG2IZHZK6VLNW3ASXENFLCL6SN6KS72JMLNF4GO2ZIFV5WURN2BYFZV) |
| Example target (route `2`) | [`CDF6WDCS…MHPP266UH`](https://stellar.expert/explorer/testnet/contract/CDF6WDCS3M36RN6ERREM4B5ZT74RL5SU3I2TLJ2JXB5DCODMHPP266UH) |
| Landing account | [`GBWOY746…UELJYNTFL`](https://stellar.expert/explorer/testnet/account/GBWOY746OPO2GOADBVBZKDXZC6VAEYB5JGKGKWB7ETGEH6UUELJYNTFL) |
| USDC (SAC) | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| Anchor | `tr-mock-anchor.fly.dev` (SEP-1/10/12/6/38) |

The router compiles to **7 KB**, and the SDK has **two** dependencies.

## Repository

```
contracts/router           the shared payment router          (14 tests)
contracts/example-target   the smallest possible integration   (4 tests)
packages/core              stello-sdk, published to npm       (11 tests)
web                        documentation site + /api/relay     (9 tests)
scripts                    deploy, relay loop, end-to-end runs
deployments                the single source of truth for addresses
```

The example application — [**Stello Campaign**](https://github.com/sayweer/stello-kampanya),
a dominant-assurance campaign that refunds its backers with a share of the bonus when the
goal is missed — lives in its own repository and installs `stello-sdk` from npm like anyone
else would. That separation is the proof that this is a layer rather than one application.

## Development

Requires Node.js 22.12+, pnpm, and — for the contracts — Rust with the Stellar CLI.

```bash
pnpm install
pnpm dev            # docs site + relay on http://localhost:3000

pnpm check          # tests, type check, production build
cargo test          # 18 contract tests
stellar contract build
```

`pnpm dev` reads the repository root `.env`; the relay needs `LANDING_SECRET` there. See
[`.env.example`](.env.example).

### Deploying the docs site

The Next.js app is under `web/`, not at the repository root, so **set your host's root
directory to `web`**. Otherwise the root `package.json` has no `next` dependency, the project
is taken for a static site, and the build fails looking for a `public` directory.

Set `LANDING_SECRET` and `STELLO_ALLOWED_ORIGINS` in the server environment. Without an
integrating app's origin on that list, its browser cannot nudge the relay and payments wait
for the relay's next pass.

### Against the live network

```bash
bash scripts/deploy.sh          # deploys a new router and rewrites the deployment record
bash scripts/deploy-example.sh  # deploys the example target and registers its route
pnpm e2e --stage anchor|chain|full
```

These spend real testnet transactions. After a deploy, cut a new SDK version: the deployment
record is compiled into the package, so consumers on an older version keep calling the old
addresses.

## Trust model

Be precise about this, because it is the part people get wrong.

- **The router is trustless.** The token transfer and the contract call are one transaction.
  A payment reference can be dispatched only once, and if the target panics, everything —
  the transfer and the record — is rolled back.
- **The relay is trusted** for the seconds it holds a payment. It reads the amount and the
  ticket id from Horizon and tells the router. It cannot pay twice or redirect money, but it
  can decline to act.
- **The anchor is trusted** with the fiat leg, as any on-ramp is.
- **`accepted: false` does not mean a refund happened.** The target contract is responsible
  for returning the money it refuses. The router will not do it for you.

## Known limits

The relay examines the last 50 payments per pass and has no persistent cursor or backfill, so
a long outage needs manual attention. RPC event retention bounds how long a pending payment
can be traced. The browser key is demo-grade: no recovery, no passkeys. Mainnet would need
reserve and fee sponsorship, a real anchor and real KYC. Network and anchor configuration is
baked into the package in v0.1 rather than being configurable.

## Built with

Soroban · SEP-1, SEP-10, SEP-12, SEP-6 and SEP-38 · muxed accounts · the Stellar Asset
Contract · `@stellar/stellar-sdk`.

## License

MIT — see [LICENSE](LICENSE).

<div align="center"><sub>

Built by Seyit Ali Değirmen · Stellar Pro Hackathon, Istanbul, September 2026

</sub></div>
