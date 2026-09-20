import { deployment, example } from "./site";
import type { Lang } from "./copy";

/**
 * The code a reader copies. Only the comments differ between languages; the
 * code itself must stay identical, so it is written once here and the comments
 * are substituted in.
 */
export type Snippets = {
  deposit: string;
  contract: string;
  route: string;
  full: string;
};

type Comments = {
  storedKey: string;
  showUser: string;
  tokensArrived: string;
  yourRules: string;
  persistKey: string;
  neverRandom: string;
  exampleRoute: string;
  mockOnly: string;
  rejected: string;
  reached: string;
};

const COMMENTS: Record<Lang, Comments> = {
  tr: {
    storedKey: "Uygulamanın sakladığı kullanıcı anahtarı",
    showUser: "Kullanıcıya payment.iban ve payment.reference göster.",
    tokensArrived: "Token'lar zaten bu kontratta.",
    yourRules: "Burada kendi iş kuralını uygula.",
    persistKey: "Bu anahtarı sonraki işlemler için sakla.",
    neverRandom: "Her istekte yeni bir anahtar üretme.",
    exampleRoute: "Testnet'teki örnek kumbara",
    mockOnly: "Yalnız mock anchor: gerçek havale göndermez.",
    rejected: "Ödeme hedef tarafından kabul edilmedi.",
    reached: "Kontrata ulaştı:",
  },
  en: {
    storedKey: "The user key your app persists",
    showUser: "Show payment.iban and payment.reference to the user.",
    tokensArrived: "The tokens are already in this contract.",
    yourRules: "Apply your own business rules here.",
    persistKey: "Persist this key for the transactions that follow.",
    neverRandom: "Do not generate a new one on every request.",
    exampleRoute: "The example piggy bank on testnet",
    mockOnly: "Mock anchor only: sends no real bank transfer.",
    rejected: "The target did not accept the payment.",
    reached: "Reached the contract:",
  },
};

export function getSnippets(lang: Lang): Snippets {
  const c = COMMENTS[lang];
  return {
    deposit: `import { Stello } from "stello-sdk";

const stello = new Stello({ route: ${example.routeId} });

const payment = await stello.requestDeposit({
  keypair, // ${c.storedKey}
  amountTry: "100",
  arg: new Uint8Array([1]),
});

// ${c.showUser}
const result = await stello.waitForDeposit({
  handle: payment,
});`,

    contract: `pub fn on_deposit(
    env: Env, user: Address, amount: i128, arg: Bytes,
) -> bool {
    let router: Address = env.storage().instance()
        .get(&DataKey::Router).unwrap();
    router.require_auth();

    // ${c.tokensArrived}
    // ${c.yourRules}
    true
}`,

    route: `stellar contract invoke \\
  --id ${deployment.routerId} \\
  --source-account YOUR_IDENTITY --network testnet \\
  -- register_route \\
  --owner YOUR_G_ADDRESS \\
  --target YOUR_CONTRACT_C_ADDRESS \\
  --name "My app"`,

    full: `import { Keypair } from "@stellar/stellar-sdk";
import { Stello } from "stello-sdk";

// ${c.persistKey}
// ${c.neverRandom}
const keypair = Keypair.random();
const stello = new Stello({
  route: ${example.routeId}, // ${c.exampleRoute}
  relayUrl: "http://localhost:3000/api/relay",
});

const payment = await stello.requestDeposit({
  keypair,
  amountTry: "100",
  arg: new Uint8Array([1]),
  onStep: (step, detail) => console.log(step, detail),
});
console.log(payment.iban, payment.reference);

// ${c.mockOnly}
await stello.simulateBankTransfer(payment, "100");

const result = await stello.waitForDeposit({ handle: payment });
if (!result.accepted) {
  console.log("${c.rejected}");
} else {
  console.log("${c.reached}", result.amount);
}`,
  };
}
