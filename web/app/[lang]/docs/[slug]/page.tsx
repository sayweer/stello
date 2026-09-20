import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocArticle from "@/components/DocArticle";
import { DOC_SLUGS, LANGS, getCopy, isLang } from "@/lib/copy";
import { siteOrigin } from "@/lib/origin";

/** The overview lives at /docs, so its empty slug is not generated here. */
const SLUGS = DOC_SLUGS.filter((slug) => slug !== "");

export function generateStaticParams() {
  return LANGS.flatMap((lang) => SLUGS.map((slug) => ({ lang, slug })));
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  return { title: getCopy(lang).docs[slug as (typeof SLUGS)[number]]?.title };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const doc = getCopy(lang).docs[slug as (typeof SLUGS)[number]];
  if (!doc) notFound();

  return <DocArticle doc={doc} lang={lang} origin={await siteOrigin()} />;
}
