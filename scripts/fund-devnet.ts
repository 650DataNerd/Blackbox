import dotenv from "dotenv";
dotenv.config();

import { getConnection, loadKeypair, getBalance, airdropIfNeeded } from "../lib/solana";

async function main() {
  console.log("\n💧 Black Box — Devnet Funder\n");
  const connection = getConnection();

  const agents = [
    { name: "Scraper",  key: process.env.SCRAPER_AGENT_PRIVATE_KEY },
    { name: "Analysis", key: process.env.ANALYSIS_AGENT_PRIVATE_KEY },
    { name: "Trading",  key: process.env.TRADING_AGENT_PRIVATE_KEY },
  ];

  for (const agent of agents) {
    if (!agent.key) {
      console.error(`❌ ${agent.name} private key missing in .env`);
      continue;
    }
    const kp = loadKeypair(agent.key);
    console.log(`Funding ${agent.name} Agent (${kp.publicKey.toBase58().slice(0, 12)}...)`);
    await airdropIfNeeded(connection, kp, 0.5);
    const bal = await getBalance(connection, kp.publicKey);
    console.log(`  ✅ Balance: ${bal.toFixed(4)} SOL\n`);
  }

  console.log("All agents funded. Ready to run the swarm.\n");
}

main().catch(console.error);
