import type { ReactNode } from "react";
import DocsNav from "@/components/DocsNav";
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <div className="container docs-layout"><DocsNav /><main id="main" className="docs-content">{children}</main></div>;
}
