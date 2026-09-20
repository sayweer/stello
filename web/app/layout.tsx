import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Stello — Bir havale, bir kontrat çağrısı", template: "%s · Stello" },
  description: "Banka havalelerini Soroban kontrat çağrılarına dönüştüren Stello SDK. Kurulum, entegrasyon rehberi ve örnek uygulama.",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };
const themeScript = `try{var t=localStorage.getItem("stello-theme");document.documentElement.dataset.theme=t==="dark"?"dark":"light";}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="tr" suppressHydrationWarning><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Questrial&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  </head><body>
    <a className="skip-link" href="#main">İçeriğe geç</a>
    <SiteHeader />
    {children}
    <footer className="site-footer container"><Link href="/" className="footer-brand">Stello<span>Bir havale, bir kontrat çağrısı.</span></Link><div><Link href="/docs">Dokümantasyon</Link><a href="https://github.com/sayweer/stello" target="_blank" rel="noreferrer">GitHub ↗</a><span>Testnet · MIT</span></div></footer>
  </body></html>;
}
