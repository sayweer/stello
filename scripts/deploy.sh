#!/usr/bin/env bash
# Deploys the Stello contracts to testnet and records what the clients need.
#
# Safe to re-run: identities and trustlines are only created when missing, and
# the contracts are redeployed with fresh ids every time (ticket and campaign
# numbering restarts, which is why deployments/testnet.json records deployedAt
# — the relayer ignores payments older than that).
set -euo pipefail

cd "$(dirname "$0")/.."
CFG="$PWD/.stellar-cfg"
mkdir -p "$CFG" deployments

NETWORK=testnet
USDC_CODE=USDC
USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
USDC_SAC=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
ANCHOR_TREASURY=GCLCZEQZ2THTEDAOFI66LACNPLY4OBKN7VKLEZFMBIHYKYQOW2W7T3Z6
ANCHOR_DOMAIN=tr-mock-anchor.fly.dev
HORIZON=https://horizon-testnet.stellar.org
ROUTE_NAME="Ya Olur Ya Kazanirsin"

# Logs go to stderr so they never end up inside a captured value.
say() { printf '\n▶ %s\n' "$1" >&2; }

# Keys live in the project-local config dir, never in the global one.
key() { stellar keys "$@" --config-dir "$CFG"; }

ensure_key() {
  if ! key public-key "$1" >/dev/null 2>&1; then
    say "creating identity '$1'"
    key generate "$1" --network "$NETWORK" --fund >/dev/null
  fi
  key public-key "$1"
}

say "identities"
DEPLOYER=$(ensure_key deployer)
LANDING=$(ensure_key landing)
echo "deployer: $DEPLOYER"
echo "landing : $LANDING"

say "USDC trustline on the landing account"
if curl -s "$HORIZON/accounts/$LANDING" \
  | jq -e --arg i "$USDC_ISSUER" \
    '.balances[]? | select(.asset_code == "USDC" and .asset_issuer == $i)' >/dev/null; then
  echo "already there"
else
  stellar tx new change-trust --source-account landing --config-dir "$CFG" \
    --network "$NETWORK" --line "$USDC_CODE:$USDC_ISSUER" >/dev/null
  echo "created"
fi

say "building"
stellar contract build 2>&1 | grep -E "Wasm File|error" >&2

say "deploying router"
ROUTER=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/stello_router.wasm \
  --source-account landing --config-dir "$CFG" --network "$NETWORK" \
  -- --relayer "$LANDING" --usdc "$USDC_SAC" | tail -1)
echo "router  : $ROUTER"

say "deploying campaign"
CAMPAIGN=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/stello_campaign.wasm \
  --source-account deployer --config-dir "$CFG" --network "$NETWORK" \
  -- --router "$ROUTER" --usdc "$USDC_SAC" | tail -1)
echo "campaign: $CAMPAIGN"

say "registering the campaign route"
ROUTE=$(stellar contract invoke --id "$ROUTER" --source-account deployer \
  --config-dir "$CFG" --network "$NETWORK" \
  -- register_route --owner "$DEPLOYER" --target "$CAMPAIGN" --name "$ROUTE_NAME" | tail -1)
echo "route id: $ROUTE"

say "writing deployments/testnet.json"
jq -n \
  --arg network "$NETWORK" \
  --arg passphrase "Test SDF Network ; September 2015" \
  --arg rpcUrl "https://soroban-testnet.stellar.org" \
  --arg horizonUrl "$HORIZON" \
  --arg friendbotUrl "https://friendbot.stellar.org" \
  --arg anchorDomain "$ANCHOR_DOMAIN" \
  --arg code "$USDC_CODE" --arg issuer "$USDC_ISSUER" --arg sac "$USDC_SAC" \
  --arg treasury "$ANCHOR_TREASURY" \
  --arg landing "$LANDING" --arg deployer "$DEPLOYER" \
  --arg routerId "$ROUTER" --arg campaignId "$CAMPAIGN" \
  --argjson routeId "$ROUTE" \
  --arg deployedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{network:$network, passphrase:$passphrase, rpcUrl:$rpcUrl, horizonUrl:$horizonUrl,
    friendbotUrl:$friendbotUrl, anchorDomain:$anchorDomain,
    usdc:{code:$code, issuer:$issuer, sac:$sac}, treasury:$treasury,
    landing:$landing, deployer:$deployer,
    routerId:$routerId, campaignId:$campaignId, routeId:$routeId,
    deployedAt:$deployedAt}' > deployments/testnet.json
cat deployments/testnet.json

if [ ! -f .env ]; then
  say "writing .env (git-ignored)"
  {
    echo "LANDING_SECRET=$(key secret landing)"
    echo "DEPLOYER_SECRET=$(key secret deployer)"
  } > .env
  chmod 600 .env
fi

say "done"
echo "router  : https://stellar.expert/explorer/testnet/contract/$ROUTER"
echo "campaign: https://stellar.expert/explorer/testnet/contract/$CAMPAIGN"
