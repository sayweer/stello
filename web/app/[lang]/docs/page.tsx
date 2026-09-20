import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocArticle from "@/components/DocArticle";
import { LANGS, getCopy, isLang } from "@/lib/copy";
import { siteOrigin } from "@/lib/origin";

export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? { title: getCopy(lang).docs[""].title } : {};
}

export default async function Overview({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <DocArticle doc={getCopy(lang).docs[""]} lang={lang} origin={await siteOrigin()} />;
}
