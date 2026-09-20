import { headers } from "next/headers";

import { siteUrl } from "./site";

/**
 * The origin the reader actually reached us on, so the links an agent follows
 * point at the same deployment it is reading. Falls back to the production host
 * when the header is missing (static generation, curl without a Host header).
 */
export async function siteOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (!host) return siteUrl;
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
