import { Asset, Horizon, rpc } from "@stellar/stellar-sdk";

import { deployment } from "./deployment.ts";

/**
 * Everything about the live deployment comes from deployments/testnet.json,
 * which `scripts/deploy.sh` writes. Nothing here is hardcoded twice.
 */
export const config = deployment;

export const usdc = new Asset(deployment.usdc.code, deployment.usdc.issuer);
export const horizon = new Horizon.Server(deployment.horizonUrl);
export const soroban = new rpc.Server(deployment.rpcUrl);
