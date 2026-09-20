import type { Copy } from "./index";
import { deployment, example, exampleUrl } from "../site";
import { getSnippets } from "../snippets";

const s = getSnippets("tr");
const REPO = "https://github.com/sayweer/stello";

export const tr: Copy = {
  meta: {
    title: "Stello — Bir havale, bir kontrat çağrısı",
    template: "%s · Stello",
    description:
      "Banka havalelerini Soroban kontrat çağrılarına dönüştüren Stello SDK. Kurulum, entegrasyon rehberi ve örnek uygulama.",
  },

  chrome: {
    skip: "İçeriğe geç",
    brandHome: "Stello ana sayfa",
    menu: "Menü",
    mainMenu: "Ana menü",
    docs: "Dokümantasyon",
    example: "Örnek uygulama",
    start: "Başla",
    themeToggle: "Açık ve koyu tema arasında geçiş yap",
    langToggle: "Switch to English",
    footerTagline: "Bir havale, bir kontrat çağrısı.",
    footerNote: "Testnet · MIT",
  },

  home: {
    eyebrow: "STELLAR ÜZERİNDE · GELİŞTİRİCİLER İÇİN",
    heading: "Bir havale.\nBir kontrat",
    headingAccent: "çağrısı.",
    lead: "Kullanıcın banka uygulamasında kalır. Stello, havaleyi Soroban kontratına taşır ve fonksiyonunu parayla birlikte çağırır.",
    ctaPrimary: "Entegrasyona başla",
    ctaSecondary: "Nasıl çalışır?",
    codeCaption: "UYGULAMANA EKLE",
    codeLang: "TypeScript / ESM",
    deliveryTitle: "Para ulaştığında kodun çalışır.",
    deliveryText: "Arayüz, tutar ve iş kuralları senin. Havale akışı Stello’nun.",
    flowLabel: "Ödeme akışı",
    flow: [
      { step: "Banka havalesi", note: "TRY" },
      { step: "Anchor", note: "TRY → USDC" },
      { step: "Stello", note: "Ticket → dispatch" },
      { step: "Senin kontratın", note: "on_deposit()" },
    ],

    factsEyebrow: "ENTEGRASYONUN BÜYÜKLÜĞÜ",
    factsHeading: "Öğrenilecek yeni\nbir dünya yok.",
    factsLead:
      "Hepsi depodan ölçüldü — kullanım sayısı değil, entegrasyonun kendisinin boyutu. Kontratına bir fonksiyon, uygulamana bir paket.",
    facts: [
      { figure: "1", unit: "fonksiyon", note: "Kontratına eklediğin tek şey: on_deposit" },
      { figure: "64", unit: "bayt", note: "Uygulamana ait argüman; anlamı tamamen senin" },
      { figure: "7", unit: "KB", note: "Router kontratının derlenmiş boyutu" },
      { figure: "18", unit: "test", note: "Router ve örnek hedef kontrat testleri" },
      { figure: "2", unit: "bağımlılık", note: "SDK’nın tamamı; biri Stellar SDK’sı" },
      { figure: "0", unit: "cüzdan", note: "Kullanıcının kurması gereken" },
    ],

    stepsEyebrow: "TEK BİR ENTEGRASYON",
    stepsHeading: "Ürünün ne yapacağı\nsana kalmış.",
    stepsLead:
      "Bir kumbara, bir kampanya ya da kendi uygulaman. Stello ödeme yolunu sağlar; gelen paranın ne anlama geldiğine kontratın karar verir.",
    steps: [
      {
        index: "01 / KONTRAT",
        title: "Bir fonksiyon ekle.",
        text: "on_deposit ile kullanıcıyı, tutarı ve uygulamana ait argümanı al. Token’lar çağrıdan önce kontratına aktarılır.",
        link: "Kontrat arayüzü",
        href: "/docs/contracts",
      },
      {
        index: "02 / ROTA",
        title: "Kontratını bağla.",
        text: "Paylaşılan router’a bir rota kaydet. İzin istemez. Aldığın rota kimliği, uygulamanın ödemelerini doğru kontrata yönlendirir.",
        link: "Rota kaydı",
        href: "/docs/contracts#route",
      },
      {
        index: "03 / İSTEMCİ",
        title: "IBAN’ı göster.",
        text: "SDK ile ödeme talebi oluştur. Kullanıcıya IBAN ve referansı göster; kontrat çağrısının sonucunu takip et.",
        link: "SDK referansı",
        href: "/docs/sdk",
      },
    ],

    docsEyebrow: "GELİŞTİRİCİ REHBERİ",
    docsHeading: "Her adım\nyazılı.",
    docsLead:
      "Kurulumdan relay işletimine, kontrat arayüzünden yayın adımlarına kadar. Çalışan örnek kod ve testnet adresleriyle.",
    docBlurb: {
      "": "Ödemenin yolu, hangi parçanın kime ait olduğu ve güven modeli.",
      installation: "Paketi kur, anahtarı sakla, ilk ödemeyi uçtan uca çalıştır.",
      contracts: "on_deposit arayüzü, router yetkisi ve rota kaydı.",
      sdk: "Stello sınıfı, requestDeposit, waitForDeposit ve IBAN’a çekim.",
      relay: "Relay ne yapar, neden güvenilen taraftır, origin izinleri.",
      agents: "Claude Code, Cursor ve Codex’in okuyup uygulayabileceği rehber.",
      example: "Kumbara kontratı ve ayrı repoda duran kampanya uygulaması.",
      publishing: "Arşiv denetimi, sürümleme ve npm yayın adımları.",
    },
    repoGroup: "KAYNAK KOD",
    repoText: "Router kontratı, SDK ve örnek hedef — hepsi okunabilir. MIT.",

    exampleEyebrow: "İLK ENTEGRASYON",
    exampleHeading: "Ya olur,\nya kazanırsın.",
    exampleLead:
      "Hedefe ulaşamazsa katılımcısına parasını ve bonus payını geri veren bir kampanya uygulaması. Stello SDK’sını ayrı bir projeden, npm’den kurulu paket olarak kullanıyor.",
    exampleCta: "Canlı uygulamayı aç",
    exampleHow: "Nasıl entegre etti?",
    receiptEyebrow: "STELLO KAMPANYA",
    receiptHeading: "Havale ile katıl.\nSonucu kontrat belirlesin.",
    receiptRows: [
      ["Ödeme akışı", "stello-sdk"],
      ["Kampanya kuralları", "Uygulamanın kendi kontratı"],
      ["Router", "Paylaşılan, kendi rotasıyla"],
    ],
    receiptNote: "Aynı SDK. Ayrı kod tabanı.",

    closingEyebrow: "AÇIK KAYNAK · TESTNET",
    closingHeading: "İlk havaleyi\nkontratına ulaştır.",
    closingText:
      "Kurulum, kontrat arayüzü, relay bağlantısı ve çalışan örnek; hepsi geliştirici rehberinde. Router testnet’te yayında:",
    closingCta: "Kurulum rehberini aç",
  },

  codeBlock: {
    copy: "Kopyala",
    copied: "Kopyalandı",
    manual: "Seçerek kopyala",
    aria: "%s kodunu kopyala",
  },

  docsNav: {
    label: "GELİŞTİRİCİ REHBERİ",
    status: "Testnet önizlemesi",
    statusNote: "Gerçek banka havalesi içermez.",
    next: "SIRADAKİ",
  },

  install: {
    note: "Node.js 22.12+ gerekir. `@stellar/stellar-sdk` eşlenik bağımlılıktır; sürümünü uygulaman belirler.",
    managers: "Paket yöneticisi",
    copyAria: "Kurulum komutunu kopyala",
    copy: "Kopyala",
    copied: "Kopyalandı",
  },


  docs: {
    "": {
      title: "Stello nedir?",
      group: "BAŞLARKEN",
      heading: "Banka havalesinden\nkontrat çağrısına.",
      blocks: [
        {
          t: "intro",
          text: "Stello, Soroban uygulamalarına banka havalesiyle giriş ve IBAN’a geri çekim akışı ekleyen bir TypeScript SDK ve paylaşılan router kontratıdır.",
        },
        {
          t: "callout",
          strong: "Bugün ne çalışıyor?",
          text: "Stellar testnet, USDC ve Türk lirası akışını simüle eden mock anchor. SDK npm’de `stello-sdk` adıyla yayımlı. Gerçek banka havalesi ve gerçek KYC yok.",
        },
        { t: "h2", text: "Bir ödeme nasıl ilerler?" },
        {
          t: "steps",
          items: [
            {
              lead: "SDK bir ticket açar.",
              text: "Kullanıcı, hedef rota ve en fazla 64 baytlık uygulama argümanı router’a kaydedilir.",
            },
            {
              lead: "Anchor ödeme bilgilerini verir.",
              text: "Kullanıcı IBAN ve referans kodunu görür. Mock ortamda banka havalesi simüle edilir.",
            },
            {
              lead: "Ödeme landing hesabına gelir.",
              text: "Muxed adresin kimliği, ödemeyi ticket ile eşleştirir.",
            },
            {
              lead: "Relay router’ı çağırır.",
              text: "Router, USDC’yi hedef kontrata aktarır ve aynı transaction içinde `on_deposit` çağırır.",
            },
            {
              lead: "SDK sonucu okur.",
              text: "`Dispatched` eventi, hedefin çağrıldığını ve döndürdüğü `accepted` sonucunu bildirir.",
            },
          ],
        },
        { t: "h2", text: "Hangi parça kime ait?" },
        {
          t: "table",
          head: ["Stello", "Entegre eden uygulama"],
          rows: [
            ["Router, ticket ve ödeme yönlendirmesi", "Hedef kontrat ve iş kuralları"],
            ["Anchor istemcisi ve SDK", "Arayüz ve kullanıcı anahtarının saklanması"],
            ["Landing hesabı ve relay işletimi", "Rota kimliği, argüman biçimi ve sonuç ekranı"],
          ],
        },
        { t: "h2", text: "Güven modeli" },
        {
          t: "p",
          text: "Anchor ve relay güvenilen taraflardır. Para, dispatch öncesinde landing hesabında bulunur; relay miktarı router’a bildirir. Router ödeme referansını kaydeder ve token aktarımıyla hedef çağrısını atomik gerçekleştirir.",
        },
        {
          t: "p",
          text: "`accepted: false` otomatik olarak router’ın para iade ettiği anlamına gelmez. İadeyi hedef kontrat gerçekleştirmelidir. Hedef hata verirse aktarım ve kayıt geri alınır.",
        },
        {
          t: "p",
          text: "Testnet hesapları Friendbot ile fonlanır. Mainnet için rezerv ve ücret sponsorluğu, gerçek anchor/KYC, anahtar kurtarma ve relay işletimi ayrıca tasarlanmalıdır.",
        },
        { t: "h2", text: "Testnet kaydı" },
        { t: "p", text: `Depodaki deployment kaydına göre router: \`${deployment.routerId}\`` },
        {
          t: "p",
          text: "Bu kayıt canlı sağlık kontrolü değildir; testnet sıfırlanırsa deployment yenilenmelidir.",
        },
        { t: "next", href: "/docs/installation", label: "SDK’yı kur" },
      ],
    },

    installation: {
      title: "Kurulum",
      group: "BAŞLARKEN",
      blocks: [
        {
          t: "intro",
          text: "Node.js 22.12 veya üstü ve pnpm ile başla. `stello-sdk` 0.1 ESM olarak dağıtılır ve TypeScript tiplerini kendi içinde taşır.",
        },
        { t: "h2", text: "1. Paketi kur" },
        {
          t: "p",
          text: "Paket npm’de yayımlıdır; uygulaman bu repoya ya da bir `workspace:*` bağımlılığına ihtiyaç duymaz.",
        },
        { t: "code", code: "pnpm add stello-sdk @stellar/stellar-sdk" },
        {
          t: "p",
          text: "`@stellar/stellar-sdk` eşlenik bağımlılıktır: sürümünü uygulaman belirler, böylece projende tek bir kopyası bulunur. Tip tanımları paketin içinde gelir, ayrı bir `@types` paketi yoktur.",
        },
        { t: "h2", text: "2. Sunucu tarafını ayır" },
        {
          t: "p",
          text: "Relay `stello-sdk/server` alt yolundan gelir ve landing anahtarını taşır. Bu alt yol yalnızca sunucuda çalışan kodda içe aktarılmalıdır; istemci paketi (`stello-sdk`) hiçbir sır içermez.",
        },
        {
          t: "code",
          code: 'import { Stello } from "stello-sdk";          // istemci\nimport { relayOnce } from "stello-sdk/server"; // yalnız sunucu',
        },
        { t: "h2", text: "3. İlk ödemeyi oluştur" },
        {
          t: "p",
          text: `Örnekte kayıtlı kumbara rotası \`${example.routeId}\` kullanılır. Kendi uygulaman için [bir rota kaydet](/docs/contracts). Ödeme ilerleyebilmesi için [Stello relay’i çalışıyor olmalı](/docs/relay).`,
        },
        { t: "code", title: "integration.ts", code: s.full },
        {
          t: "p",
          text: "`amountTry` TL tutarını string olarak alır. Sonuçtaki `amount` yedi ondalık basamaklı USDC’nin en küçük birimidir; ekranda `fromStroops(result.amount)` kullan.",
        },
        { t: "h2", text: "Tarayıcı ve Next.js" },
        {
          t: "p",
          text: "Etkileşimli ödeme kodunu bir Client Component veya kullanıcı olayı içinde çalıştır. `arg` için standart `Uint8Array` kullan; global `Buffer` eklemek gerekmez.",
        },
        {
          t: "p",
          text: "Kullanıcı anahtarını işlemler arasında koru. SDK anahtarı senin yerine saklamaz. Örnek uygulama localStorage kullanır; site verilerini silmek anahtarı kaybettirir.",
        },
        { t: "next", href: "/docs/contracts", label: "Kontratını bağla" },
      ],
    },

    contracts: {
      title: "Kontrat ve rota",
      group: "ENTEGRASYON",
      blocks: [
        {
          t: "intro",
          text: "Stello, hedef kontratından tek bir giriş noktası bekler: `on_deposit`. Paranın nasıl kullanılacağı senin iş kuralındır.",
        },
        { t: "h2", text: "Fonksiyon arayüzü" },
        { t: "code", title: "Rust / Soroban", code: s.contract },
        {
          t: "p",
          text: `Bu parça tek başına bir kontrat değildir. Router adresini constructor’da sakla; tam derlenebilir örnek [contracts/example-target](${REPO}/tree/main/contracts/example-target) altında bulunur.`,
        },
        {
          t: "callout",
          strong: "Router yetkisini doğrula.",
          text: "`router.require_auth()` olmadan biri para aktarmadan `on_deposit` çağırıp bakiye yazdırabilir.",
        },
        { t: "h2", text: "Girdiler ve sonuçlar" },
        {
          t: "table",
          head: ["Alan", "Anlamı"],
          rows: [
            ["`user`", "Ticket’ı açan kullanıcı"],
            ["`amount`", "Kontrata ulaşmış token tutarı, i128"],
            ["`arg`", "Uygulamanın tanımladığı en fazla 64 bayt"],
            ["`true`", "Hedef ödemeyi kabul etti"],
            ["`false`", "Hedef reddetti; kullanıcıya iadeyi hedef yapar"],
            ["Panic / hata", "Dispatch bütünüyle geri alınır; para landing hesabında kalır"],
          ],
        },
        { t: "h2", text: "Rotayı bir kez kaydet", id: "route" },
        {
          t: "p",
          text: "Önce hedef kontratını, Stello router adresi ve aynı token adresiyle deploy et. Sonra Stellar CLI’da fonlanmış kimliğinle bu çağrıyı yap; yer tutucuları kendi değerlerinle değiştir.",
        },
        { t: "code", code: s.route },
        {
          t: "p",
          text: "Dönen sayıyı uygulamanda `new Stello({ route: YOUR_ROUTE_ID })` içine koy. Rota kaydı izinsizdir.",
        },
        { t: "h2", text: "Kumbara örneği" },
        {
          t: "p",
          text: "Örnek kontrat `arg[0] === 0` için parayı kullanıcıya iade eder. Diğer girdilerde kullanıcı bakiyesine yazar. Kullanıcı `withdraw` çağırdığında birikimi kendi Stellar hesabına döner.",
        },
        {
          t: "table",
          head: ["Adres", "Değer"],
          rows: [
            ["Router", `\`${deployment.routerId}\``],
            ["USDC token", `\`${deployment.usdc.sac}\``],
          ],
        },
        { t: "next", href: "/docs/sdk", label: "SDK referansı" },
      ],
    },

    sdk: {
      title: "SDK referansı",
      group: "ENTEGRASYON",
      blocks: [
        {
          t: "intro",
          text: "Uygulama kodunu `stello-sdk` üzerinden yaz. Landing hesabına erişen relay işlevleri ayrı `stello-sdk/server` girişindedir.",
        },
        { t: "h2", text: "Stello seçenekleri" },
        {
          t: "code",
          title: "client.ts",
          code: `import { Stello } from "stello-sdk";\n\nconst stello = new Stello({\n  route: ${example.routeId},\n  relayUrl: "http://localhost:3000/api/relay",\n});`,
        },
        {
          t: "p",
          text: "`route` zorunludur. `relayUrl` isteğe bağlıdır; çalışan relay döngüsü varsa ayrıca endpoint gerekmez. `router` seçeneği aynı ağdaki router adresini değiştirir; landing, token ve anchor yapılandırmasını değiştirmez.",
        },
        { t: "h2", text: "Ödeme oluştur ve takip et" },
        {
          t: "code",
          title: "deposit.ts",
          code: `const payment = await stello.requestDeposit({\n  keypair,\n  amountTry: "100",\n  arg: new Uint8Array([1]),\n});\n\n// payment.iban, payment.reference, payment.estimatedUsdc\nconst result = await stello.waitForDeposit({\n  handle: payment,\n  timeoutMs: 120_000,\n});\n// result: { ticket, amount, accepted, paymentRef }`,
        },
        {
          t: "p",
          text: "`requestDeposit` gerekli hesabı ve trustline’ı hazırlar, SEP-10 oturumu açar, mock KYC kaydını yapar ve ticket oluşturur. `waitForDeposit` önce anchor’ı, sonra router event’ini bekler. Zaman aşımı her aşama için ayrı uygulanır.",
        },
        {
          t: "p",
          text: "Ödeme handle’ı `bigint` ve oturum token’ı içerir. Doğrudan JSON’a çevrilemez; token’ı loglama veya paylaşma. Mevcut event araması RPC’nin sakladığı geçmişle sınırlıdır.",
        },
        { t: "h2", text: "Parayı IBAN’a geri çek" },
        {
          t: "code",
          title: "withdraw.ts",
          code: `import { invokeContract, fromStroops } from "stello-sdk";\n\n// Önce kendi kontratın kullanıcıya USDC'yi geri öder.\nawait invokeContract(targetId, keypair, "withdraw", {\n  user: keypair.publicKey(),\n});\nconst payout = await stello.withdrawToIban({ keypair });\nconsole.log(fromStroops(payout.usdc), payout.tryAmount);`,
        },
        {
          t: "p",
          text: "Varsayılan olarak kullanıcı hesabındaki tüm USDC çekilir. `amount` ile bigint tutar verebilirsin. Mock anchor en az 1 USDC ister; ödeme KYC’ye kayıtlı IBAN’a yönelir.",
        },
        { t: "h2", text: "Diğer yardımcılar" },
        {
          t: "table",
          head: ["API", "İşlev"],
          rows: [
            ["`ensureReady(keypair)`", "Hesap, trustline ve anchor oturumu"],
            ["`findDispatch(handle)`", "Router event’ini bir kez sorgula"],
            ["`readContract(id, method, args)`", "Kontrat durumunu simülasyonla oku"],
            ["`invokeContract(id, keypair, method, args)`", "İmzala, gönder ve sonucu bekle"],
            ["`toStroops / fromStroops`", "String ↔ bigint tutar dönüşümü"],
            ["`simulateBankTransfer(handle, amount)`", "Yalnız mock anchor havale simülasyonu"],
          ],
        },
        { t: "next", href: "/docs/relay", label: "Relay bağlantısı" },
      ],
    },

    relay: {
      title: "Relay bağlantısı",
      group: "ENTEGRASYON",
      blocks: [
        {
          t: "intro",
          text: "Relay’i Stello işletir. Entegre eden uygulama yalnız rota kimliğini ve varsa herkese açık relay URL’sini kullanır.",
        },
        { t: "h2", text: "Yerelde iki projeyi çalıştır" },
        {
          t: "code",
          code: "# stello/ içinde\npnpm dev\n# Dokümantasyon + /api/relay → http://localhost:3000\n\n# stello-kampanya/ içinde\npnpm dev\n# Örnek uygulama → http://localhost:3001",
        },
        {
          t: "p",
          text: "Stello dev komutu kök `.env` dosyasını okur; relay için `LANDING_SECRET` gerekir. Development modunda `http://localhost:3001` varsayılan olarak izinlidir. Hosting üzerinde anahtarı ve izin listesini sunucu ortamına tanımla. Sırrı hiçbir zaman `NEXT_PUBLIC_` ile adlandırma.",
        },
        {
          t: "code",
          title: "stello/web/.env.local",
          code: "LANDING_SECRET=<landing hesabının secret değeri>\nSTELLO_ALLOWED_ORIGINS=http://localhost:3001",
        },
        {
          t: "code",
          title: "stello-kampanya/.env.local",
          code: "NEXT_PUBLIC_STELLO_RELAY_URL=http://localhost:3000/api/relay",
        },
        { t: "h2", text: "Alternatif: sürekli relay döngüsü" },
        {
          t: "code",
          code: "# stello/ — kök .env içindeki LANDING_SECRET kullanılır\npnpm relayer",
        },
        {
          t: "p",
          text: "Döngü çalışırken uygulamanın relay URL’si vermesi gerekmez. Endpoint, aynı işlemi talep üzerine tetikler. Her iki yol da router’ın ödeme referansı kontrolünü kullanır.",
        },
        { t: "h2", text: "Başka uygulamalar bağlandığında" },
        {
          t: "p",
          text: "Stello sunucusuna `STELLO_ALLOWED_ORIGINS` değişkeninde virgülle ayrılmış uygulama origin’lerini ekle. Örneğin `https://app.example.com,https://other.example.com`. Origin yalnız protokol ve alan adını içerir.",
        },
        {
          t: "p",
          text: "Endpoint tarayıcı CORS isteklerini bu listeye göre cevaplar. CORS kimlik doğrulama veya hız sınırı değildir. Sunucu başına eşzamanlı relay çağrıları birleştirilir; üretimde istek sınırı ve işletim izlemesi ayrıca gerekir.",
        },
        { t: "h2", text: "Bir ödeme beklemede kalırsa" },
        {
          t: "list",
          items: [
            "Anchor ödemesi `completed` durumuna ulaştı mı?",
            "Relay çalışıyor ve doğru landing anahtarını kullanıyor mu?",
            "Uygulamanın origin’i izin listesinde mi?",
            "Rota güncel router’daki doğru kontrata mı işaret ediyor?",
          ],
        },
        {
          t: "p",
          text: "Mevcut relay her geçişte son 50 ödemeyi inceler; üç kalıcı başarısızlıktan sonra o işlem için insan müdahalesi gerekir. Uzun kesinti ve yüksek trafik için kalıcı cursor/backfill desteği henüz yoktur.",
        },
        { t: "next", href: "/docs/agents", label: "Ajanla entegrasyon" },
      ],
    },

    agents: {
      title: "Ajanla entegrasyon",
      group: "ENTEGRASYON",
      heading: "Entegrasyonu\najanına yaptır.",
      blocks: [
        {
          t: "intro",
          text: "Kodlama ajanları artık entegrasyonların çoğunu kendisi yazıyor. Stello, okuyup uygulayabilecekleri biçimde de yayımlanıyor: tek dosyalık rehber, Claude Code skill’i ve yapıştırılabilir bir `AGENTS.md` bloğu.",
        },
        {
          t: "callout",
          strong: "Hepsi tek kaynaktan üretiliyor.",
          text: "Adresler, rota kimlikleri ve sürüm numarası sitenin okuduğu deployment kaydından gelir. Ajanın okuduğu metinle bu dokümanların birbirinden ayrışması mümkün değil.",
        },
        { t: "h2", text: "Claude Code" },
        {
          t: "p",
          text: "Skill dosyasını projenin `.claude/skills/` klasörüne indir. Kullanıcı banka havalesiyle ödeme almaktan söz ettiğinde skill kendiliğinden devreye girer.",
        },
        {
          t: "code",
          code: "mkdir -p .claude/skills/stello-integration\ncurl -o .claude/skills/stello-integration/SKILL.md \\\n  {ORIGIN}/stello-skill.md",
        },
        {
          t: "p",
          text: "Skill kısa tutuldu: ajanı önce `llms-full.txt` dosyasını okumaya yönlendirir, sonra sırayı ve yanlış yapılması kolay kuralları hatırlatır.",
        },
        { t: "h2", text: "Cursor, Codex ve diğerleri" },
        {
          t: "p",
          text: "Aşağıdaki bloğu projenin `AGENTS.md` dosyasına ekle. Ödeme kodunu değiştiren her ajan, kuralları ve tam rehberin adresini önünde bulur.",
        },
        { t: "code", code: "curl {ORIGIN}/agents-snippet.md >> AGENTS.md" },
        { t: "h2", text: "Doğrudan rehber" },
        {
          t: "p",
          text: "Ajanına tek bir adres vermek yeterliyse bu. Sözleşme arayüzünden istemci koduna, güven modelinden sık yapılan hatalara kadar entegrasyonun tamamı tek dosyada. Bu dosyalar dilden bağımsızdır: ajanlar için İngilizce yayımlanır.",
        },
        {
          t: "table",
          head: ["Adres", "İçerik"],
          rows: [
            ["[/llms.txt](/llms.txt)", "Kısa dizin: ne olduğu ve hangi sayfada ne var"],
            ["[/llms-full.txt](/llms-full.txt)", "Entegrasyonun tamamı; başka sayfaya ihtiyaç duymaz"],
            ["[/stello-skill.md](/stello-skill.md)", "Claude Code skill dosyası"],
            ["[/agents-snippet.md](/agents-snippet.md)", "AGENTS.md bloğu"],
          ],
        },
        { t: "h2", text: "Ajana ne söylenir" },
        {
          t: "p",
          text: "Rehber, bir ajanın yanlış yapmaya en yatkın olduğu yerleri kural olarak ve sonucuyla birlikte yazar. Güvenlik açısından kritik olan ilki:",
        },
        {
          t: "list",
          items: [
            "`router.require_auth()` zorunludur — olmazsa herkes para göndermeden `on_deposit` çağırıp bakiye yazdırabilir.",
            "`false` dönmek, iadeyi kontratın kendisinin yaptığı anlamına gelir. Router senin yerine iade etmez.",
            "Panic bütün dispatch’i geri alır; para landing hesabında kalır.",
            "`amount` i128 stroop’tur; USDC yedi ondalıklıdır, 1 USDC = 10.000.000.",
            "Kullanıcı anahtarı saklanmalıdır — her render’da yeniden üretilmemelidir.",
            "`stello-sdk/server` relay’i taşır; istemci koduna hiç girmemelidir.",
            "Paket kendi tip tanımlarını taşır; `@types/stello-sdk` diye bir bağımlılık eklenmemelidir.",
          ],
        },
        { t: "h2", text: "Kontrolü ajana bırakma" },
        {
          t: "p",
          text: "Rehber, ajanın işini bitirdiğini varsaymak yerine doğrulamasını ister: router’da rotanın doğru kontrata baktığını, `findDispatch` ile ödemenin gerçekten dağıtıldığını ve hedef kontratın onu kaydettiğini kontrol ettirir.",
        },
        { t: "next", href: "/docs/example", label: "Örnek uygulama" },
      ],
    },

    example: {
      title: "Örnek uygulama",
      group: "KAYNAKLAR",
      blocks: [
        {
          t: "intro",
          text: "Stello Kampanya, SDK’nın ilk tüketicisi: hedef tutmazsa katılımcılarına taahhütlerini ve bonus paylarını geri veren bağımsız bir uygulama.",
        },
        {
          t: "callout",
          strong: "İki ayrı proje",
          text: "`stello/` SDK, router, relay ve bu siteyi içerir. `stello-kampanya/` kendi arayüzünü, kampanya kontratını ve iş kurallarını içerir.",
        },
        { t: "h2", text: "Örnek projeyi çalıştır" },
        { t: "code", code: "cd stello-kampanya\npnpm install\npnpm dev" },
        {
          t: "p",
          text: "Örnek, SDK’yı herkes gibi registry’den kurar: `package.json` içinde `stello-sdk` normal bir bağımlılık olarak durur. Komşu bir Stello klasörü gerekmez — katmanın gerçekten paket olarak tüketilebildiğinin kanıtı da budur.",
        },
        { t: "h2", text: "Entegrasyonun bulunduğu yerler" },
        {
          t: "table",
          head: ["Dosya", "Sorumluluk"],
          rows: [
            ["`lib/campaign/config.ts`", "Uygulamanın rota ve kontrat adresi"],
            ["`lib/campaign/flows.ts`", "Stello istemcisine kampanya argümanı verir"],
            ["`lib/campaign/contracts.ts`", "Kampanya kontratını SDK yardımcılarıyla çağırır"],
            ["`contracts/campaign`", "Hedef, süre, bonus, katılım ve iade kuralları"],
          ],
        },
        { t: "h2", text: "Kendi uygulamana uyarlamak" },
        {
          t: "p",
          text: "Kampanyanın iş kurallarını taşımana gerek yok. Kendi `on_deposit` fonksiyonunu ekle, kendi rotanı kaydet ve frontend’den kendi argümanını gönder. Örnek uygulamanın ödeme akışı, senin kullanacağın SDK ile aynıdır.",
        },
        { t: "button", href: exampleUrl, label: "Örnek uygulamayı aç" },
        { t: "next", href: "/docs/publishing", label: "Paket ve yayın" },
      ],
    },

    publishing: {
      title: "Paket ve yayın",
      group: "KAYNAKLAR",
      blocks: [
        {
          t: "intro",
          text: "Stello [npm’de `stello-sdk`](https://www.npmjs.com/package/stello-sdk) adıyla yayımlıdır. Bu sayfa yeni bir sürümün nasıl çıkarıldığını anlatır.",
        },
        { t: "h2", text: "Yerel doğrulama" },
        { t: "code", code: "pnpm check\ncargo test\npnpm sdk:pack" },
        {
          t: "p",
          text: "`pnpm check` SDK testlerini, tip kontrolünü ve dokümantasyon sitesinin production build’ini çalıştırır. Pack sırasında derlenmiş JavaScript ve tip tanımları üretilir.",
        },
        { t: "h2", text: "Yayın öncesi arşivi denetle" },
        {
          t: "p",
          text: "`pnpm sdk:pack` çıktısı yayımlanacak dosyaların tamamıdır. Yayından önce içeriğini oku: pakete yalnız `dist/`, `README.md`, `LICENSE` ve `package.json` girmelidir.",
        },
        { t: "code", code: "tar -tzf artifacts/stello-sdk-0.1.0.tgz" },
        {
          t: "p",
          text: "Aynı arşivi boş bir projede kurup içe aktarmak, yayından dönülemeyeceği için en ucuz sigortadır.",
        },
        { t: "h2", text: "npm yayını" },
        {
          t: "p",
          text: "Sürümü yükselt, sonra paket klasöründen yayınla. Hesapta iki adımlı doğrulama açıksa npm tarayıcıda onay ister; onay verilene kadar komut bekler.",
        },
        { t: "code", code: "cd packages/core\nnpm version patch\nnpm publish --access public" },
        {
          t: "p",
          text: "Yayın geri alınamaz: aynı sürüm numarası bir daha kullanılamaz ve `npm unpublish` yalnız dar bir zaman aralığında çalışır. Sürüm numarasını yayından önce doğrula.",
        },
        { t: "h2", text: "Tüketicileri yükselt" },
        {
          t: "p",
          text: "Bu repodaki deployment dosyaları SDK paketinin içine gömülür. Router, anchor veya landing adresi değişirse yeni bir sürüm çıkarmak zorunludur; aksi halde kurulu uygulamalar eski adresleri çağırmaya devam eder.",
        },
        { t: "code", code: "pnpm add stello-sdk@latest" },
        { t: "h2", text: "Siteyi ve relay’i yayına alma" },
        {
          t: "p",
          text: "Next uygulaması deponun kökünde değil `web/` altındadır. Barındırıcıda **kök dizini `web` olarak ayarla**; aksi halde kökteki `package.json` içinde `next` bulunmadığı için proje statik site sanılır ve derleme `public` klasörü arayarak başarısız olur.",
        },
        {
          t: "p",
          text: "Sunucu ortamına `LANDING_SECRET` ve `STELLO_ALLOWED_ORIGINS` tanımla. İzin listesinde entegre olan uygulamanın origin’i yoksa tarayıcıdan relay dürtülemez ve ödemeler relay’in kendi turunu bekler.",
        },
      ],
    },
  },
};
