/** Origin checks control browser access; they are not authentication. */
export function relayAccess(request: Request, allowedOrigins: string): { allowed: boolean; headers: Headers } {
  const origin = request.headers.get("origin");
  const permitted = new Set(allowedOrigins.split(",").map((value) => value.trim()).filter(Boolean));
  const allowed = !origin || origin === new URL(request.url).origin || permitted.has(origin);
  const headers = new Headers({ Vary: "Origin", "Cache-Control": "no-store" });
  if (allowed && origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return { allowed, headers };
}
