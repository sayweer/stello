/**
 * Documentation content as data rather than markup.
 *
 * The site says the same things in two languages, and the surest way to let
 * them drift is to keep two copies of the JSX. Here a page is a list of blocks,
 * so a translation is the same shape with different strings — a missing or
 * extra section shows up as a type error or an obvious diff, not as a page that
 * quietly says less in one language.
 *
 * Strings carry a small inline markup, described in `Inline` below.
 */

export type Block =
  | { t: "intro"; text: string }
  | { t: "p"; text: string }
  | { t: "h2"; text: string; id?: string }
  | { t: "code"; code: string; title?: string }
  | { t: "callout"; strong: string; text: string }
  | { t: "table"; head: [string, string]; rows: [string, string][] }
  | { t: "list"; items: string[] }
  /** An ordered list whose items lead with a bold clause. */
  | { t: "steps"; items: { lead: string; text: string }[] }
  | { t: "button"; href: string; label: string }
  | { t: "next"; href: string; label: string };

/**
 * Inline markup inside a block's strings:
 *
 *   `code`            → <code>
 *   **bold**          → <strong>
 *   [label](href)     → <a>, or a client-side <Link> when href starts with "/"
 *
 * Deliberately tiny. Anything richer belongs in a block type, where both
 * languages are forced to declare it.
 */
export type Inline = string;

export type Doc = {
  /** Sidebar and <title>. */
  title: string;
  /** The small label above the heading. */
  group: string;
  /** The page heading, which may break across lines with "\n". */
  heading?: string;
  blocks: Block[];
};
