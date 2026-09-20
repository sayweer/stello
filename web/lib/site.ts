import deployment from "../../deployments/testnet.json";
import example from "../../deployments/example.json";
export { deployment, example };
export const docs = [
  { slug: "", title: "Stello nedir?", group: "BAŞLARKEN" },
  { slug: "installation", title: "Kurulum", group: "BAŞLARKEN" },
  { slug: "contracts", title: "Kontrat ve rota", group: "ENTEGRASYON" },
  { slug: "sdk", title: "SDK referansı", group: "ENTEGRASYON" },
  { slug: "relay", title: "Relay bağlantısı", group: "ENTEGRASYON" },
  { slug: "agents", title: "Ajanla entegrasyon", group: "ENTEGRASYON" },
  { slug: "example", title: "Örnek uygulama", group: "KAYNAKLAR" },
  { slug: "publishing", title: "Paket ve yayın", group: "KAYNAKLAR" },
] as const;
