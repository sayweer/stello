import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import Curtain from "@/components/Curtain";
import InstallBlock from "@/components/InstallBlock";
import { depositSnippet } from "@/lib/snippets";
import { deployment, docs, example, exampleUrl } from "@/lib/site";

/**
 * Numbers a developer can check rather than take on faith: every one of these
 * is a measurement of what is in the repository, not a claim about adoption.
 */
const FACTS = [
  { figure: "1", unit: "fonksiyon", note: "Kontratına eklediğin tek şey: on_deposit" },
  { figure: "64", unit: "bayt", note: "Uygulamana ait argüman; anlamı tamamen senin" },
  { figure: "7", unit: "KB", note: "Router kontratının derlenmiş boyutu" },
  { figure: "18", unit: "test", note: "Router ve örnek hedef kontrat testleri" },
  { figure: "2", unit: "bağımlılık", note: "SDK’nın tamamı; biri Stellar SDK’sı" },
  { figure: "0", unit: "cüzdan", note: "Kullanıcının kurması gereken" },
];

const DOC_BLURB: Record<string, string> = {
  "": "Ödemenin yolu, hangi parçanın kime ait olduğu ve güven modeli.",
  installation: "Paketi kur, anahtarı sakla, ilk ödemeyi uçtan uca çalıştır.",
  contracts: "on_deposit arayüzü, router yetkisi ve rota kaydı.",
  sdk: "Stello sınıfı, requestDeposit, waitForDeposit ve IBAN’a çekim.",
  relay: "Relay ne yapar, neden güvenilen taraftır, origin izinleri.",
  example: "Kumbara kontratı ve ayrı repoda duran kampanya uygulaması.",
  publishing: "Arşiv üretimi, sürümleme ve npm yayın adımları.",
};

