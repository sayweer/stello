import { skillMd } from "@/lib/agent-guide";
import { siteOrigin } from "@/lib/origin";

/** Served as a file so an agent can fetch it directly. */
export async function GET(): Promise<Response> {
  return new Response(skillMd(await siteOrigin()), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      // Agents fetch this from other origins.
      "access-control-allow-origin": "*",
    },
  });
}
