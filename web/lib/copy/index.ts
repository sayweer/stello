import type { Doc } from "./blocks";
import type { DocSlug, Lang } from "./lang";
export * from "./lang";
import { tr } from "./tr";
import { en } from "./en";


/**
 * Every string the site shows a reader. Both languages implement this type, so
 * a section added to one and forgotten in the other fails to compile.
 */
export type Copy = {
  meta: { title: string; template: string; description: string };
  chrome: {
    skip: string;
    brandHome: string;
    menu: string;
    mainMenu: string;
    docs: string;
    example: string;
    start: string;
    themeToggle: string;
    langToggle: string;
    footerTagline: string;
    footerNote: string;
  };
  home: {
    eyebrow: string;
    heading: string;
    /** The final line, set in the accent colour. */
    headingAccent: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    codeCaption: string;
    codeLang: string;
    deliveryTitle: string;
    deliveryText: string;
    flowLabel: string;
    flow: { step: string; note: string }[];
    factsEyebrow: string;
    factsHeading: string;
    factsLead: string;
    facts: { figure: string; unit: string; note: string }[];
    stepsEyebrow: string;
    stepsHeading: string;
    stepsLead: string;
    steps: { index: string; title: string; text: string; link: string; href: string }[];
    docsEyebrow: string;
    docsHeading: string;
    docsLead: string;
    docBlurb: Record<DocSlug, string>;
    repoGroup: string;
    repoText: string;
    exampleEyebrow: string;
    exampleHeading: string;
    exampleLead: string;
    exampleCta: string;
    exampleHow: string;
    receiptEyebrow: string;
    receiptHeading: string;
    receiptRows: [string, string][];
    receiptNote: string;
    closingEyebrow: string;
    closingHeading: string;
    closingText: string;
    closingCta: string;
  };
  docsNav: { label: string; status: string; statusNote: string; next: string };
  codeBlock: {
    copy: string;
    copied: string;
    /** Shown when the clipboard is unavailable, as it is over plain http. */
    manual: string;
    /** `%s` is the block's title. */
    aria: string;
  };
  docs: Record<DocSlug, Doc>;
  install: {
    /** Shown under the install command on the home page. */
    note: string;
    managers: string;
    copyAria: string;
    copy: string;
    copied: string;
  };
};

const COPY: Record<Lang, Copy> = { tr, en };

export function getCopy(lang: Lang): Copy {
  return COPY[lang];
}
