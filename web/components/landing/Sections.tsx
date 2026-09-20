"use client";

/**
 * The body of the landing page. Each block answers one question a sceptical
 * reader actually has, in the order they ask it: how do I take part, where is
 * my money while this runs, and why would I go first.
 */

export function HowItWorks() {
  return (
    <section className="lp__section lp__divide" id="nasil">
      <div className="lp__in">
        <div className="lp__head">
          <p className="lp__k">Nasıl çalışır</p>
          <h2 className="lp__reveal-head">Üç adım. Hiçbirinde kripto yok.</h2>
        </div>

        <div className="lp__steps">
          <div className="lp__step lp__reveal-up">
            <i>01</i>
            <span>Kampanyanın IBAN'ına, sana özel açıklama koduyla havale gönder.</span>
          </div>
          <div className="lp__step lp__reveal-up">
            <i>02</i>
            <span>Para geldiği anda katılımın zincire yazılır, sayaç önünde akar.</span>
          </div>
          <div className="lp__step lp__reveal-up">
            <i>03</i>
            <span>Süre dolar: hedef tuttuysa iş olur, tutmadıysa paran IBAN'ına döner.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MoneyTrail() {
  return (
    <section className="lp__section lp__divide" id="para">
      <div className="lp__in">
        <div className="lp__head">
          <p className="lp__k">Para nerede</p>
          <h2 className="lp__reveal-head">
            Paran her an nerede, adı konmuş halde yazıyor.
          </h2>
          <p className="lp__lede">
            Bir havalenin kontrat çağrısına dönüşmesi dört durak sürüyor. Üçüncü durakta paran
            saniyeler boyunca bize emanet — bunu gizlemiyoruz, çünkü tasarımın en zayıf yeri orası.
          </p>
        </div>

        <div className="lp__trail lp__reveal-stagger">
          <div className="lp__trail-cell">
            <b>1 · Bankan</b>
            <span>TL'yi kendi bankandan gönderiyorsun. Uygulamamıza kart bilgisi girmiyorsun.</span>
          </div>
          <div className="lp__trail-cell">
            <b>2 · Anchor</b>
            <span>Lisanslı kurum TL'yi alıp karşılığı USDC'yi Stellar ağına bırakıyor.</span>
          </div>
          <div className="lp__trail-cell lp__trail-cell--held">
            <b>3 · İniş hesabı</b>
            <span>
              Birkaç saniye: röle ödemeyi görüp kontrata aktarıyor. Bu aralıkta emanetçi biziz.
            </span>
          </div>
          <div className="lp__trail-cell">
            <b>4 · Kontrat</b>
            <span>
              Para kontratta. Buradan sonra kuralı kod işletiyor; kimse tek başına çıkaramıyor.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Bonus() {
  return (
    <section className="lp__section lp__divide" id="bonus">
      <div className="lp__in">
        <div className="lp__head">
          <p className="lp__k">Ya olur ya kazanırsın</p>
          <h2 className="lp__reveal-head">
            Önce davranmak neden mantıklı olsun? Çünkü tutmazsa kazanıyorsun.
          </h2>
        </div>

        <div className="lp__cards lp__reveal-stagger">
          <div className="lp__card">
            <span className="lp__card-n">Organizatör</span>
            <h3>Bonusu baştan kilitler</h3>
            <p>
              Kampanya, bonus kontrata yatana kadar katılıma açılmıyor. Söz laf olarak değil, para
              olarak duruyor.
            </p>
          </div>
          <div className="lp__card">
            <span className="lp__card-n">Katılımcı</span>
            <h3>Tutmazsa payını alır</h3>
            <p>
              Hedef tutmazsa taahhüdünün tamamı <b>artı</b> bonustan payın hesabına geçer. Beklemenin
              ödülü yok; katılmanın var.
            </p>
          </div>
          <div className="lp__card">
            <span className="lp__card-n">Sınır</span>
            <h3>Kişi başı tavan</h3>
            <p>
              Bonus payı kişi başı bir tavana kadar sayılır. Son dakikada büyük para koyup bonusu
              toplamak işe yaramıyor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="lp__section">
      <div className="lp__final lp__reveal-up">
        <h2>Gece pizzası mı, toplu alım mı, atölye mi?</h2>
        <p className="lp__lede" style={{ margin: "14px auto 0" }}>
          Yeterli kişi çıkarsa olacak her iş için. Kimse riski tek başına almıyor.
        </p>
        <div className="lp__actions">
          <button className="lp__cta" onClick={onJoin} type="button">
            Kampanyalara bak
          </button>
        </div>
      </div>
    </section>
  );
}

export function Footer({ routerId, campaignId }: { routerId: string; campaignId: string }) {
  const explorer = (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`;

  return (
    <footer className="lp__footer">
      <span>
        <b>Stello</b> · Stellar testnet
      </span>
      <span className="lp__num" style={{ fontSize: 13 }}>
        <a href={explorer(routerId)} target="_blank" rel="noreferrer">
          router
        </a>
        {" · "}
        <a href={explorer(campaignId)} target="_blank" rel="noreferrer">
          kampanya
        </a>
      </span>
      <span>Test ağı — gerçek para değil.</span>
    </footer>
  );
}
