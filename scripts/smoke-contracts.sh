#!/usr/bin/env bash
# Proves on the live network what unit tests cannot: that a single transaction
# sourced by the landing account can dispatch a payment — moving the token and
# calling on_deposit inside one auth tree — and that the guards hold.
#
# The router is token-agnostic, so this runs on native XLM with a throwaway
# pair of contracts — no anchor involved. Steps 1-5 are pure CLI; step 6 reads
# the dispatch back through the SDK, the way an integrating app would.
set -euo pipefail

cd "$(dirname "$0")/.."
CFG="$PWD/.stellar-cfg"
NETWORK=testnet
XLM=10000000  # 1 XLM in stroops

say() { printf '\n▶ %s\n' "$1" >&2; }
key() { stellar keys "$@" --config-dir "$CFG"; }
call() { stellar contract invoke --config-dir "$CFG" --network "$NETWORK" "$@"; }

ensure_key() {
  if ! key public-key "$1" >/dev/null 2>&1; then
    key generate "$1" --network "$NETWORK" --fund >/dev/null
  fi
  key public-key "$1"
}

LANDING=$(ensure_key landing)
DEPLOYER=$(ensure_key deployer)
USER=$(ensure_key smoke-user)
XLM_SAC=$(stellar contract id asset --asset native --network "$NETWORK")
say "landing $LANDING / user $USER / XLM SAC $XLM_SAC"

say "deploying a throwaway router + example target on native XLM"
ROUTER=$(stellar contract deploy --wasm target/wasm32v1-none/release/stello_router.wasm \
  --source-account landing --config-dir "$CFG" --network "$NETWORK" \
  -- --relayer "$LANDING" --usdc "$XLM_SAC" | tail -1)
TARGET=$(stellar contract deploy --wasm target/wasm32v1-none/release/stello_example_target.wasm \
  --source-account deployer --config-dir "$CFG" --network "$NETWORK" \
  -- --router "$ROUTER" --token "$XLM_SAC" | tail -1)
echo "router=$ROUTER target=$TARGET"

ROUTE=$(call --id "$ROUTER" --source-account deployer \
  -- register_route --owner "$DEPLOYER" --target "$TARGET" --name "smoke" | tail -1)

# arg is opaque to the router; this target reads its first byte (00 = refuse).
TICKET=$(call --id "$ROUTER" --source-account smoke-user \
  -- open_ticket --user "$USER" --route "$ROUTE" --arg 01 | tail -1)
REFUSED_TICKET=$(call --id "$ROUTER" --source-account smoke-user \
  -- open_ticket --user "$USER" --route "$ROUTE" --arg 00 | tail -1)
say "route=$ROUTE ticket=$TICKET refusing ticket=$REFUSED_TICKET"

REF1=$(printf '%064x' 1)
REF2=$(printf '%064x' 2)
balance_of() { call --id "$XLM_SAC" --source-account deployer --send=no -- balance --id "$1" | tail -1 | tr -d '"'; }

say "1) dispatch: one transaction, sourced by the landing account"
ACCEPTED=$(call --id "$ROUTER" --source-account landing \
  -- dispatch --ticket "$TICKET" --amount $((5 * XLM)) --payment_ref "$REF1" | tail -1)
SAVED=$(call --id "$TARGET" --source-account deployer --send=no -- balance --user "$USER" | tail -1 | tr -d '"')
echo "accepted=$ACCEPTED saved=$SAVED"
[ "$ACCEPTED" = "true" ] || { echo "FAIL: deposit was not accepted"; exit 1; }
[ "$SAVED" -eq $((5 * XLM)) ] || { echo "FAIL: on_deposit did not record the deposit"; exit 1; }

say "2) the same payment reference is refused"
if call --id "$ROUTER" --source-account landing \
  -- dispatch --ticket "$TICKET" --amount $((5 * XLM)) --payment_ref "$REF1" >/dev/null 2>&1; then
  echo "FAIL: duplicate dispatch went through"; exit 1
fi
echo "refused as expected"

say "3) a deposit the target refuses is refunded in the same transaction"
BEFORE=$(balance_of "$USER")
REFUSED=$(call --id "$ROUTER" --source-account landing \
  -- dispatch --ticket "$REFUSED_TICKET" --amount $((3 * XLM)) --payment_ref "$REF2" | tail -1)
AFTER=$(balance_of "$USER")
echo "accepted=$REFUSED  balance $BEFORE -> $AFTER"
[ "$REFUSED" = "false" ] || { echo "FAIL: the target should have refused"; exit 1; }
[ "$AFTER" -eq $((BEFORE + 3 * XLM)) ] || { echo "FAIL: the refused deposit was not refunded"; exit 1; }

say "4) a stranger cannot push a payment through"
if call --id "$ROUTER" --source-account deployer \
  -- dispatch --ticket "$TICKET" --amount $((1 * XLM)) --payment_ref "$(printf '%064x' 9)" >/dev/null 2>&1; then
  echo "FAIL: dispatch ran without the relayer"; exit 1
fi
echo "refused as expected"

say "5) the user takes the money back out of the contract"
call --id "$TARGET" --source-account smoke-user -- withdraw --user "$USER" >/dev/null
FINAL=$(balance_of "$USER")
echo "balance $AFTER -> $FINAL"
[ "$FINAL" -gt "$AFTER" ] || { echo "FAIL: withdraw paid nothing"; exit 1; }

say "6) an integrating app reads the dispatch back off the chain"
node --import tsx scripts/check-dispatch.ts "$ROUTER" "$TICKET" $((5 * XLM)) || {
  echo "FAIL: the SDK could not read the dispatch"; exit 1;
}

say "ALL CHECKS PASSED"
echo "router  : https://stellar.expert/explorer/testnet/contract/$ROUTER"
echo "target  : https://stellar.expert/explorer/testnet/contract/$TARGET"
