import type { Block, Doc } from "./blocks";
import type { Lang } from "./index";

/**
 * The dictionary writes internal links the way a reader thinks of them —
 * `/docs/contracts` — and leaves the site's own address as `{ORIGIN}`. Both are
 * resolved here, once, on the way to the renderer.
 *
 * Keeping the language prefix out of the content means a translator never has
 * to remember it, and a page cannot end up linking across languages.
 */
export function localizeText(text: string, lang: Lang, origin: string): string {
  return text
    .replaceAll("{ORIGIN}", origin)
    .replace(/\]\(\/(?!tr\/|en\/)/g, `](/${lang}/`);
}

function localizeBlock(block: Block, lang: Lang, origin: string): Block {
  const t = (s: string) => localizeText(s, lang, origin);
  switch (block.t) {
    case "intro":
    case "p":
    case "h2":
      return { ...block, text: t(block.text) };
    case "code":
      return { ...block, code: t(block.code) };
    case "callout":
      return { ...block, strong: t(block.strong), text: t(block.text) };
    case "table":
      return {
        ...block,
        head: [t(block.head[0]), t(block.head[1])],
        rows: block.rows.map((row) => [t(row[0]), t(row[1])] as [string, string]),
      };
    case "list":
      return { ...block, items: block.items.map(t) };
    case "steps":
      return { ...block, items: block.items.map((i) => ({ lead: t(i.lead), text: t(i.text) })) };
    case "button":
      return block; // Always an external address.
    case "next":
      return { ...block, href: `/${lang}${block.href}` };
  }
}

export function localizeDoc(doc: Doc, lang: Lang, origin: string): Doc {
  return { ...doc, blocks: doc.blocks.map((b) => localizeBlock(b, lang, origin)) };
}
