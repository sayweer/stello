#!/usr/bin/env bash
# Deploys the example target (a piggy bank) against the live router and
# registers a route for it — exactly what an integrating team does, in two
# commands. Records the result in deployments/example.json.
set -euo pipefail

cd "$(dirname "$0")/.."
CFG="$PWD/.stellar-cfg"
NETWORK=testnet
ROUTER=$(jq -r .routerId deployments/testnet.json)
USDC_SAC=$(jq -r .usdc.sac deployments/testnet.json)
DEPLOYER=$(stellar keys public-key deployer --config-dir "$CFG")

stellar contract build 2>&1 | grep -E "stello_example_target.wasm|error" >&2

TARGET=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/stello_example_target.wasm \
  --source-account deployer --config-dir "$CFG" --network "$NETWORK" \
  -- --router "$ROUTER" --token "$USDC_SAC" | tail -1)

ROUTE=$(stellar contract invoke --id "$ROUTER" --source-account deployer \
  --config-dir "$CFG" --network "$NETWORK" \
  -- register_route --owner "$DEPLOYER" --target "$TARGET" --name "Kumbara (example)" | tail -1)

jq -n --arg targetId "$TARGET" --argjson routeId "$ROUTE" --arg routerId "$ROUTER" \
  '{routerId:$routerId, targetId:$targetId, routeId:$routeId}' > deployments/example.json
cat deployments/example.json
