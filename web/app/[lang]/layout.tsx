import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { LANGS, getCopy, isLang } from "@/lib/copy";
import "../globals.css";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const { meta } = getCopy(lang);
  return {
    title: { default: meta.title, template: meta.template },
    description: meta.description,
    icons: { icon: "/favicon.svg" },
    alternates: {
      languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}`])),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

const themeScript = `try{var t=localStorage.getItem("stello-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light";}catch(e){}`;

export default async function RootLayout({
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
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Questrial&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {c.chrome.skip}
        </a>
        <SiteHeader lang={lang} chrome={c.chrome} />
        {children}
        <footer className="site-footer container">
          <Link href={`/${lang}`} className="footer-brand">
            Stello<span>{c.chrome.footerTagline}</span>
          </Link>
          <div>
            <Link href={`/${lang}/docs`}>{c.chrome.docs}</Link>
            <a href="https://github.com/sayweer/stello" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <span>{c.chrome.footerNote}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
