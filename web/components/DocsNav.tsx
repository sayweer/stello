"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Copy } from "@/lib/copy";
import type { Lang } from "@/lib/copy/lang";

/** Only what the sidebar draws — the pages themselves stay on the server. */
export type NavItem = { slug: string; title: string; group: string };

export default function DocsNav({
  lang,
  nav,
  items,
}: {
  lang: Lang;
  nav: Copy["docsNav"];
  items: NavItem[];
}) {
  const path = usePathname();
  const href = (slug: string) => `/${lang}/docs${slug ? `/${slug}` : ""}`;

  return (
    <aside className="docs-sidebar">
      <p className="docs-label">
        {nav.label} <span>v0.1</span>
      </p>
      <nav aria-label={nav.label}>
        {items.map((item, i) => (
          <div key={item.slug}>
            {item.group !== items[i - 1]?.group && <p className="nav-group">{item.group}</p>}
            <Link href={href(item.slug)} aria-current={path === href(item.slug) ? "page" : undefined}>
              {item.title}
            </Link>
          </div>
        ))}
      </nav>
      <div className="docs-status">
        <span className="status-dot" /> {nav.status}
        <p>{nav.statusNote}</p>
      </div>
    </aside>
  );
}
