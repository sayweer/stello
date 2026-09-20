import { Keypair } from "@stellar/stellar-sdk";
import { relayOnce } from "@stello/core";

/**
 * Serverless fallback for the relay: the browser calls this once the anchor
 * reports the transfer as completed, so a participant's pledge lands even when
 * nobody is running `pnpm relayer` on a laptop.
 *
 * Safe to call from anywhere and as often as you like — the router refuses a
 * payment it has already dispatched, so this cannot double-spend or replay.
 * The landing secret never leaves the server.
 */
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  const secret = process.env.LANDING_SECRET;
  if (!secret) {
    return Response.json({ error: "LANDING_SECRET is not configured" }, { status: 500 });
  }

  try {
    const result = await relayOnce({ landing: Keypair.fromSecret(secret) });
    return Response.json({
      dispatched: result.dispatched.map((entry) => ({
        ticket: String(entry.ticket),
        amount: String(entry.amount),
        accepted: entry.accepted,
      })),
      skipped: result.skipped.length,
      failed: result.failed,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
