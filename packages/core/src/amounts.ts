/** Stellar amounts carry 7 decimals; on-chain they are i128 stroops. */
export const DECIMALS = 7;
const SCALE = 10n ** BigInt(DECIMALS);

/**
 * Parses a Stellar amount string ("12.3450000") into stroops.
 *
 * Deliberately string-based: `Number("0.1") * 1e7` is 999999.9999999999, and
 * Horizon hands us these values as strings anyway.
 */
export function toStroops(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`not an amount: ${amount}`);
  }

  const negative = trimmed.startsWith("-");
  const [whole = "0", fraction = ""] = trimmed.replace("-", "").split(".");
  if (fraction.length > DECIMALS) {
    throw new Error(`more than ${DECIMALS} decimals: ${amount}`);
  }

  const stroops = BigInt(whole) * SCALE + BigInt(fraction.padEnd(DECIMALS, "0") || "0");
  return negative ? -stroops : stroops;
}

/** Inverse of `toStroops`, without trailing-zero padding. */
export function fromStroops(stroops: bigint): string {
  const negative = stroops < 0n;
  const absolute = negative ? -stroops : stroops;
  const fraction = (absolute % SCALE).toString().padStart(DECIMALS, "0").replace(/0+$/, "");
  const whole = (absolute / SCALE).toString();
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
