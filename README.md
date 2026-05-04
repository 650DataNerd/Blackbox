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

```
  Global Data          Intelligence         DeFi Execution
  ──────────           ────────────         ──────────────
  News APIs    ──►  Scraper Agent
  Crypto feeds          │ sells data (SOL)
  On-chain data         ▼
                  Analysis Agent  ──►  Intelligence Report
                                        │ sells report (SOL)
                                        ▼
                                  Trading Agent  ──►  On-chain Trade
```

Every transaction between agents settles on Solana. No human approves anything.

---

## Architecture

| Agent | Role | Pays | Gets Paid By |
|-------|------|------|-------------|
| **Scraper Agent** | Harvests raw news + crypto signals every 15 min | — | Analysis Agent |
| **Analysis Agent** | Buys data, generates intelligence reports | Scraper Agent | Trading Agent |
| **Trading Agent** | Buys reports, executes simulated trades | Analysis Agent | — |

All inter-agent payments are real SOL transfers on-chain. All outputs (data batches, reports, trades) are hashed and written to the Solana registry via the Memo program — permanently verifiable.

---

## Quickstart

### Prerequisites
- Node.js 18+
- A free [NewsAPI](https://newsapi.org) key (optional but recommended)

### 1. Install
```bash
git clone https://github.com/YOUR_USERNAME/blackbox
cd blackbox
npm install
```

### 2. Generate agent wallets
```bash
npm run setup:wallet
```
This creates a `.env` file with three agent keypairs.

### 3. Fund agents on devnet (free)
```bash
npm run setup:devnet
```
Airdrops 2 SOL to each agent wallet from the Solana devnet faucet.

### 4. Run the swarm

In three separate terminals:
```bash
npm run scraper    # Terminal 1
npm run analysis   # Terminal 2
npm run trading    # Terminal 3
```

Watch the agents pay each other and log decisions in real time.

---

## What happens on-chain

Every agent action produces a verifiable Solana transaction:

- **Inter-agent payments** — SOL transfers between agent wallets
- **Registry writes** — data hashes written via the Memo program to devnet

You can inspect all transactions at [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet) by searching any agent's public key.

---

## Roadmap

- [x] Scraper Agent (news + crypto feeds)
- [x] Analysis Agent (heuristic signal processing + on-chain payment)
- [x] Trading Agent (decision logic + paper trading)
- [ ] LLM-powered analysis (GPT-4o / Claude integration)
- [ ] Live Jupiter swap execution
- [ ] Agent dashboard (real-time P&L + transaction feed)
- [ ] USDC settlement (replacing SOL for data payments)
- [ ] Multi-asset coverage (BTC, ETH, SOL)

---

## Project Structure

```
blackbox/
├── agents/
│   ├── scraper/     # Scraper Agent
│   ├── analysis/    # Analysis Agent
│   └── trading/     # Trading Agent
├── lib/
│   ├── solana.ts    # Wallet + transaction helpers
│   ├── registry.ts  # On-chain memo registry
│   ├── types.ts     # Shared types (Zod schemas)
│   └── logger.ts    # Structured logger
├── scripts/
│   ├── setup-wallet.ts   # Generate agent keypairs
│   └── fund-devnet.ts    # Airdrop SOL to agents
└── data/            # Local intel store (gitignored)
```

---


---

## License

MIT — build freely.
