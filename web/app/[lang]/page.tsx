import Link from "next/link";
import { notFound } from "next/navigation";
import CodeBlock from "@/components/CodeBlock";
import Curtain from "@/components/Curtain";
import InstallBlock from "@/components/InstallBlock";
import { inline, lines } from "@/components/Prose";
import { DOC_SLUGS, LANGS, getCopy, isLang } from "@/lib/copy";
import { getSnippets } from "@/lib/snippets";
import { deployment, exampleUrl } from "@/lib/site";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const c = getCopy(lang);
  const h = c.home;
  const snippets = getSnippets(lang);
  const at = (path: string) => `/${lang}${path}`;

  return (
    <>
      <Curtain />
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <p className="eyebrow">{h.eyebrow}</p>
            <h1>
              {lines(h.heading)}
              <br />
              <span className="highlight">{h.headingAccent}</span>
            </h1>
            <p className="lead">{h.lead}</p>
            <InstallBlock t={c.install} />
            <div className="actions">
              <Link className="button primary" href={at("/docs/installation")}>
                {h.ctaPrimary} <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" href={at("/docs")}>
                {h.ctaSecondary}
              </Link>
            </div>
          </div>
          <div className="hero-code">
            <div className="code-caption">
              <span>{h.codeCaption}</span>
              <span>{h.codeLang}</span>
            </div>
            <CodeBlock title="app/deposit.ts" code={snippets.deposit} labels={c.codeBlock} />
            <div className="delivery">
              <span className="delivery-icon" aria-hidden="true">
                ↳
              </span>
              <div>
                <strong>{h.deliveryTitle}</strong>
                <p>{h.deliveryText}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flow-band" aria-label={h.flowLabel}>
          <ol className="container flow">
            {h.flow.map((item, i) => (
              <li key={item.step}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {item.step}
                <small>{item.note}</small>
              </li>
            ))}
          </ol>
        </section>

        <section className="container section" id="facts">
          <div className="section-head">
            <p className="eyebrow">{h.factsEyebrow}</p>
            <h2>{lines(h.factsHeading)}</h2>
            <p>{h.factsLead}</p>
          </div>
          <dl className="facts">
            {h.facts.map((fact) => (
              <div className="fact" key={fact.unit}>
                <dt>
                  <b>{fact.figure}</b>
                  {fact.unit}
                </dt>
                <dd>{fact.note}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="container section" id="integration">
          <div className="section-head">
            <p className="eyebrow">{h.stepsEyebrow}</p>
            <h2>{lines(h.stepsHeading)}</h2>
            <p>{h.stepsLead}</p>
          </div>
          <div className="steps-grid">
            {h.steps.map((step) => (
              <Link href={at(step.href)} className="step-card" key={step.index}>
                <span className="step-index">{step.index}</span>
                <h3>{step.title}</h3>
                <p>{inline(step.text, step.index)}</p>
                <span className="text-link">{step.link} ↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="container section" id="docs">
          <div className="section-head">
            <p className="eyebrow">{h.docsEyebrow}</p>
            <h2>{lines(h.docsHeading)}</h2>
            <p>{h.docsLead}</p>
          </div>
          <div className="doc-grid">
            {DOC_SLUGS.map((slug, index) => (
              <Link
                key={slug}
                className="doc-card"
                href={at(`/docs${slug ? `/${slug}` : ""}`)}
              >
                <span className="doc-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="doc-group">{c.docs[slug].group}</span>
                <h3>{c.docs[slug].title}</h3>
                <p>{h.docBlurb[slug]}</p>
              </Link>
            ))}
            {/* Fills the grid's last cell, and it is where the answers the docs
                do not cover actually live. */}
            <a
              className="doc-card doc-card--repo"
              href="https://github.com/sayweer/stello"
              target="_blank"
              rel="noreferrer"
            >
              <span className="doc-index">↗</span>
              <span className="doc-group">{h.repoGroup}</span>
              <h3>GitHub</h3>
              <p>{h.repoText}</p>
            </a>
          </div>
        </section>

        <section className="container example-section">
          <div>
            <p className="eyebrow">{h.exampleEyebrow}</p>
            <h2>{lines(h.exampleHeading)}</h2>
            <p>{h.exampleLead}</p>
            <div className="actions">
              <a className="button secondary" href={exampleUrl} target="_blank" rel="noreferrer">
                {h.exampleCta} <span aria-hidden="true">↗</span>
              </a>
              <Link className="text-link" href={at("/docs/example")}>
                {h.exampleHow}
              </Link>
            </div>
          </div>
          <div className="example-receipt">
            <p className="eyebrow">{h.receiptEyebrow}</p>
            <h3>{lines(h.receiptHeading)}</h3>
            <dl>
              {h.receiptRows.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="receipt-note">{h.receiptNote}</p>
          </div>
        </section>

        <section className="container section closing">
          <div>
            <p className="eyebrow">{h.closingEyebrow}</p>
            <h2>{lines(h.closingHeading)}</h2>
          </div>
          <div>
            <p>{h.closingText}</p>
            <a
              className="address-link"
              href={`https://stellar.expert/explorer/testnet/contract/${deployment.routerId}`}
              target="_blank"
              rel="noreferrer"
            >
              {deployment.routerId} ↗
            </a>
            <Link className="button primary" href={at("/docs/installation")}>
              {h.closingCta} ↗
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
