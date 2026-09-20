import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import DocsNav from "@/components/DocsNav";
import { DOC_SLUGS, getCopy, isLang } from "@/lib/copy";

export default async function DocsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const c = getCopy(lang);
  return (
    <div className="container docs-layout">
      <DocsNav
        lang={lang}
        nav={c.docsNav}
        items={DOC_SLUGS.map((slug) => ({
          slug,
          title: c.docs[slug].title,
          group: c.docs[slug].group,
        }))}
      />
      <main id="main" className="docs-content">{children}</main>
    </div>
  );
}
