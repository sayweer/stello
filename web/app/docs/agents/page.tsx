import type { Metadata } from "next";
import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import { agentFacts } from "@/lib/agent-guide";
import { siteOrigin } from "@/lib/origin";

export const metadata: Metadata = {
  title: "Ajanla entegrasyon",
  description:
    "Claude Code, Cursor veya Codex'e Stello'yu kendi projesine bağlatmak için gereken dosyalar.",
};

export default async function Agents() {
  const origin = await siteOrigin();
  return (
    <article className="prose">
      <p className="eyebrow">ENTEGRASYON</p>
      <h1>
        Entegrasyonu
        <br />
        ajanına yaptır.
      </h1>
      <p className="intro">
        Kodlama ajanları artık entegrasyonların çoğunu kendisi yazıyor. Stello, okuyup
        uygulayabilecekleri biçimde de yayımlanıyor: tek dosyalık rehber, Claude Code skill’i ve
        yapıştırılabilir bir <code>AGENTS.md</code> bloğu.
      </p>

      <div className="callout">
        <strong>Hepsi tek kaynaktan üretiliyor.</strong>
        <p>
          Adresler, rota kimlikleri ve sürüm numarası sitenin okuduğu deployment kaydından gelir.
          Ajanın okuduğu metinle bu dokümanların birbirinden ayrışması mümkün değil.
        </p>
      </div>

      <h2>Claude Code</h2>
      <p>
        Skill dosyasını projenin <code>.claude/skills/</code> klasörüne indir. Kullanıcı banka
        havalesiyle ödeme almaktan söz ettiğinde skill kendiliğinden devreye girer.
      </p>
      <CodeBlock
        code={`mkdir -p .claude/skills/stello-integration
curl -o .claude/skills/stello-integration/SKILL.md \\
  ${origin}/stello-skill.md`}
      />
      <p>
        Skill kısa tutuldu: ajanı önce <code>llms-full.txt</code> dosyasını okumaya yönlendirir,
        sonra sırayı ve yanlış yapılması kolay kuralları hatırlatır.
      </p>

      <h2>Cursor, Codex ve diğerleri</h2>
      <p>
        Aşağıdaki bloğu projenin <code>AGENTS.md</code> dosyasına ekle. Ödeme kodunu değiştiren her
        ajan, kuralları ve tam rehberin adresini önünde bulur.
      </p>
      <CodeBlock code={`curl ${origin}/agents-snippet.md >> AGENTS.md`} />

      <h2>Doğrudan rehber</h2>
      <p>
        Ajanına tek bir adres vermek yeterliyse bu. Sözleşme arayüzünden istemci koduna, güven
        modelinden sık yapılan hatalara kadar entegrasyonun tamamı tek dosyada.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Adres</th>
              <th>İçerik</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a href="/llms.txt">/llms.txt</a>
              </td>
              <td>Kısa dizin: ne olduğu ve hangi sayfada ne var</td>
            </tr>
            <tr>
              <td>
                <a href="/llms-full.txt">/llms-full.txt</a>
              </td>
              <td>Entegrasyonun tamamı; başka sayfaya ihtiyaç duymaz</td>
            </tr>
            <tr>
              <td>
                <a href="/stello-skill.md">/stello-skill.md</a>
              </td>
              <td>Claude Code skill dosyası</td>
            </tr>
            <tr>
              <td>
                <a href="/agents-snippet.md">/agents-snippet.md</a>
              </td>
              <td>AGENTS.md bloğu</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Ajana ne söylenir</h2>
      <p>
        Rehber, bir ajanın yanlış yapmaya en yatkın olduğu yerleri kural olarak ve sonucuyla
        birlikte yazar. Güvenlik açısından kritik olan ilki:
      </p>
      <ul>
        <li>
          <code>router.require_auth()</code> zorunludur — olmazsa herkes para göndermeden{" "}
          <code>on_deposit</code> çağırıp bakiye yazdırabilir.
        </li>
        <li>
          <code>false</code> dönmek, iadeyi kontratın kendisinin yaptığı anlamına gelir. Router
          senin yerine iade etmez.
        </li>
        <li>Panic bütün dispatch’i geri alır; para landing hesabında kalır.</li>
        <li>
          <code>amount</code> i128 stroop’tur; USDC yedi ondalıklıdır, 1 USDC = 10.000.000.
        </li>
        <li>Kullanıcı anahtarı saklanmalıdır — her render’da yeniden üretilmemelidir.</li>
        <li>
          <code>stello-sdk/server</code> relay’i taşır; istemci koduna hiç girmemelidir.
        </li>
        <li>
          Paket henüz npm’de olmadığı için <code>pnpm add stello-sdk</code> yazılmamalıdır.
        </li>
      </ul>

      <h2>Kontrolü ajana bırakma</h2>
      <p>
        Rehber, ajanın işini bitirdiğini varsaymak yerine doğrulamasını ister: router’da rotanın
        doğru kontrata baktığını, <code>findDispatch</code> ile ödemenin gerçekten dağıtıldığını ve
        hedef kontratın onu kaydettiğini kontrol ettirir.
      </p>
      <p className="muted">
        Testnet · SDK v{agentFacts.version} · Router{" "}
        <a
          className="address-link"
          href={`https://stellar.expert/explorer/testnet/contract/${agentFacts.router}`}
          target="_blank"
          rel="noreferrer"
        >
          {agentFacts.router} ↗
        </a>
      </p>

      <Link className="next-doc" href="/docs/example">
        <span>SIRADAKİ</span>Örnek uygulama ↗
      </Link>
    </article>
  );
}
