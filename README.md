# Stello

**Bir havale, bir kontrat çağrısı.**

Stello, banka havalesiyle Soroban kontratlarını kullanmak için bir TypeScript SDK, router kontratı ve relay sağlar. Kullanıcı IBAN ve referans kodu görür; uygulamanın `on_deposit(user, amount, arg)` fonksiyonu USDC aktarımıyla aynı transaction içinde çağrılır.

Şu an Stellar testnet ve Türk mock anchor kullanılır. Gerçek banka havalesi/KYC yoktur. SDK henüz npm'de yayımlanmadı; bağımsız uygulamalarda `.tgz` paketi olarak kurulabilir.

## Projelerin sınırı

| Bu repo: `stello` | Ayrı proje: `stello-kampanya` |
| --- | --- |
| `packages/core`: yayımlanabilir `stello-sdk` | SDK'yı paket olarak kuran Next.js uygulaması |
| `contracts/router`: paylaşılan ödeme yönlendiricisi | Kendi `contracts/campaign` kontratı |
| `contracts/example-target`: küçük kumbara örneği | Kampanya, bonus, taahhüt ve iade iş kuralları |
| `web`: SDK tanıtımı, `/docs`, `/api/relay` | Kampanyanın arayüzü ve kullanıcı anahtarları |
| `scripts`: Stello deploy, relay ve e2e işlemleri | Kendi deployment kaydı ve rota kimliği |

Stello SDK'sı kampanyayı bilmez. Entegre eden uygulama landing hesabının secret'ını tutmaz. Kampanyanın eski web kaynakları Git geçmişindedir; yerel ayrıştırma yedeği `.scratch/pre-separation/web` altındadır ve commitlenmez.

## Yerel çalışma

Node.js **22.12+**, pnpm; kontratlar için Rust ve Stellar CLI gerekir.

```bash
pnpm install
pnpm dev
```

Tanıtım ve dokümantasyon: `http://localhost:3000`. Kök dev komutu önce SDK'yı derler. Web dev sunucusu kök `.env` dosyasını okur; relay için oradaki `LANDING_SECRET` kullanılır. Development modunda `http://localhost:3001` origin'ine varsayılan izin verilir. Hosting ortamında `LANDING_SECRET` ve `STELLO_ALLOWED_ORIGINS` açıkça tanımlanmalıdır.

```bash
pnpm check      # TS testleri, SDK tip kontrolü, SDK + web build
cargo test      # Router ve example-target testleri
pnpm sdk:pack   # artifacts/stello-sdk-0.1.0.tgz
```

## Başka bir projeye kur

Üretilen arşivi uygulamanın `vendor/` klasörüne kopyala:

```bash
pnpm add ./vendor/stello-sdk-0.1.0.tgz @stellar/stellar-sdk
```

```ts
import { Stello } from "stello-sdk";

const stello = new Stello({
  route: 2, // mevcut testnet kumbara örneği; kendi uygulaman için rota kaydet
  relayUrl: "http://localhost:3000/api/relay",
});

const payment = await stello.requestDeposit({
  keypair, // uygulamanın sakladığı kullanıcı anahtarı
  amountTry: "100",
  arg: new Uint8Array([1]),
});
// payment.iban ve payment.reference kullanıcıya gösterilir.
await stello.simulateBankTransfer(payment, "100"); // yalnız mock anchor
const result = await stello.waitForDeposit({ handle: payment });
```

Tam rehber: web'deki `/docs/installation`, paket API'si: [packages/core/README.md](packages/core/README.md).

Kendi kontratına `on_deposit` ekle; kayıtlı router için `require_auth()` çağır. Hedef kontratın aynı USDC token'ını kullanmalı. `register_route` ile aldığın id'yi istemciye ver. `arg` uygulamana aittir, en fazla 64 bayttır. `accepted: false` döndüren hedef iadeyi kendisi yapmalıdır.

## Relay

İki seçenek vardır:

- Stello web sunucusunda `POST /api/relay`; SDK `relayUrl` ile çağırır.
- Kök `.env` ile çalışan `pnpm relayer` sürekli döngüsü.

Sunucu işlevleri `stello-sdk/server` girişindedir. Landing key hiçbir zaman `NEXT_PUBLIC_` değişkeni, SDK paketi veya örnek uygulama içine girmez.

Stello işletmecisi cross-origin uygulamaları `STELLO_ALLOWED_ORIGINS=https://app.example.com,https://other.example.com` ile tanımlar. Endpoint CORS preflight destekler ve aynı sunucu örneğindeki eşzamanlı taramaları birleştirir. Dağıtık eşzamanlılık için son kontrol router'ın ödeme referansıdır.

## Deploy ve e2e

```bash
bash scripts/deploy.sh          # Yeni router deploy eder; config'i değiştirir
bash scripts/deploy-example.sh  # Yeni örnek kontrat + rota oluşturur
pnpm e2e --stage anchor
pnpm e2e --stage chain
pnpm e2e --stage full
```

Bu komutlar testnet'te işlem yapar. Deploy sonrası SDK'yı yeniden paketle ve tüketen uygulamaları güncelle. `deployments/testnet.json` ile üretilen `packages/core/src/deployment.ts` aynı kaydı taşır. `deployments/example.json` örnek hedefi tanımlar.

## npm ve GitHub yayını

1. `pnpm check`, `cargo test`, `pnpm sdk:pack` çalıştır; paketi ayrı uygulamada dene.
2. Stello refaktörünü kendi reposunda commit/push et.
3. npm hesabı ve paket adı/sürümünü doğrulayıp `packages/core` içinde `pnpm publish --access public` çalıştır.
4. Ayrı uygulamada `pnpm add stello-sdk@0.1.0` ile `file:vendor/...` bağımlılığını değiştir.
5. `stello-kampanya` projesini ayrı GitHub reposuna gönder ve deploy et.
6. Stello sitesinde `NEXT_PUBLIC_CAMPAIGN_URL` ile demo bağlantısını tanımla; relay izin listesine uygulamanın origin'ini ekle.

## Mevcut sınırlar

Relay ve anchor güvenilen taraflardır. Relay son 50 ödemeyi tarar; kalıcı cursor/backfill henüz yoktur. RPC event saklama süresi, uzun süre bekleyen ödeme takibini sınırlar. Tarayıcı anahtarı demo düzeyindedir; kurtarma, passkey ve mainnet rezerv sponsorluğu tamamlanmamıştır. Genel ağ/anchor yapılandırması v0.1'de SDK deployment'ına bağlıdır.
