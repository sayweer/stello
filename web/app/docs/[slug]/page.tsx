import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CodeBlock from "@/components/CodeBlock";
import { docs, deployment, example, exampleUrl } from "@/lib/site";
import { contractSnippet, fullSnippet, routeSnippet } from "@/lib/snippets";

/** Slugs rendered by this route. `agents` is absent: it has its own file. */
const SLUGS = ["installation", "contracts", "sdk", "relay", "example", "publishing"] as const;

/** `agents` has its own route file, so it must not also be generated here. */
export function generateStaticParams() { return SLUGS.map((slug) => ({ slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: docs.find((d) => d.slug === slug)?.title ?? "Dokümantasyon" };
}

function Installation() { return <>
  <p className="intro">Node.js 22.12 veya üstü ve pnpm ile başla. Stello v0.1 ESM olarak dağıtılır ve TypeScript tiplerini içerir.</p>
  <h2>1. Paketi kur</h2><p>Paket npm’de yayımlıdır; uygulaman bu repoya ya da bir <code>workspace:*</code> bağımlılığına ihtiyaç duymaz.</p>
  <CodeBlock code={`pnpm add stello-sdk @stellar/stellar-sdk`} />
  <p><code>@stellar/stellar-sdk</code> eşlenik bağımlılıktır: sürümünü uygulaman belirler, böylece projende tek bir kopyası bulunur. Tip tanımları paketin içinde gelir, ayrı bir <code>@types</code> paketi yoktur.</p>
  <h2>2. Sunucu tarafını ayır</h2><p>Relay <code>stello-sdk/server</code> alt yolundan gelir ve landing anahtarını taşır. Bu alt yol yalnızca sunucuda çalışan kodda içe aktarılmalıdır; istemci paketi (<code>stello-sdk</code>) hiçbir sır içermez.</p>
  <CodeBlock code={`import { Stello } from "stello-sdk";          // istemci\nimport { relayOnce } from "stello-sdk/server"; // yalnız sunucu`} />
  <h2>3. İlk ödemeyi oluştur</h2><p>Örnekte kayıtlı kumbara rotası <code>{example.routeId}</code> kullanılır. Kendi uygulaman için <Link href="/docs/contracts">bir rota kaydet</Link>. Ödeme ilerleyebilmesi için <Link href="/docs/relay">Stello relay’i çalışıyor olmalı</Link>.</p>
  <CodeBlock title="integration.ts" code={fullSnippet} />
  <p><code>amountTry</code> TL tutarını string olarak alır. Sonuçtaki <code>amount</code> yedi ondalık basamaklı USDC’nin en küçük birimidir; ekranda <code>fromStroops(result.amount)</code> kullan.</p>
  <h2>Tarayıcı ve Next.js</h2><p>Etkileşimli ödeme kodunu bir Client Component veya kullanıcı olayı içinde çalıştır. <code>arg</code> için standart <code>Uint8Array</code> kullan; global <code>Buffer</code> eklemek gerekmez.</p><p>Kullanıcı anahtarını işlemler arasında koru. SDK anahtarı senin yerine saklamaz. Örnek uygulama localStorage kullanır; site verilerini silmek anahtarı kaybettirir.</p>
  <Link className="next-doc" href="/docs/contracts"><span>SIRADAKİ</span>Kontratını bağla ↗</Link>
</>; }

function Contracts() { return <>
  <p className="intro">Stello, hedef kontratından tek bir giriş noktası bekler: <code>on_deposit</code>. Paranın nasıl kullanılacağı senin iş kuralındır.</p>
  <h2>Fonksiyon arayüzü</h2><CodeBlock title="Rust / Soroban" code={contractSnippet} /><p>Bu parça tek başına bir kontrat değildir. Router adresini constructor’da sakla; tam derlenebilir örnek <a href="https://github.com/sayweer/stello/tree/main/contracts/example-target">contracts/example-target</a> altında bulunur.</p>
  <div className="callout"><strong>Router yetkisini doğrula.</strong><p><code>router.require_auth()</code> olmadan biri para aktarmadan <code>on_deposit</code> çağırıp bakiye yazdırabilir.</p></div>
  <h2>Girdiler ve sonuçlar</h2><div className="table-scroll"><table><thead><tr><th>Alan</th><th>Anlamı</th></tr></thead><tbody><tr><td><code>user</code></td><td>Ticket’ı açan kullanıcı</td></tr><tr><td><code>amount</code></td><td>Kontrata ulaşmış token tutarı, i128</td></tr><tr><td><code>arg</code></td><td>Uygulamanın tanımladığı en fazla 64 bayt</td></tr><tr><td><code>true</code></td><td>Hedef ödemeyi kabul etti</td></tr><tr><td><code>false</code></td><td>Hedef reddetti; kullanıcıya iadeyi hedef yapar</td></tr><tr><td>Panic / hata</td><td>Dispatch bütünüyle geri alınır; para landing hesabında kalır</td></tr></tbody></table></div>
  <h2 id="route">Rotayı bir kez kaydet</h2><p>Önce hedef kontratını, Stello router adresi ve aynı token adresiyle deploy et. Sonra Stellar CLI’da fonlanmış kimliğinle bu çağrıyı yap; yer tutucuları kendi değerlerinle değiştir.</p><CodeBlock code={routeSnippet} /><p>Dönen sayıyı uygulamanda <code>new Stello({`{ route: YOUR_ROUTE_ID }`})</code> içine koy. Rota kaydı izinsizdir.</p>
  <h2>Kumbara örneği</h2><p>Örnek kontrat <code>arg[0] === 0</code> için parayı kullanıcıya iade eder. Diğer girdilerde kullanıcı bakiyesine yazar. Kullanıcı <code>withdraw</code> çağırdığında birikimi kendi Stellar hesabına döner.</p><p>Router: <code className="address">{deployment.routerId}</code><br />USDC token: <code className="address">{deployment.usdc.sac}</code></p>
  <Link className="next-doc" href="/docs/sdk"><span>SIRADAKİ</span>SDK referansı ↗</Link>
</>; }

function Sdk() { return <>
  <p className="intro">Uygulama kodunu <code>stello-sdk</code> üzerinden yaz. Landing hesabına erişen relay işlevleri ayrı <code>stello-sdk/server</code> girişindedir.</p>
  <h2>Stello seçenekleri</h2><CodeBlock title="client.ts" code={`import { Stello } from "stello-sdk";\n\nconst stello = new Stello({\n  route: ${example.routeId},\n  relayUrl: "http://localhost:3000/api/relay",\n});`} /><p><code>route</code> zorunludur. <code>relayUrl</code> isteğe bağlıdır; çalışan relay döngüsü varsa ayrıca endpoint gerekmez. <code>router</code> seçeneği aynı ağdaki router adresini değiştirir; landing, token ve anchor yapılandırmasını değiştirmez.</p>
  <h2>Ödeme oluştur ve takip et</h2><CodeBlock title="deposit.ts" code={`const payment = await stello.requestDeposit({\n  keypair,\n  amountTry: "100",\n  arg: new Uint8Array([1]),\n});\n\n// payment.iban, payment.reference, payment.estimatedUsdc\nconst result = await stello.waitForDeposit({\n  handle: payment,\n  timeoutMs: 120_000,\n});\n// result: { ticket, amount, accepted, paymentRef }`} /><p><code>requestDeposit</code> gerekli hesabı ve trustline’ı hazırlar, SEP-10 oturumu açar, mock KYC kaydını yapar ve ticket oluşturur. <code>waitForDeposit</code> önce anchor’ı, sonra router event’ini bekler. Zaman aşımı her aşama için ayrı uygulanır.</p><p>Ödeme handle’ı <code>bigint</code> ve oturum token’ı içerir. Doğrudan JSON’a çevrilemez; token’ı loglama veya paylaşma. Mevcut event araması RPC geçmişiyle sınırlıdır.</p>
  <h2>Parayı IBAN’a geri çek</h2><CodeBlock title="withdraw.ts" code={`import { invokeContract, fromStroops } from "stello-sdk";\n\n// Önce kendi kontratın kullanıcıya USDC'yi geri öder.\nawait invokeContract(targetId, keypair, "withdraw", {\n  user: keypair.publicKey(),\n});\nconst payout = await stello.withdrawToIban({ keypair });\nconsole.log(fromStroops(payout.usdc), payout.tryAmount);`} /><p>Varsayılan olarak kullanıcı hesabındaki tüm USDC çekilir. <code>amount</code> ile bigint tutar verebilirsin. Mock anchor minimum 1 USDC ister; ödeme KYC’ye kayıtlı IBAN’a yönelir.</p>
  <h2>Diğer yardımcılar</h2><div className="table-scroll"><table><thead><tr><th>API</th><th>İşlev</th></tr></thead><tbody><tr><td><code>ensureReady(keypair)</code></td><td>Hesap, trustline ve anchor oturumu</td></tr><tr><td><code>findDispatch(handle)</code></td><td>Router event’ini bir kez sorgula</td></tr><tr><td><code>readContract(id, method, args)</code></td><td>Kontrat durumunu simülasyonla oku</td></tr><tr><td><code>invokeContract(id, keypair, method, args)</code></td><td>İmzala, gönder ve sonucu bekle</td></tr><tr><td><code>toStroops / fromStroops</code></td><td>String ↔ bigint tutar dönüşümü</td></tr><tr><td><code>simulateBankTransfer(handle, amount)</code></td><td>Yalnız mock anchor havale simülasyonu</td></tr></tbody></table></div>
  <Link className="next-doc" href="/docs/relay"><span>SIRADAKİ</span>Relay bağlantısı ↗</Link>
</>; }

function Relay() { return <>
  <p className="intro">Relay’i Stello işletir. Entegre eden uygulama yalnız rota kimliğini ve varsa herkese açık relay URL’sini kullanır.</p>
  <h2>Yerelde iki projeyi çalıştır</h2><CodeBlock code={`# stello/ içinde\npnpm dev\n# Dokümantasyon + /api/relay → http://localhost:3000\n\n# stello-kampanya/ içinde\npnpm dev\n# Örnek uygulama → http://localhost:3001`} /><p>Stello dev komutu kök <code>.env</code> dosyasını okur; relay için <code>LANDING_SECRET</code> gerekir. Development modunda <code>http://localhost:3001</code> varsayılan olarak izinlidir. Hosting üzerinde anahtarı ve izin listesini sunucu ortamına tanımla. Sırrı hiçbir zaman <code>NEXT_PUBLIC_</code> ile adlandırma.</p>
  <CodeBlock title="stello/web/.env.local" code={`LANDING_SECRET=<landing hesabının secret değeri>\nSTELLO_ALLOWED_ORIGINS=http://localhost:3001`} /><CodeBlock title="stello-kampanya/.env.local" code={`NEXT_PUBLIC_STELLO_RELAY_URL=http://localhost:3000/api/relay`} />
  <h2>Alternatif: sürekli relay döngüsü</h2><CodeBlock code={`# stello/ — kök .env içindeki LANDING_SECRET kullanılır\npnpm relayer`} /><p>Döngü çalışırken uygulamanın relay URL’si vermesi gerekmez. Endpoint, aynı işlemi talep üzerine tetikler. Her iki yol da router’ın ödeme referansı kontrolünü kullanır.</p>
  <h2>Başka uygulamalar bağlandığında</h2><p>Stello sunucusuna <code>STELLO_ALLOWED_ORIGINS</code> değişkeninde virgülle ayrılmış uygulama origin’lerini ekle. Örneğin <code>https://app.example.com,https://other.example.com</code>. Origin yalnız protokol ve alan adını içerir.</p><p>Endpoint tarayıcı CORS isteklerini bu listeye göre cevaplar. CORS kimlik doğrulama veya hız sınırı değildir. Sunucu başına eşzamanlı relay çağrıları birleştirilir; üretimde istek sınırı ve işletim izlemesi ayrıca gerekir.</p>
  <h2>Bir ödeme beklemede kalırsa</h2><ul><li>Anchor ödemesi <code>completed</code> durumuna ulaştı mı?</li><li>Relay çalışıyor ve doğru landing anahtarını kullanıyor mu?</li><li>Uygulamanın origin’i izin listesinde mi?</li><li>Rota güncel router’daki doğru kontrata mı işaret ediyor?</li></ul><p>Mevcut relay her geçişte son 50 ödemeyi inceler; üç kalıcı başarısızlıktan sonra o işlem için insan müdahalesi gerekir. Uzun kesinti ve yüksek trafik için kalıcı cursor/backfill desteği henüz yoktur.</p>
  <Link className="next-doc" href="/docs/example"><span>SIRADAKİ</span>Örnek uygulama ↗</Link>
</>; }

function Example() { return <>
  <p className="intro">Stello Kampanya, SDK’nın ilk tüketicisi: hedef tutmazsa katılımcılarına taahhütlerini ve bonus paylarını geri veren bağımsız bir uygulama.</p>
  <div className="callout"><strong>İki ayrı proje</strong><p><code>stello/</code> SDK, router, relay ve bu siteyi içerir. <code>stello-kampanya/</code> kendi arayüzünü, kampanya kontratını ve iş kurallarını içerir.</p></div>
  <h2>Örnek projeyi çalıştır</h2><CodeBlock code={`cd stello-kampanya\npnpm install\npnpm dev`} /><p>Örnek, SDK’yı herkes gibi registry’den kurar: <code>package.json</code> içinde <code>stello-sdk</code> normal bir bağımlılık olarak durur. Komşu bir Stello klasörü gerekmez — katmanın gerçekten paket olarak tüketilebildiğinin kanıtı da budur.</p>
  <h2>Entegrasyonun bulunduğu yerler</h2><div className="table-scroll"><table><thead><tr><th>Dosya</th><th>Sorumluluk</th></tr></thead><tbody><tr><td><code>lib/campaign/config.ts</code></td><td>Uygulamanın rota ve kontrat adresi</td></tr><tr><td><code>lib/campaign/flows.ts</code></td><td>Stello istemcisine kampanya argümanı verir</td></tr><tr><td><code>lib/campaign/contracts.ts</code></td><td>Kampanya kontratını SDK yardımcılarıyla çağırır</td></tr><tr><td><code>contracts/campaign</code></td><td>Hedef, süre, bonus, katılım ve iade kuralları</td></tr></tbody></table></div>
  <h2>Kendi uygulamana uyarlamak</h2><p>Kampanyanın iş kurallarını taşımana gerek yok. Kendi <code>on_deposit</code> fonksiyonunu ekle, kendi rotanı kaydet ve frontend’den kendi argümanını gönder. Örnek uygulamanın ödeme akışı, senin kullanacağın SDK ile aynıdır.</p>
  <a className="button primary" href={exampleUrl} target="_blank" rel="noreferrer">Örnek uygulamayı aç ↗</a>
  <Link className="next-doc" href="/docs/publishing"><span>SIRADAKİ</span>Paket ve yayın ↗</Link>
</>; }

function Publishing() { return <>
  <p className="intro">Stello <a href="https://www.npmjs.com/package/stello-sdk" target="_blank" rel="noreferrer">npm’de <code>stello-sdk</code></a> adıyla yayımlıdır. Bu sayfa yeni bir sürümün nasıl çıkarıldığını anlatır.</p>
  <h2>Yerel doğrulama</h2><CodeBlock code={`pnpm check\ncargo test\npnpm sdk:pack`} /><p><code>pnpm check</code> SDK testlerini, tip kontrolünü ve dokümantasyon sitesinin production build’ini çalıştırır. Pack sırasında derlenmiş JavaScript ve tip tanımları üretilir.</p>
  <h2>Yayın öncesi arşivi denetle</h2><p><code>pnpm sdk:pack</code> çıktısı yayımlanacak dosyaların tamamıdır. Yayından önce içeriğini oku: pakete yalnız <code>dist/</code>, <code>README.md</code>, <code>LICENSE</code> ve <code>package.json</code> girmelidir.</p><CodeBlock code={`tar -tzf artifacts/stello-sdk-0.1.0.tgz`} /><p>Aynı arşivi boş bir projede kurup içe aktarmak, yayından dönülemeyeceği için en ucuz sigortadır.</p>
  <h2>npm yayını</h2><p>Sürümü yükselt, sonra paket klasöründen yayınla. Hesapta iki adımlı doğrulama açıksa npm tarayıcıda onay ister; onay verilene kadar komut bekler.</p><CodeBlock code={`cd packages/core\nnpm version patch\nnpm publish --access public`} /><p>Yayın geri alınamaz: aynı sürüm numarası bir daha kullanılamaz ve <code>npm unpublish</code> yalnız dar bir zaman aralığında çalışır. Sürüm numarasını yayından önce doğrula.</p>
  <h2>Tüketicileri yükselt</h2><p>Bu repodaki deployment dosyaları SDK paketinin içine gömülür. Router, anchor veya landing adresi değişirse yeni bir sürüm çıkarmak zorunludur; aksi halde kurulu uygulamalar eski adresleri çağırmaya devam eder.</p><CodeBlock code={`pnpm add stello-sdk@latest`} />
  <h2>Web ve relay deploy’u</h2><p>Hosting üzerinde bu monoreponun kökünden <code>pnpm build</code> çalıştır. Next uygulaması <code>web/</code> altındadır. Relay için server ortamında landing anahtarı ve izinli origin’leri, örnek uygulama için public relay URL’sini tanımla.</p><p>SDK paketi testnet deployment’ını içinde taşır. Router, anchor veya landing değiştiğinde deployment dosyalarını güncelle, yeni SDK sürümü üret ve uygulamaları o sürüme geçir.</p>
</>; }

const pages: Record<string, () => ReactNode> = { installation: Installation, contracts: Contracts, sdk: Sdk, relay: Relay, example: Example, publishing: Publishing };

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Content = pages[slug];
  const doc = docs.find((d) => d.slug === slug);
  if (!Content || !doc) notFound();
  return <article className="prose"><p className="eyebrow">{doc.group}</p><h1>{doc.title}</h1><Content /></article>;
}
