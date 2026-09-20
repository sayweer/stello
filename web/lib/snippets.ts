import { deployment, example } from "./site";
export const depositSnippet = `import { Stello } from "stello-sdk";

const stello = new Stello({ route: ${example.routeId} });

const payment = await stello.requestDeposit({
  keypair, // Uygulamanın sakladığı kullanıcı anahtarı
  amountTry: "100",
  arg: new Uint8Array([1]),
});

// Kullanıcıya payment.iban ve payment.reference göster.
const result = await stello.waitForDeposit({
  handle: payment,
});`;
export const contractSnippet = `pub fn on_deposit(
    env: Env, user: Address, amount: i128, arg: Bytes,
) -> bool {
    let router: Address = env.storage().instance()
        .get(&DataKey::Router).unwrap();
    router.require_auth();

    // Token'lar zaten bu kontratta.
    // Burada kendi iş kuralını uygula.
    true
}`;
export const routeSnippet = `stellar contract invoke \\
  --id ${deployment.routerId} \\
  --source-account YOUR_IDENTITY --network testnet \\
  -- register_route \\
  --owner YOUR_G_ADDRESS \\
  --target YOUR_CONTRACT_C_ADDRESS \\
  --name "My app"`;
export const fullSnippet = `import { Keypair } from "@stellar/stellar-sdk";
import { Stello } from "stello-sdk";

// Bu anahtarı sonraki işlemler için sakla.
// Her istekte yeni bir anahtar üretme.
const keypair = Keypair.random();
const stello = new Stello({
  route: ${example.routeId}, // Testnet'teki örnek kumbara
  relayUrl: "http://localhost:3000/api/relay",
});

const payment = await stello.requestDeposit({
  keypair,
  amountTry: "100",
  arg: new Uint8Array([1]),
  onStep: (step, detail) => console.log(step, detail),
});
console.log(payment.iban, payment.reference);

// Yalnız mock anchor: gerçek havale göndermez.
await stello.simulateBankTransfer(payment, "100");

const result = await stello.waitForDeposit({ handle: payment });
if (!result.accepted) {
  console.log("Ödeme hedef tarafından kabul edilmedi.");
} else {
  console.log("Kontrata ulaştı:", result.amount);
}`;
