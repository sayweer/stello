/**
 * Writes the agent artifacts that live in the repository as files, from the
 * same source the site serves them from. Keeps the skill a developer copies out
 * of git identical to the one an agent fetches over HTTP.
 *
 *   pnpm agent:files [origin]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { agentsSnippet, skillMd } from "../web/lib/agent-guide.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.argv[2] ?? "https://stello.dev";

const files: [string, string][] = [
  [".claude/skills/stello-integration/SKILL.md", skillMd(origin)],
  ["docs/AGENTS-snippet.md", agentsSnippet(origin)],
];

for (const [path, body] of files) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
  console.log(`yazıldı: ${path}`);
}
