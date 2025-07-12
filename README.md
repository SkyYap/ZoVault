# 🧿 Zovault — Token-Gated Vaults for Creative Communities

Zovault is a decentralized platform that lets creators **publish hidden content**, accessible only to holders of specific **Zora Coins**.

Inspired by the SCP Foundation, Zovault allows artists, writers, and builders to launch Vaults of mysterious, redacted, or creative lore — where **ownership of a token unlocks access to the story within**.

---

## 🌌 Key Features

- 🔐 **Token-Gated Access**  
  Every Vault is linked to a Zora Coin. Only wallets that hold the coin can unlock and read the hidden content.

- 🛠️ **Easy Vault Creation**  
  Connect your wallet, mint or link a Zora Coin, and publish your content — redacted previews and all.

- 🕰️ **Timeless Lore**  
  Vaults remain onchain forever. As long as someone holds the token, they can access the story — whether today or years from now.

- 💰 **Creator Incentives**  
  Vault creators earn from token purchases and can expand their stories with sequels, cross-Vault connections, or multimedia enhancements.

---

## 🔄 Use Case Example (Inspired by SCP Foundation)

1. The creator launches the first 10 mysterious Vaults — e.g. `Vault-001`, `Vault-002`, each linked to its own Zora Coin.
2. Community members mint their own Vaults using Zovault, contributing to a shared universe of anomalies, lore, and secrets.
3. The most compelling Vaults are curated and highlighted by the core community, growing the canon and increasing token value.
4. Token holders unlock deep lore, alternate endings, audio logs, or hidden case files within the Vault — accessible only to them.

---

## ⚙️ Tech Stack

- **Frontend:** Next.js + TailwindCSS
- **Wallet Connection & Onchain Checks:** wagmi, viem
- **Smart Contracts:** Zora CoinV4 (ERC20) for token gating

---

## 🧠 Why Zora Coins?

We use Zora Coins as the foundation of access control:
- They’re easy to mint, composable, and onchain.
- They act as “keys” to Vaults — simple, permissionless, and decentralized.
- They power creative economies by enabling both content access and creator revenue.

---

## 🚀 Goals After Hackathon

We plan to grow Zovault into the **first storytelling launchpad** on Zora — empowering creators to build **token-powered communities**, launch lore projects, and own their creative worlds.

---


## 🛠️ Getting Started (Local Dev)

```bash
git clone https://github.com/SkyYap/ZoVault.git
cd zovault
npm install
npm run dev
