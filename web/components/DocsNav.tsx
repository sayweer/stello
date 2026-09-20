"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { docs } from "@/lib/site";
export default function DocsNav() {
  const path = usePathname();
  return <aside className="docs-sidebar"><p className="docs-label">GELİŞTİRİCİ REHBERİ <span>v0.1</span></p><nav aria-label="Dokümantasyon">{docs.map((doc, i) => <div key={doc.slug}>
    {(i === 0 || docs[i - 1]?.group !== doc.group) && <p className="nav-group">{doc.group}</p>}
    <Link href={`/docs${doc.slug ? `/${doc.slug}` : ""}`} aria-current={path === `/docs${doc.slug ? `/${doc.slug}` : ""}` ? "page" : undefined}>{doc.title}</Link>
  </div>)}</nav><div className="docs-status"><span className="status-dot" /> Testnet önizlemesi<p>Gerçek banka havalesi içermez.</p></div></aside>;
}
