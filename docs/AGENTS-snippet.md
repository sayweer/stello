<!-- Stello: bank-transfer payments into a Soroban contract -->
## Stello

This project uses [Stello](https://stello.dev) so people without a crypto wallet can pay into our
Soroban contract with an ordinary bank transfer.

**Read https://stello.dev/llms-full.txt before changing payment code.**

Non-negotiable rules:

- `on_deposit` must begin by loading the stored router address and calling
  `require_auth()` on it. Without that, anyone can forge a deposit.
- Returning `false` from `on_deposit` means this contract already refunded the user.
  The router does not refund on our behalf.
- `arg` is at most 64 bytes and its meaning is ours alone.
- Amounts crossing the contract boundary are i128 stroops (7 decimals). Convert with
  `toStroops` / `fromStroops`, never with Number().
- The user's keypair is persisted by this app. Never call `Keypair.random()` outside
  first-time creation.
- Never import `stello-sdk/server` into client code — it carries the relay key.

Our route id and contract addresses live in the app's deployment record. Testnet only:
bank transfers and KYC are simulated, and the relay is a trusted party.
