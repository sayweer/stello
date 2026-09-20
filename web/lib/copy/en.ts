import type { Copy } from "./index";
import { deployment, example, exampleUrl } from "../site";
import { getSnippets } from "../snippets";

const s = getSnippets("en");
const REPO = "https://github.com/sayweer/stello";

export const en: Copy = {
  meta: {
    title: "Stello — A bank transfer is a contract call",
    template: "%s · Stello",
    description:
      "Stello turns bank transfers into Soroban contract calls. Installation, the integration guide and a working example app.",
  },

  chrome: {
    skip: "Skip to content",
    brandHome: "Stello home",
    menu: "Menu",
    mainMenu: "Main menu",
    docs: "Documentation",
    example: "Example app",
    start: "Get started",
    themeToggle: "Switch between light and dark theme",
    langToggle: "Türkçe'ye geç",
    footerTagline: "A bank transfer is a contract call.",
    footerNote: "Testnet · MIT",
  },

  home: {
    eyebrow: "BUILT ON STELLAR · FOR DEVELOPERS",
    heading: "One bank transfer.\nOne contract",
    headingAccent: "call.",
    lead: "Your user never leaves their banking app. Stello carries the transfer to your Soroban contract and calls your function with the money already there.",
    ctaPrimary: "Start integrating",
    ctaSecondary: "How does it work?",
    codeCaption: "ADD TO YOUR APP",
    codeLang: "TypeScript / ESM",
    deliveryTitle: "Your code runs when the money lands.",
    deliveryText: "The interface, the amount and the rules are yours. The transfer path is Stello's.",
    flowLabel: "Payment flow",
    flow: [
      { step: "Bank transfer", note: "TRY" },
      { step: "Anchor", note: "TRY → USDC" },
      { step: "Stello", note: "Ticket → dispatch" },
      { step: "Your contract", note: "on_deposit()" },
    ],

    factsEyebrow: "THE SIZE OF THE INTEGRATION",
    factsHeading: "There is no new world\nto learn.",
    factsLead:
      "Every number here was measured in the repository — not adoption, but how large the integration itself is. One function in your contract, one package in your app.",
    facts: [
      { figure: "1", unit: "function", note: "All you add to your contract: on_deposit" },
      { figure: "64", unit: "bytes", note: "Your app's own argument; its meaning is yours" },
      { figure: "7", unit: "KB", note: "The router contract, compiled" },
      { figure: "18", unit: "tests", note: "Covering the router and the example target" },
      { figure: "2", unit: "dependencies", note: "The whole SDK; one is the Stellar SDK" },
      { figure: "0", unit: "wallets", note: "For your user to install" },
    ],

    stepsEyebrow: "ONE INTEGRATION",
    stepsHeading: "What your product does\nis up to you.",
    stepsLead:
      "A piggy bank, a campaign, or whatever you are building. Stello provides the payment path; your contract decides what the arriving money means.",
    steps: [
      {
        index: "01 / CONTRACT",
        title: "Add one function.",
        text: "on_deposit hands you the user, the amount and your own argument. The tokens reach your contract before the call.",
        link: "Contract interface",
        href: "/docs/contracts",
      },
      {
        index: "02 / ROUTE",
        title: "Connect your contract.",
        text: "Register a route on the shared router. It asks no permission. The route id you get back sends your app's payments to the right contract.",
        link: "Route registration",
        href: "/docs/contracts#route",
      },
      {
        index: "03 / CLIENT",
        title: "Show the IBAN.",
        text: "Create a payment request with the SDK. Show your user the IBAN and reference, then follow the contract call to its result.",
        link: "SDK reference",
        href: "/docs/sdk",
      },
    ],

    docsEyebrow: "DEVELOPER GUIDE",
    docsHeading: "Every step\nis written down.",
    docsLead:
      "From installation to running the relay, from the contract interface to cutting a release. With code that runs and testnet addresses you can check.",
    docBlurb: {
      "": "How a payment travels, who owns which piece, and what you trust.",
      installation: "Install the package, persist the key, run a payment end to end.",
      contracts: "The on_deposit interface, router authorization and route registration.",
      sdk: "The Stello class, requestDeposit, waitForDeposit and cashing out to an IBAN.",
      relay: "What the relay does, why it is trusted, and how origins are allowed.",
      agents: "A guide Claude Code, Cursor and Codex can read and act on.",
      example: "The piggy bank contract and the campaign app in its own repository.",
      publishing: "Auditing the archive, versioning and the npm release steps.",
    },
    repoGroup: "SOURCE CODE",
    repoText: "The router contract, the SDK and the example target — all readable. MIT.",

    exampleEyebrow: "THE FIRST INTEGRATION",
    exampleHeading: "Either it happens,\nor you win.",
    exampleLead:
      "A campaign app that gives every backer their pledge and a share of the bonus back if the goal is missed. It uses the Stello SDK from a separate project, installed from npm like anyone else's.",
    exampleCta: "Open the live app",
    exampleHow: "How did it integrate?",
    receiptEyebrow: "STELLO CAMPAIGN",
    receiptHeading: "Join by bank transfer.\nLet the contract decide.",
    receiptRows: [
      ["Payment path", "stello-sdk"],
      ["Campaign rules", "The app's own contract"],
      ["Router", "Shared, with its own route"],
    ],
    receiptNote: "The same SDK. A separate codebase.",

    closingEyebrow: "OPEN SOURCE · TESTNET",
    closingHeading: "Get your first transfer\nto your contract.",
    closingText:
      "Installation, the contract interface, the relay connection and a working example are all in the developer guide. The router is live on testnet:",
    closingCta: "Open the installation guide",
  },

  codeBlock: {
    copy: "Copy",
    copied: "Copied",
    manual: "Select to copy",
    aria: "Copy the %s code",
  },

  docsNav: {
    label: "DEVELOPER GUIDE",
    status: "Testnet preview",
    statusNote: "No real bank transfers.",
    next: "NEXT",
  },

  install: {
    note: "Requires Node.js 22.12+. `@stellar/stellar-sdk` is a peer dependency, so your app pins its version.",
    managers: "Package manager",
    copyAria: "Copy the install command",
    copy: "Copy",
    copied: "Copied",
  },


  docs: {
    "": {
      title: "What is Stello?",
      group: "GETTING STARTED",
      heading: "From a bank transfer\nto a contract call.",
      blocks: [
        {
          t: "intro",
          text: "Stello is a TypeScript SDK and a shared router contract that give Soroban apps a way in by bank transfer — and a way back out to an IBAN.",
        },
        {
          t: "callout",
          strong: "What works today",
          text: "Stellar testnet, USDC, and a mock anchor that simulates the Turkish lira leg. The SDK is published on npm as `stello-sdk`. There are no real bank transfers and no real KYC.",
        },
        { t: "h2", text: "How a payment travels" },
        {
          t: "steps",
          items: [
            {
              lead: "The SDK opens a ticket.",
              text: "The user, the target route and up to 64 bytes of your own argument are recorded on the router.",
            },
            {
              lead: "The anchor returns payment details.",
              text: "The user sees an IBAN and a reference code. In the mock environment the transfer is simulated.",
            },
            {
              lead: "The payment reaches the landing account.",
              text: "The id carried by the muxed address is what matches the payment to its ticket.",
            },
            {
              lead: "The relay calls the router.",
              text: "The router moves the USDC to your contract and calls `on_deposit` in the same transaction.",
            },
            {
              lead: "The SDK reads the outcome.",
              text: "The `Dispatched` event reports that the target was called and what `accepted` it returned.",
            },
          ],
        },
        { t: "h2", text: "Who owns which piece" },
        {
          t: "table",
          head: ["Stello", "The integrating app"],
          rows: [
            ["The router, tickets and payment routing", "The target contract and its business rules"],
            ["The anchor client and the SDK", "The interface and persisting the user's key"],
            ["The landing account and running the relay", "The route id, the argument format and the result screen"],
          ],
        },
        { t: "h2", text: "What you are trusting" },
        {
          t: "p",
          text: "The anchor and the relay are trusted parties. Before dispatch the money sits in the landing account, and it is the relay that tells the router the amount. The router records the payment reference and makes the token transfer and the target call atomic.",
        },
        {
          t: "p",
          text: "`accepted: false` does not mean the router refunded anything. The refund is the target contract's job. If the target fails, both the transfer and the record are rolled back.",
        },
        {
          t: "p",
          text: "Testnet accounts are funded by Friendbot. Mainnet would need reserve and fee sponsorship, a real anchor and KYC, key recovery, and a relay someone operates — each a design problem of its own.",
        },
        { t: "h2", text: "On testnet" },
        { t: "p", text: `The router, per the deployment record in the repository: \`${deployment.routerId}\`` },
        {
          t: "p",
          text: "That record is not a live health check. If testnet is reset, the deployment has to be redone.",
        },
        { t: "next", href: "/docs/installation", label: "Install the SDK" },
      ],
    },

    installation: {
      title: "Installation",
      group: "GETTING STARTED",
      blocks: [
        {
          t: "intro",
          text: "You need Node.js 22.12 or newer and pnpm. `stello-sdk` 0.1 ships as ESM and carries its own TypeScript declarations.",
        },
        { t: "h2", text: "1. Install the package" },
        {
          t: "p",
          text: "The package is on npm; your app needs neither this repository nor a `workspace:*` dependency.",
        },
        { t: "code", code: "pnpm add stello-sdk @stellar/stellar-sdk" },
        {
          t: "p",
          text: "`@stellar/stellar-sdk` is a peer dependency: your app pins the version, so there is only ever one copy of it in your project. The type declarations come inside the package — there is no separate `@types` package to add.",
        },
        { t: "h2", text: "2. Keep the server side apart" },
        {
          t: "p",
          text: "The relay lives behind the `stello-sdk/server` subpath and carries the landing key. Import that subpath only from code that runs on a server; the client entry (`stello-sdk`) holds no secrets.",
        },
        {
          t: "code",
          code: 'import { Stello } from "stello-sdk";          // client\nimport { relayOnce } from "stello-sdk/server"; // server only',
        },
        { t: "h2", text: "3. Create your first payment" },
        {
          t: "p",
          text: `The example below uses the registered piggy-bank route \`${example.routeId}\`. For your own app, [register a route](/docs/contracts). A payment only moves while [the Stello relay is running](/docs/relay).`,
        },
        { t: "code", title: "integration.ts", code: s.full },
        {
          t: "p",
          text: "`amountTry` takes the lira amount as a string. The `amount` you get back is in the smallest unit of USDC, which has seven decimals; render it with `fromStroops(result.amount)`.",
        },
        { t: "h2", text: "In the browser and in Next.js" },
        {
          t: "p",
          text: "Run the interactive payment code inside a Client Component or a user event. Use a plain `Uint8Array` for `arg`; you do not need a global `Buffer`.",
        },
        {
          t: "p",
          text: "Persist the user's key between transactions. The SDK does not store it for you. The example app uses localStorage, which means clearing site data loses the key.",
        },
        { t: "next", href: "/docs/contracts", label: "Connect your contract" },
      ],
    },

    contracts: {
      title: "Contract and route",
      group: "INTEGRATION",
      blocks: [
        {
          t: "intro",
          text: "Stello expects one entry point from your target contract: `on_deposit`. What the money means is your business rule.",
        },
        { t: "h2", text: "The function interface" },
        { t: "code", title: "Rust / Soroban", code: s.contract },
        {
          t: "p",
          text: `This fragment is not a contract on its own. Store the router address in your constructor; a complete, compilable example lives in [contracts/example-target](${REPO}/tree/main/contracts/example-target).`,
        },
        {
          t: "callout",
          strong: "Check the router's authorization.",
          text: "Without `router.require_auth()`, anyone can call `on_deposit` and mint themselves a balance without sending a cent.",
        },
        { t: "h2", text: "Inputs and outcomes" },
        {
          t: "table",
          head: ["Field", "Meaning"],
          rows: [
            ["`user`", "The user who opened the ticket"],
            ["`amount`", "The token amount that reached the contract, as i128"],
            ["`arg`", "Up to 64 bytes your app defines"],
            ["`true`", "The target accepted the payment"],
            ["`false`", "The target refused; refunding the user is the target's job"],
            ["Panic / error", "The whole dispatch is rolled back; the money stays at the landing account"],
          ],
        },
        { t: "h2", text: "Register the route once", id: "route" },
        {
          t: "p",
          text: "Deploy your target contract first, with the Stello router address and the same token address. Then make this call from the Stellar CLI with a funded identity, replacing the placeholders with your own values.",
        },
        { t: "code", code: s.route },
        {
          t: "p",
          text: "Put the number it returns into `new Stello({ route: YOUR_ROUTE_ID })`. Registering a route is permissionless.",
        },
        { t: "h2", text: "The piggy-bank example" },
        {
          t: "p",
          text: "The example contract refunds the user when `arg[0] === 0`. For anything else it credits the user's balance. When the user calls `withdraw`, the balance goes back to their own Stellar account.",
        },
        {
          t: "table",
          head: ["Address", "Value"],
          rows: [
            ["Router", `\`${deployment.routerId}\``],
            ["USDC token", `\`${deployment.usdc.sac}\``],
          ],
        },
        { t: "next", href: "/docs/sdk", label: "SDK reference" },
      ],
    },

    sdk: {
      title: "SDK reference",
      group: "INTEGRATION",
      blocks: [
        {
          t: "intro",
          text: "Write your app code against `stello-sdk`. The relay functions, which reach the landing account, live behind the separate `stello-sdk/server` entry.",
        },
        { t: "h2", text: "Stello options" },
        {
          t: "code",
          title: "client.ts",
          code: `import { Stello } from "stello-sdk";\n\nconst stello = new Stello({\n  route: ${example.routeId},\n  relayUrl: "http://localhost:3000/api/relay",\n});`,
        },
        {
          t: "p",
          text: "`route` is required. `relayUrl` is optional; with a relay loop running you do not need an endpoint as well. The `router` option points at a different router on the same network — it does not change the landing, token or anchor configuration.",
        },
        { t: "h2", text: "Create a payment and follow it" },
        {
          t: "code",
          title: "deposit.ts",
          code: `const payment = await stello.requestDeposit({\n  keypair,\n  amountTry: "100",\n  arg: new Uint8Array([1]),\n});\n\n// payment.iban, payment.reference, payment.estimatedUsdc\nconst result = await stello.waitForDeposit({\n  handle: payment,\n  timeoutMs: 120_000,\n});\n// result: { ticket, amount, accepted, paymentRef }`,
        },
        {
          t: "p",
          text: "`requestDeposit` prepares the account and trustline, opens a SEP-10 session, files the mock KYC record and opens the ticket. `waitForDeposit` waits first for the anchor, then for the router's event, and applies the timeout to each stage separately.",
        },
        {
          t: "p",
          text: "The payment handle holds a `bigint` and a session token. It does not survive `JSON.stringify`, and the token should never be logged or shared. Looking up an existing event is limited to the history the RPC still keeps.",
        },
        { t: "h2", text: "Cash out to an IBAN" },
        {
          t: "code",
          title: "withdraw.ts",
          code: `import { invokeContract, fromStroops } from "stello-sdk";\n\n// Your own contract pays the USDC back to the user first.\nawait invokeContract(targetId, keypair, "withdraw", {\n  user: keypair.publicKey(),\n});\nconst payout = await stello.withdrawToIban({ keypair });\nconsole.log(fromStroops(payout.usdc), payout.tryAmount);`,
        },
        {
          t: "p",
          text: "By default this withdraws the user's entire USDC balance; pass `amount` as a bigint to withdraw less. The mock anchor requires at least 1 USDC, and pays out to the IBAN on the KYC record.",
        },
        { t: "h2", text: "Other helpers" },
        {
          t: "table",
          head: ["API", "What it does"],
          rows: [
            ["`ensureReady(keypair)`", "Account, trustline and anchor session"],
            ["`findDispatch(handle)`", "Query the router event once"],
            ["`readContract(id, method, args)`", "Read contract state by simulation"],
            ["`invokeContract(id, keypair, method, args)`", "Sign, send and await the result"],
            ["`toStroops / fromStroops`", "Convert amounts between string and bigint"],
            ["`simulateBankTransfer(handle, amount)`", "Mock anchor only: simulate the transfer"],
          ],
        },
        { t: "next", href: "/docs/relay", label: "The relay connection" },
      ],
    },

    relay: {
      title: "The relay connection",
      group: "INTEGRATION",
      blocks: [
        {
          t: "intro",
          text: "Stello runs the relay. An integrating app only ever needs its route id and, optionally, the public relay URL.",
        },
        { t: "h2", text: "Running both projects locally" },
        {
          t: "code",
          code: "# in stello/\npnpm dev\n# Docs + /api/relay → http://localhost:3000\n\n# in stello-kampanya/\npnpm dev\n# Example app → http://localhost:3001",
        },
        {
          t: "p",
          text: "Stello's dev command reads the root `.env`, where the relay needs `LANDING_SECRET`. In development `http://localhost:3001` is allowed by default. On a host, put the key and the allowlist in the server environment. Never name a secret with a `NEXT_PUBLIC_` prefix.",
        },
        {
          t: "code",
          title: "stello/web/.env.local",
          code: "LANDING_SECRET=<the landing account's secret>\nSTELLO_ALLOWED_ORIGINS=http://localhost:3001",
        },
        {
          t: "code",
          title: "stello-kampanya/.env.local",
          code: "NEXT_PUBLIC_STELLO_RELAY_URL=http://localhost:3000/api/relay",
        },
        { t: "h2", text: "Alternative: a continuous relay loop" },
        {
          t: "code",
          code: "# stello/ — uses LANDING_SECRET from the root .env\npnpm relayer",
        },
        {
          t: "p",
          text: "While the loop runs, an app does not need to supply a relay URL at all. The endpoint simply triggers the same work on demand. Both paths rely on the router's payment-reference check, so neither can pay twice.",
        },
        { t: "h2", text: "When other apps connect" },
        {
          t: "p",
          text: "Add their origins to `STELLO_ALLOWED_ORIGINS` on the Stello server, comma separated — for example `https://app.example.com,https://other.example.com`. An origin is the scheme and host only, with no path.",
        },
        {
          t: "p",
          text: "The endpoint answers browser CORS requests against that list. CORS is neither authentication nor a rate limit. Concurrent relay calls are coalesced per server; a production deployment still needs request limits and operational monitoring.",
        },
        { t: "h2", text: "If a payment is stuck" },
        {
          t: "list",
          items: [
            "Did the anchor payment reach `completed`?",
            "Is the relay running, and with the right landing key?",
            "Is the app's origin on the allowlist?",
            "Does the route point at the right contract on the current router?",
          ],
        },
        {
          t: "p",
          text: "The relay examines the last 50 payments on each pass, and after three lasting failures that payment needs a human. Persistent cursors and backfill, which a long outage or heavy traffic would require, do not exist yet.",
        },
        { t: "next", href: "/docs/agents", label: "Integrating with an agent" },
      ],
    },

    agents: {
      title: "Integrating with an agent",
      group: "INTEGRATION",
      heading: "Let your agent\ndo the integration.",
      blocks: [
        {
          t: "intro",
          text: "Coding agents now write most of an integration themselves. So Stello is also published in a form they can read and act on: a single-file guide, a Claude Code skill and an `AGENTS.md` block you can paste.",
        },
        {
          t: "callout",
          strong: "All generated from one source.",
          text: "The addresses, route ids and version number come from the same deployment record the site reads. What the agent reads cannot drift from what these pages say.",
        },
        { t: "h2", text: "Claude Code" },
        {
          t: "p",
          text: "Download the skill file into your project's `.claude/skills/` directory. It activates on its own as soon as the user mentions taking payment by bank transfer.",
        },
        {
          t: "code",
          code: "mkdir -p .claude/skills/stello-integration\ncurl -o .claude/skills/stello-integration/SKILL.md \\\n  {ORIGIN}/stello-skill.md",
        },
        {
          t: "p",
          text: "The skill is kept short on purpose: it sends the agent to `llms-full.txt` first, then reminds it of the order of work and the rules that are easy to get wrong.",
        },
        { t: "h2", text: "Cursor, Codex and the rest" },
        {
          t: "p",
          text: "Append the block below to your project's `AGENTS.md`. Any agent that touches the payment code then finds the rules, and the address of the full guide, in front of it.",
        },
        { t: "code", code: "curl {ORIGIN}/agents-snippet.md >> AGENTS.md" },
        { t: "h2", text: "The guide itself" },
        {
          t: "p",
          text: "If handing your agent a single address is enough, this is it. From the contract interface to the client code, from the trust model to the common mistakes — the whole integration in one file. These files are language independent: they are published in English, for agents.",
        },
        {
          t: "table",
          head: ["Address", "Contents"],
          rows: [
            ["[/llms.txt](/llms.txt)", "A short index: what this is and which page holds what"],
            ["[/llms-full.txt](/llms-full.txt)", "The whole integration; it needs no other page"],
            ["[/stello-skill.md](/stello-skill.md)", "The Claude Code skill file"],
            ["[/agents-snippet.md](/agents-snippet.md)", "The AGENTS.md block"],
          ],
        },
        { t: "h2", text: "What the agent is told" },
        {
          t: "p",
          text: "The guide states the places an agent is most likely to get wrong as rules, each with its consequence. The security-critical one comes first:",
        },
        {
          t: "list",
          items: [
            "`router.require_auth()` is mandatory — without it anyone can call `on_deposit` and mint a balance without paying.",
            "Returning `false` means the contract has already refunded the user. The router will not do it for you.",
            "A panic rolls the entire dispatch back; the money stays at the landing account.",
            "`amount` is i128 stroops; USDC has seven decimals, so 1 USDC is 10,000,000.",
            "The user's keypair must be persisted, never regenerated on each render.",
            "`stello-sdk/server` carries the relay and must never reach client code.",
            "The package ships its own declarations; there is no `@types/stello-sdk` to add.",
          ],
        },
        { t: "h2", text: "Not taking the agent's word for it" },
        {
          t: "p",
          text: "Rather than let the agent assume it is finished, the guide makes it verify: that the route on the router points at the right contract, that `findDispatch` shows the payment really was dispatched, and that the target contract recorded it.",
        },
        { t: "next", href: "/docs/example", label: "The example app" },
      ],
    },

    example: {
      title: "The example app",
      group: "RESOURCES",
      blocks: [
        {
          t: "intro",
          text: "Stello Campaign is the SDK's first consumer: a standalone app that returns every backer's pledge, plus a share of the bonus, when the goal is missed.",
        },
        {
          t: "callout",
          strong: "Two separate projects",
          text: "`stello/` holds the SDK, the router, the relay and this site. `stello-kampanya/` holds its own interface, its campaign contract and its business rules.",
        },
        { t: "h2", text: "Run the example" },
        { t: "code", code: "cd stello-kampanya\npnpm install\npnpm dev" },
        {
          t: "p",
          text: "The example installs the SDK from the registry like anyone else would: in its `package.json`, `stello-sdk` is an ordinary dependency. No neighbouring Stello directory is required — which is also the proof that the layer really can be consumed as a package.",
        },
        { t: "h2", text: "Where the integration lives" },
        {
          t: "table",
          head: ["File", "Responsibility"],
          rows: [
            ["`lib/campaign/config.ts`", "The app's route and contract address"],
            ["`lib/campaign/flows.ts`", "Hands the campaign argument to the Stello client"],
            ["`lib/campaign/contracts.ts`", "Calls the campaign contract through the SDK helpers"],
            ["`contracts/campaign`", "Goal, deadline, bonus, pledging and refund rules"],
          ],
        },
        { t: "h2", text: "Adapting it to your own app" },
        {
          t: "p",
          text: "You do not need to carry the campaign's business rules over. Add your own `on_deposit`, register your own route, and send your own argument from the frontend. The payment flow in the example is the same SDK you will be using.",
        },
        { t: "button", href: exampleUrl, label: "Open the example app" },
        { t: "next", href: "/docs/publishing", label: "Package and release" },
      ],
    },

    publishing: {
      title: "Package and release",
      group: "RESOURCES",
      blocks: [
        {
          t: "intro",
          text: "Stello is published on npm as [`stello-sdk`](https://www.npmjs.com/package/stello-sdk). This page covers how a new version is cut.",
        },
        { t: "h2", text: "Verify locally" },
        { t: "code", code: "pnpm check\ncargo test\npnpm sdk:pack" },
        {
          t: "p",
          text: "`pnpm check` runs the SDK tests, the type check and a production build of the documentation site. Packing produces the compiled JavaScript and the type declarations.",
        },
        { t: "h2", text: "Audit the archive before publishing" },
        {
          t: "p",
          text: "Whatever `pnpm sdk:pack` produces is exactly what gets published. Read it first: the package should contain `dist/`, `README.md`, `LICENSE` and `package.json`, and nothing else.",
        },
        { t: "code", code: "tar -tzf artifacts/stello-sdk-0.1.0.tgz" },
        {
          t: "p",
          text: "Installing that same archive in an empty project and importing it is the cheapest insurance there is, because a release cannot be taken back.",
        },
        { t: "h2", text: "Publishing to npm" },
        {
          t: "p",
          text: "Bump the version, then publish from the package directory. If the account has two-factor authentication enabled, npm asks for confirmation in a browser and waits until it is given.",
        },
        { t: "code", code: "cd packages/core\nnpm version patch\nnpm publish --access public" },
        {
          t: "p",
          text: "A release is permanent: the same version number can never be reused, and `npm unpublish` only works within a narrow window. Check the version number before you publish it.",
        },
        { t: "h2", text: "Upgrading consumers" },
        {
          t: "p",
          text: "The deployment records in this repository are baked into the package. If the router, anchor or landing address changes, a new version is mandatory — otherwise installed apps keep calling the old addresses.",
        },
        { t: "code", code: "pnpm add stello-sdk@latest" },
        { t: "h2", text: "Deploying the site and the relay" },
        {
          t: "p",
          text: "The Next.js app is not at the repository root; it is under `web/`. **Set the host's root directory to `web`.** Otherwise the root `package.json` has no `next` dependency, the project is taken for a static site, and the build fails looking for a `public` directory.",
        },
        {
          t: "p",
          text: "Define `LANDING_SECRET` and `STELLO_ALLOWED_ORIGINS` in the server environment. Without the integrating app's origin on the allowlist, a browser cannot nudge the relay and payments wait for its next pass.",
        },
      ],
    },
  },
};
