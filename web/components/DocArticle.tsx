import Link from "next/link";
import Prose, { lines } from "@/components/Prose";
import type { Doc } from "@/lib/copy/blocks";
import { type Lang, getCopy } from "@/lib/copy";
import { localizeDoc } from "@/lib/copy/localize";

/**
 * One documentation page. The "next" block is pulled out of the flow so it
 * always sits at the bottom, where the reader looks for it, no matter where a
 * translation happens to place it in the list.
 */
export default function DocArticle({
  doc,
  lang,
  origin,
}: {
  doc: Doc;
  lang: Lang;
  origin: string;
}) {
  const localized = localizeDoc(doc, lang, origin);
  const next = localized.blocks.find((block) => block.t === "next");
  const c = getCopy(lang);

  return (
    <article className="prose">
      <p className="eyebrow">{localized.group}</p>
      <h1>{lines(localized.heading ?? localized.title)}</h1>
      <Prose blocks={localized.blocks} code={c.codeBlock} />
      {next && (
        <Link className="next-doc" href={next.href}>
          <span>{c.docsNav.next}</span>
          {next.label} ↗
        </Link>
      )}
    </article>
  );
}
