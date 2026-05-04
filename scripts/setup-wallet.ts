import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import path from "path";

console.log("\n🤖 Black Box — Agent Wallet Generator\n");

const agents = ["SCRAPER", "ANALYSIS", "TRADING"];
const lines: string[] = [];

for (const agent of agents) {
  const kp = Keypair.generate();
  const privateKey = bs58.encode(kp.secretKey);
  const publicKey = kp.publicKey.toBase58();

  console.log(`${agent} AGENT`);
  console.log(`  Public key:  ${publicKey}`);
  console.log(`  Private key: ${privateKey}`);
  console.log();

  lines.push(`${agent}_AGENT_PRIVATE_KEY=${privateKey}`);
}

const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  let env = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
  for (const line of lines) {
    const [key] = line.split("=");
    env = env.replace(`${key}=`, line);
  }
  fs.writeFileSync(envPath, env);
  console.log("✅ .env file created with agent keys.\n");
} else {
  console.log("⚠️  .env already exists — keys not overwritten.\n");
}

console.log("Next: run  npm run setup:devnet\n");
