#!/usr/bin/env bash
# Proves on the live network what unit tests cannot: that a single transaction
# sourced by the landing account can dispatch a payment — moving the token and
# calling on_deposit inside one auth tree — and that the guards hold.
#
# The router is token-agnostic, so this runs on native XLM with a throwaway
# pair of contracts. No anchor, no Node, just the CLI.
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

say "deploying a throwaway router+campaign pair on native XLM"
ROUTER=$(stellar contract deploy --wasm target/wasm32v1-none/release/stello_router.wasm \
  --source-account landing --config-dir "$CFG" --network "$NETWORK" \
  -- --relayer "$LANDING" --usdc "$XLM_SAC" | tail -1)
CAMPAIGN=$(stellar contract deploy --wasm target/wasm32v1-none/release/stello_campaign.wasm \
  --source-account deployer --config-dir "$CFG" --network "$NETWORK" \
  -- --router "$ROUTER" --usdc "$XLM_SAC" | tail -1)
echo "router=$ROUTER campaign=$CAMPAIGN"

ROUTE=$(call --id "$ROUTER" --source-account deployer \
  -- register_route --owner "$DEPLOYER" --target "$CAMPAIGN" --name "smoke" | tail -1)

DEADLINE=$(( $(date +%s) + 75 ))
ID=$(call --id "$CAMPAIGN" --source-account deployer \
  -- create --organizer "$DEPLOYER" --title "smoke" --goal $((100 * XLM)) \
     --deadline "$DEADLINE" --bonus 0 --cap $((4 * XLM)) | tail -1)
say "route=$ROUTE campaign id=$ID deadline=$DEADLINE"

# arg = [kind=1][campaign id, 8 bytes big-endian]
ARG=$(printf '01%016x' "$ID")
TICKET=$(call --id "$ROUTER" --source-account smoke-user \
  -- open_ticket --user "$USER" --route "$ROUTE" --arg "$ARG" | tail -1)
say "ticket=$TICKET arg=$ARG"

REF1=$(printf '%064x' 1)
REF2=$(printf '%064x' 2)

say "1) dispatch: one transaction, sourced by the landing account"
ACCEPTED=$(call --id "$ROUTER" --source-account landing \
  -- dispatch --ticket "$TICKET" --amount $((5 * XLM)) --payment_ref "$REF1" | tail -1)
echo "accepted=$ACCEPTED"
[ "$ACCEPTED" = "true" ] || { echo "FAIL: deposit was not accepted"; exit 1; }

PLEDGE=$(call --id "$CAMPAIGN" --source-account deployer --send=no \
  -- get_pledge --campaign "$ID" --user "$USER" | tail -1)
echo "pledge=$PLEDGE"
echo "$PLEDGE" | grep -q "\"$((5 * XLM))\"" || { echo "FAIL: pledge not recorded"; exit 1; }

say "2) the same payment reference is refused"
if call --id "$ROUTER" --source-account landing \
  -- dispatch --ticket "$TICKET" --amount $((5 * XLM)) --payment_ref "$REF1" >/dev/null 2>&1; then
  echo "FAIL: duplicate dispatch went through"; exit 1
fi
echo "refused as expected"

say "3) waiting for the deadline"
while [ "$(date +%s)" -le "$DEADLINE" ]; do sleep 5; done

say "4) a late transfer is accepted on-chain but refunded by the campaign"
BEFORE=$(call --id "$XLM_SAC" --source-account deployer --send=no -- balance --id "$USER" | tail -1 | tr -d '"')
LATE=$(call --id "$ROUTER" --source-account landing \
  -- dispatch --ticket "$TICKET" --amount $((3 * XLM)) --payment_ref "$REF2" | tail -1)
AFTER=$(call --id "$XLM_SAC" --source-account deployer --send=no -- balance --id "$USER" | tail -1 | tr -d '"')
echo "accepted=$LATE  balance $BEFORE -> $AFTER"
[ "$LATE" = "false" ] || { echo "FAIL: a late pledge should be rejected"; exit 1; }
[ "$AFTER" -eq $((BEFORE + 3 * XLM)) ] || { echo "FAIL: the late transfer was not refunded"; exit 1; }

say "5) anyone can refund the pledger: the deployer claims on the user's behalf"
PAYOUT=$(call --id "$CAMPAIGN" --source-account deployer \
  -- claim --campaign "$ID" --user "$USER" | tail -1 | tr -d '"')
FINAL=$(call --id "$XLM_SAC" --source-account deployer --send=no -- balance --id "$USER" | tail -1 | tr -d '"')
echo "payout=$PAYOUT  balance $AFTER -> $FINAL"
[ "$PAYOUT" -eq $((5 * XLM)) ] || { echo "FAIL: unexpected payout"; exit 1; }
[ "$FINAL" -eq $((AFTER + 5 * XLM)) ] || { echo "FAIL: the refund did not reach the user"; exit 1; }

say "ALL CHECKS PASSED"
echo "router  : https://stellar.expert/explorer/testnet/contract/$ROUTER"
echo "campaign: https://stellar.expert/explorer/testnet/contract/$CAMPAIGN"
