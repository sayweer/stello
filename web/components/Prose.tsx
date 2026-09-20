import type { ReactNode } from "react";
import Link from "next/link";
import CodeBlock, { type CodeLabels } from "@/components/CodeBlock";
import type { Block } from "@/lib/copy/blocks";

/**
 * Renders the inline markup described in lib/copy/blocks.ts.
 *
 * Every alternative captures its own payload, so the branch is decided by which
 * group matched rather than by re-parsing. The scan is finished before anything
 * is rendered: emphasis renders its contents recursively, and a shared regex's
 * lastIndex would not survive being re-entered mid-loop.
 */
const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

export function inline(text: string, keyPrefix = ""): ReactNode[] {
  const matches = [...text.matchAll(INLINE)];
  const out: ReactNode[] = [];
  let last = 0;

  for (const match of matches) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyPrefix}${match.index}`;
    const [, code, bold, label, href] = match;

    if (code !== undefined) {
      out.push(<code key={key}>{code}</code>);
    } else if (bold !== undefined) {
      // Recursive, so `code` inside **bold** is still code. Emphasis and links
      // never nest into themselves, so this cannot run away.
      out.push(<strong key={key}>{inline(bold, `${key}s`)}</strong>);
    } else if (href!.startsWith("/")) {
      out.push(
        <Link key={key} href={href!}>
          {inline(label!, `${key}l`)}
        </Link>,
      );
    } else {
      out.push(
        <a key={key} href={href!} target="_blank" rel="noreferrer">
          {inline(label!, `${key}l`)}
        </a>,
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Splits on "\n" so a heading can break where the design wants it to. */
export function lines(text: string): ReactNode[] {
  return text.split("\n").flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));
}

function One({ block, k, code }: { block: Block; k: string; code: CodeLabels }) {
  switch (block.t) {
    case "intro":
      return <p className="intro">{inline(block.text, k)}</p>;
    case "p":
      return <p>{inline(block.text, k)}</p>;
    case "h2":
      return <h2 id={block.id}>{inline(block.text, k)}</h2>;
    case "code":
      return <CodeBlock title={block.title} code={block.code} labels={code} />;
    case "callout":
      return (
        <div className="callout">
          <strong>{inline(block.strong, k)}</strong>
          <p>{inline(block.text, k)}</p>
        </div>
      );
    case "table":
      return (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{inline(block.head[0], k)}</th>
                <th>{inline(block.head[1], k)}</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  <td>{inline(row[0], `${k}a${i}`)}</td>
                  <td>{inline(row[1], `${k}b${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{inline(item, `${k}${i}`)}</li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="explain-list">
          {block.items.map((item, i) => (
            <li key={i}>
              <strong>{inline(item.lead, `${k}l${i}`)}</strong> {inline(item.text, `${k}t${i}`)}
            </li>
          ))}
        </ol>
      );
    case "button":
      return (
        <a className="button primary" href={block.href} target="_blank" rel="noreferrer">
          {block.label} <span aria-hidden="true">↗</span>
        </a>
      );
    case "next":
      return null; // Rendered by the page, which pins it to the bottom.
  }
}

export default function Prose({ blocks, code }: { blocks: Block[]; code: CodeLabels }) {
  return (
    <>
      {blocks.map((block, i) => (
        <One key={i} block={block} k={`b${i}`} code={code} />
      ))}
    </>
  );
}
