import type { ReactNode } from "react";

/**
 * Splits a line into masked words, and each word into individual letters.
 *
 * Letters, not words: staggering whole words reads as a completely different
 * animation. Splitting happens in the markup rather than at runtime so the text
 * stays selectable; each word carries an `aria-label` and its letters are
 * hidden from assistive tech, so a screen reader reads words instead of
 * spelling them out.
 */
export default function Words({
  text,
  mark,
  className = "",
}: {
  /** The line to animate. Split on spaces, then on characters. */
  text: string;
  /** A word or phrase inside `text` that gets the accent wipe. */
  mark?: string;
  className?: string;
}) {
  const parts: ReactNode[] = [];
  const marked = mark ? text.split(mark) : [text];

  const letters = (word: string, keyBase: string) =>
    [...word].map((char, index) => (
      <span className="lp__char" aria-hidden="true" key={`${keyBase}-c${index}`}>
        {char}
      </span>
    ));

  const pushWords = (chunk: string, keyBase: string) => {
    chunk
      .split(" ")
      .filter(Boolean)
      .forEach((word, index) => {
        parts.push(
          <span className="lp__mask" key={`${keyBase}-${index}`}>
            <span className="lp__word" aria-label={word}>
              {letters(word, `${keyBase}-${index}`)}
            </span>
          </span>,
          // A real space, not CSS padding: the masks would otherwise concatenate
          // into one word when the line is copied or read aloud.
          " ",
        );
      });
  };

  if (mark && marked.length > 1) {
    pushWords(marked[0] ?? "", "a");

    // Trailing punctuation rides inside the marked span; as its own "word" it
    // would sit after the mask's gap and float away from the phrase.
    const rest = marked.slice(1).join(mark);
    const punctuation = /^([.,!?;:]+)(\s*)$/.exec(rest);

    parts.push(
      <span className="lp__mask" key="mark">
        <span className="lp__word" aria-label={mark + (punctuation ? punctuation[1] : "")}>
          <span className="lp__mark">
            <i className="lp__mark-fill" aria-hidden="true" />
            {letters(mark, "mark")}
          </span>
          {punctuation?.[1] ? letters(punctuation[1], "punct") : null}
        </span>
      </span>,
    );

    if (!punctuation) pushWords(rest, "b");
  } else {
    pushWords(text, "w");
  }

  return <span className={className}>{parts}</span>;
}
