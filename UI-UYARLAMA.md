# UI Uyarlama Haritası — Eunomia → Stello

Referans: `/Users/seyit/Desktop/eunomia/web` · Hedef: `/Users/seyit/Desktop/stello/web`
Kapsam (kullanıcı isteği): **açılış/onboarding ekranından ilk ekran girişine kadar tüm ekranlar ve animasyonlar.**

---

## 1. Referansta ne var (inceleme sonucu)

**Yığın:** Vite + React 19 · GSAP + ScrollTrigger + SplitText · Lenis (smooth scroll) · framer-motion (sayfa geçişi) · hash routing.

**İki ayrı tasarım sistemi:**

| | Landing (`.lp` scope, `landing.css`) | Shell/Dashboard (`index.css`, `shell.css`) |
|---|---|---|
| Zemin | Krem `#fcffd5` (dark: koyu yeşil `#152a03`) | Neredeyse siyah `#08080b` + aurora |
| Mürekkep | Koyu yeşil `#223e05` | Kırık beyaz |
| Vurgu | Fıstık yeşili `#a2cb28`, kırmızı `#a62021` | Spectral gradient, glass kartlar |
| Tipografi | Questrial (başlık), Geist (gövde) | Clash Display / Inter / JetBrains Mono |

**Açılış koreografisi** (`useReveal.ts` + `Hero.tsx`, referans "hero-1"):
1. Perde: iki krem panel ortada birleşik, marka adı dikişin üstünde ikiye bölünmüş (`Eu` | `nomia`); harfler `yPercent:100`'den `stagger .025` ile yükselir.
2. Dikiş 120px aralanır (arkada bir şey olduğunu gösterir).
3. Aralık viewport'u aşana dek açılır, iki yarı adı da dışarı taşır; açılan boşluğu yeşil dolgu doldurur.
4. Yeşil dolgu `yPercent:-100` ile yukarı kalkar → hero **zaten hazır** şekilde ortaya çıkar (başlık ayrıca animasyon almaz — "sayfa iki kez kuruluyor" hissi olmasın diye).
5. Nav linkleri `yPercent:110 → 0`, `expo.out`, `stagger .1`.
6. Başlığın iki yarısı ∓`0.05em` ayrılır; işaretli ifadenin altındaki vurgu `scaleX 0→1` ile dolar.
7. Kural çizgileri (`lp__rule`, `lp__counter-rule`) genişleyerek çizilir; destek blokları kutularından `expo.out` ile yükselir.

**Bölüm animasyonları:** başlıklarda satır satır "panel wipe" (SplitText + `scaleX`), kartlarda `clip-path: inset(0 0 100% 0)` açılımı, pinned scroll sahneleri (Proof/Privacy), yatay çizgi kaydırmaları.

**Akış:** Landing → (passkey oluştur) → `RecoverySetup` → `onEnter` → `AppShell` (sidebar + bottom-tabs + topbar). Geçiş `AnimatePresence mode="wait"` ile opacity + `y:-16`.

---

## 2. Eşleme: referans ekranı → Stello ekranı

| Referans | Stello karşılığı | Not |
|---|---|---|
| Curtain (`Eu`\|`nomia`) | Curtain (`Ste`\|`llo`) | Mekanik birebir; dikiş marka adının gerçek genişliğinden hesaplanıyor, ad değişince kendini ayarlar |
| Hero başlık: "You don't have to hand your agent the keys." | **"Kriptosuz da olsan, bu işe ortaksın."** (işaretli: "kriptosuz da olsan") | Tek kavram kuralı; alt metin: "Banka uygulamandan TL gönder. Hedef tutmazsa paran + payın kendiliğinden hesabına döner." |
| Hero CTA: "Create your treasury with a passkey" / "Sign in" / "I have a wallet" | **"Kampanyaya katıl"** / **"Kampanya aç"** / (link) "Nasıl çalışıyor?" | Passkey yok; katılım anahtarı arka planda üretilir |
| Sayaç: blocked / treasuries / actions + ödül rozeti | **Canlı zincir verisi**: kampanya sayısı · toplanan USDC · katılımcı sayısı | `listCampaigns()`'den; sahte sayı yok (jüri "mock yasak" diyor) |
| `Proof` (pinned sahne) | **"Para nerede?"** — havale → iniş hesabı → kontrat zinciri, scroll ile ilerleyen | Güven modelini görselleştirir |
| `HowItWorks` | **3 adım**: IBAN'a gönder → zincirde yerini alır → tutmazsa geri döner | |
| `Guarantees` | **"Ya olur ya kazanırsın"** — bonus mekaniği + kişi başı tavan | |
| `Privacy` | **"Kimin parası kimde"** — röle güven modeli, dürüst sınırlar | Zaafları saklamama ilkesi |
| `FinalCta` + `Footer` | Aynı yapı, Stello metinleri + GitHub/kontrat ID bağlantıları | |
| `RecoverySetup` (kurtarma kodu) | **"Hazırlanıyor"** adım listesi: hesap → trustline → anchor girişi → kimlik | `ensureReady`'nin `onStep`'i doğrudan besler |
| `AppShell` (sidebar/tabs) | Aynı iskelet: **Kampanyalar · Kampanya · Ekran · Ayarlar** | |
| `Overview` sayfası | **Kampanya listesi** | |
| `Payments` sayfası | **Kampanya detayı** (ilerleme, geri sayım, katıl, hakkım) | |

---

## 3. Teknik kararlar

1. **Next.js'te kalıyoruz** (referans Vite). Gerekçe: `/api/relay` çalışıyor, Vercel deploy'u kurulu, bileşenler zaten React. GSAP/Lenis `"use client"` + dinamik import ile (referans da dinamik import ediyor).
2. **CSS scope'ları korunuyor** (`.lp`, `.shell`). Scope'lu yazıldıkları için Next.js'te global CSS olarak import edilebilirler; CSS Modules'a çevirmeye gerek yok.
3. **Animasyon motoru (`useReveal`) taşınıyor**, seçiciler Stello bölümlerine göre yeniden bağlanıyor. `prefers-reduced-motion` yolu ve `.lp--pending` güvenliği aynen korunuyor.
4. **Veri katmanı zaten hazır**: `useWallet`/`useCampaign`/`useCampaignList`/`useFlow` → `@stello/core`. UI hiçbir yerde `stellar-sdk`'ya dokunmaz.
5. **Sahte veri yok**: sayaçlar ve kartlar zincirden okur; boş durumlar tasarlanır.
6. Bağımlılık eklenecek: `gsap`, `lenis`, `framer-motion`.

## 4. Taşınmayacaklar

Passkey/WalletKit, Supabase, treasury/agent/ZK bölümleri, feedback FAB, docs sitesi, Eunomia markası ve logosu (`EunomiaMark`), ödül rozeti, tema geçişi (view-transition) — ilk turda atlanır, zaman kalırsa eklenir.

## 5. Sıra

1. Bağımlılıklar + `app/globals.css` (belirteçler) + layout
2. Curtain + Hero + `useReveal` (açılış koreografisi) — **en görünür iş**
3. Landing bölümleri (Proof / HowItWorks / Guarantees / Privacy / FinalCta / Footer)
4. Onboarding ("Hazırlanıyor" adımları) + landing→app geçişi
5. AppShell + Kampanya listesi + Kampanya detayı
6. Ekran (projeksiyon) sayfası
