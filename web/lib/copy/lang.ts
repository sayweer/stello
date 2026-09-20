/**
 * Language identity and path helpers, kept free of the dictionaries.
 *
 * Client components need these — the header's language toggle, the docs
 * sidebar — and anything they import travels to the browser. Importing them
 * from the module that also holds `tr` and `en` would ship every word of the
 * documentation, in both languages, to every visitor.
 */
export const LANGS = ["tr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** Documentation pages, in sidebar order. The empty slug is the overview. */
export const DOC_SLUGS = [
  "",
  "installation",
  "contracts",
  "sdk",
  "relay",
  "agents",
  "example",
  "publishing",
] as const;

export type DocSlug = (typeof DOC_SLUGS)[number];

/** The other language, for the toggle. */
export function otherLang(lang: Lang): Lang {
  return lang === "tr" ? "en" : "tr";
}

/** Rewrites a path to the same page in another language. */
export function swapLang(pathname: string, to: Lang): string {
  const rest = pathname.replace(/^\/(tr|en)(?=\/|$)/, "");
  return `/${to}${rest}`;
}
