import { Keypair } from "@stellar/stellar-sdk";
import { config } from "stello-sdk";
import { relayOnce, type RelayResult } from "stello-sdk/server";
import { relayAccess } from "../../../lib/relay-access";

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
export const runtime = "nodejs";

// Coalesce browser polling within one server instance. The chain remains the
// idempotency boundary across different instances and the standalone loop.
let inFlight: Promise<RelayResult> | undefined;

function access(request: Request) {
  return relayAccess(request, process.env.STELLO_ALLOWED_ORIGINS ?? (process.env.NODE_ENV === "development" ? "http://localhost:3001" : ""));
}

export async function OPTIONS(request: Request): Promise<Response> {
  const { allowed, headers } = access(request);
  return new Response(null, { status: allowed ? 204 : 403, headers });
}

export async function POST(request: Request): Promise<Response> {
  const { allowed, headers } = access(request);
  if (!allowed) return Response.json({ error: "Origin is not allowed" }, { status: 403, headers });
  const secret = process.env.LANDING_SECRET;
  if (!secret) {
    return Response.json({ error: "LANDING_SECRET is not configured" }, { status: 503, headers });
  }

  try {
    const landing = Keypair.fromSecret(secret);
    if (landing.publicKey() !== config.landing) {
      return Response.json({ error: "Landing key does not match the deployment" }, { status: 503, headers });
    }
    inFlight ??= relayOnce({ landing }).finally(() => { inFlight = undefined; });
    const result = await inFlight;
    return Response.json({
      dispatched: result.dispatched.map((entry) => ({
        ticket: String(entry.ticket),
        amount: String(entry.amount),
        accepted: entry.accepted,
      })),
      skipped: result.skipped.length,
      failed: result.failed,
    }, { headers });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502, headers },
    );
  }
}
