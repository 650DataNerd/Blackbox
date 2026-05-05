# ⬛ Black Box
### Autonomous Geopolitical Intelligence Syndicate

> A self-sustaining swarm of AI agents on Solana that autonomously scrape global intelligence, trade insights on-chain, and execute DeFi decisions — with no human in the loop.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network: Solana Devnet](https://img.shields.io/badge/Network-Solana%20Devnet-9945FF)](https://explorer.solana.com/?cluster=devnet)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178C6)](https://www.typescriptlang.org/)

---

## The Concept

Human analysts cannot process the velocity of global signals fast enough to act before markets price them in. Current AI tools speed up analysis but still require a human at every decision point.

Black Box eliminates that bottleneck entirely.

Three specialised agents operate in a closed loop:

\`\`\`
  Global Data          Intelligence         DeFi Execution
  ──────────           ────────────         ──────────────
  News APIs    ──►  Scraper Agent
  Crypto feeds          │ sells data (SOL)
  On-chain data         ▼
                  Analysis Agent  ──►  Intelligence Report
                                        │ sells report (SOL)
                                        ▼
                                  Trading Agent  ──►  On-chain Trade
\`\`\`

Every transaction between agents settles on Solana. No human approves anything.

---

## Architecture

| Agent | Role | Pays | Gets Paid By |
|-------|------|------|-------------|
| **Scraper Agent** | Harvests raw news + crypto signals every 15 min | — | Analysis Agent |
| **Analysis Agent** | Buys data, generates intelligence reports | Scraper Agent | Trading Agent |
| **Trading Agent** | Buys reports, executes simulated trades | Analysis Agent | — |

All inter-agent payments are real SOL transfers on-chain. All outputs are hashed and written to the Solana registry via the Memo program — permanently verifiable.

---

## Live On-Chain Activity

This is not a demo. These are real transactions on Solana devnet:

- Scraper Agent writes intel hashes on-chain every 15 minutes
- Analysis Agent autonomously pays Scraper Agent in SOL for data
- Trading Agent autonomously pays Analysis Agent in SOL for reports
- All decisions are recorded permanently on-chain

View live agent activity on [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet)

---

## Quickstart

### Prerequisites
- Node.js 18+

### 1. Install
\`\`\`bash
git clone https://github.com/650DataNerd/Blackbox
cd Blackbox
npm install
\`\`\`

### 2. Generate agent wallets
\`\`\`bash
npm run setup:wallet
\`\`\`

### 3. Fund agents on devnet (free)
\`\`\`bash
npm run setup:devnet
\`\`\`
Or fund manually at https://faucet.solana.com

### 4. Run the swarm

Open three terminals:
\`\`\`bash
npm run scraper    # Terminal 1
npm run analysis   # Terminal 2
npm run trading    # Terminal 3
\`\`\`

---

## Project Structure

\`\`\`
blackbox/
├── agents/
│   ├── scraper/     # Scraper Agent
│   ├── analysis/    # Analysis Agent
│   └── trading/     # Trading Agent
├── lib/
│   ├── solana.ts    # Wallet + transaction helpers
│   ├── registry.ts  # On-chain memo registry
│   ├── types.ts     # Shared Zod schemas
│   └── logger.ts    # Structured logger
├── scripts/
│   ├── setup-wallet.ts
│   └── fund-devnet.ts
└── data/
\`\`\`

---

## Roadmap

- [x] Scraper Agent (HackerNews, crypto feeds)
- [x] Analysis Agent (signal processing + on-chain payment)
- [x] Trading Agent (decision logic + paper trading)
- [x] Real inter-agent SOL payments on devnet
- [ ] LLM-powered analysis (Claude / GPT-4o)
- [ ] Live Jupiter swap execution
- [ ] Agent dashboard
- [ ] USDC settlement

---

## License

MIT

---

## On-Chain Program

The BlackBox Registry is a Rust smart contract deployed on Solana devnet.

**Program ID:** `4LCZpohjxXFNfT2KtTdPsqXNVbUxW2RwaW91CMv3geaQ`

View on Solana Explorer:
https://explorer.solana.com/address/4LCZpohjxXFNfT2KtTdPsqXNVbUxW2RwaW91CMv3geaQ?cluster=devnet