export default function Home() {
  return (
    <>
      <Curtain />
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <p className="eyebrow">STELLAR ÜZERİNDE · GELİŞTİRİCİLER İÇİN</p>
            <h1>
              Bir havale.
              <br />
              Bir kontrat
              <br />
              <span className="highlight">çağrısı.</span>
            </h1>
            <p className="lead">
              Kullanıcın banka uygulamasında kalır. Stello, havaleyi Soroban kontratına taşır ve
              fonksiyonunu parayla birlikte çağırır.
            </p>
            <InstallBlock />
            <div className="actions">
              <Link className="button primary" href="/docs/installation">
                Entegrasyona başla <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" href="/docs">
                Nasıl çalışır?
              </Link>
            </div>
          </div>
          <div className="hero-code">
            <div className="code-caption">
              <span>UYGULAMANA EKLE</span>
              <span>TypeScript / ESM</span>
            </div>
            <CodeBlock title="app/deposit.ts" code={depositSnippet} />
            <div className="delivery">
              <span className="delivery-icon" aria-hidden="true">
                ↳
              </span>
              <div>
                <strong>Para ulaştığında kodun çalışır.</strong>
                <p>Arayüz, tutar ve iş kuralları senin. Havale akışı Stello’nun.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flow-band" aria-label="Ödeme akışı">
          <ol className="container flow">
            <li>
              <span>01</span>Banka havalesi<small>TRY</small>
            </li>
            <li>
              <span>02</span>Anchor<small>TRY → USDC</small>
            </li>
            <li>
              <span>03</span>Stello<small>Ticket → dispatch</small>
            </li>
            <li>
              <span>04</span>Senin kontratın<small>on_deposit()</small>
            </li>
          </ol>
        </section>

        <section className="container section" id="facts">
          <div className="section-head">
            <p className="eyebrow">ENTEGRASYONUN BÜYÜKLÜĞÜ</p>
            <h2>
              Öğrenilecek yeni
              <br />
              bir dünya yok.
            </h2>
            <p>
              Hepsi depodan ölçüldü — kullanım sayısı değil, entegrasyonun kendisinin boyutu.
              Kontratına bir fonksiyon, uygulamana bir paket.
            </p>
          </div>
          <dl className="facts">
            {FACTS.map((fact) => (
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
            <p className="eyebrow">TEK BİR ENTEGRASYON</p>
            <h2>
              Ürünün ne yapacağı
              <br />
              sana kalmış.
            </h2>
            <p>
              Bir kumbara, bir kampanya ya da kendi uygulaman. Stello ödeme yolunu sağlar; gelen
              paranın ne anlama geldiğine kontratın karar verir.
            </p>
          </div>
          <div className="steps-grid">
            <Link href="/docs/contracts" className="step-card">
              <span className="step-index">01 / KONTRAT</span>
              <h3>Bir fonksiyon ekle.</h3>
              <p>
                <code>on_deposit</code> ile kullanıcıyı, tutarı ve uygulamana ait argümanı al.
                Token’lar çağrıdan önce kontratına aktarılır.
              </p>
              <span className="text-link">Kontrat arayüzü ↗</span>
            </Link>
            <Link href="/docs/contracts#route" className="step-card">
              <span className="step-index">02 / ROTA</span>
              <h3>Kontratını bağla.</h3>
              <p>
                Paylaşılan router’a bir rota kaydet. İzin istemez. Aldığın rota kimliği,
                uygulamanın ödemelerini doğru kontrata yönlendirir.
              </p>
              <span className="text-link">Rota kaydı ↗</span>
            </Link>
            <Link href="/docs/sdk" className="step-card">
              <span className="step-index">03 / İSTEMCİ</span>
              <h3>IBAN’ı göster.</h3>
              <p>
                SDK ile ödeme talebi oluştur. Kullanıcıya IBAN ve referansı göster; kontrat
                çağrısının sonucunu takip et.
              </p>
              <span className="text-link">SDK referansı ↗</span>
            </Link>
          </div>
        </section>

        <section className="container section" id="docs">
          <div className="section-head">
            <p className="eyebrow">GELİŞTİRİCİ REHBERİ</p>
            <h2>
              Her adım
              <br />
              yazılı.
            </h2>
            <p>
              Kurulumdan relay işletimine, kontrat arayüzünden yayın adımlarına kadar. Çalışan
              örnek kod ve testnet adresleriyle.
            </p>
          </div>
          <div className="doc-grid">
            {docs.map((doc, index) => (
              <Link
                key={doc.slug}
                className="doc-card"
                href={`/docs${doc.slug ? `/${doc.slug}` : ""}`}
              >
                <span className="doc-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="doc-group">{doc.group}</span>
                <h3>{doc.title}</h3>
                <p>{DOC_BLURB[doc.slug]}</p>
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
              <span className="doc-group">KAYNAK KOD</span>
              <h3>GitHub</h3>
              <p>Router kontratı, SDK ve örnek hedef — hepsi okunabilir. MIT.</p>
            </a>
          </div>
        </section>

        <section className="container example-section">
          <div>
            <p className="eyebrow">İLK ENTEGRASYON</p>
            <h2>
              Ya olur,
              <br />
              ya kazanırsın.
            </h2>
            <p>
              Hedefe ulaşamazsa katılımcısına parasını ve bonus payını geri veren bir kampanya
              uygulaması. Stello SDK’sını ayrı bir projeden, kurulu paket olarak kullanıyor.
            </p>
            <div className="actions">
              <a className="button secondary" href={exampleUrl} target="_blank" rel="noreferrer">
                Canlı uygulamayı aç <span aria-hidden="true">↗</span>
              </a>
              <Link className="text-link" href="/docs/example">
                Nasıl entegre etti?
              </Link>
            </div>
          </div>
          <div className="example-receipt">
            <p className="eyebrow">STELLO KAMPANYA</p>
            <h3>
              Havale ile katıl.
              <br />
              Sonucu kontrat belirlesin.
            </h3>
            <dl>
              <div>
                <dt>Ödeme akışı</dt>
                <dd>stello-sdk</dd>
              </div>
              <div>
                <dt>Kampanya kuralları</dt>
                <dd>Uygulamanın kontratı</dd>
              </div>
              <div>
                <dt>Rota</dt>
                <dd>#{example.routeId} · kumbara</dd>
              </div>
            </dl>
            <p className="receipt-note">Aynı SDK. Ayrı kod tabanı.</p>
          </div>
        </section>

        <section className="container section closing">
          <div>
            <p className="eyebrow">AÇIK KAYNAK · TESTNET</p>
            <h2>
              İlk havaleyi
              <br />
              kontratına ulaştır.
            </h2>
          </div>
          <div>
            <p>
              Kurulum, kontrat arayüzü, relay bağlantısı ve çalışan örnek; hepsi geliştirici
              rehberinde. Router testnet’te yayında:
            </p>
            <a
              className="address-link"
              href={`https://stellar.expert/explorer/testnet/contract/${deployment.routerId}`}
              target="_blank"
              rel="noreferrer"
            >
              {deployment.routerId} ↗
            </a>
            <Link className="button primary" href="/docs/installation">
              Kurulum rehberini aç ↗
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
