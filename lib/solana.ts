import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { logger } from "./logger";

export function getConnection(): Connection {
  const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  return new Connection(rpc, "confirmed");
}

export function loadKeypair(privateKeyBase58: string): Keypair {
  const decoded = bs58.decode(privateKeyBase58);
  return Keypair.fromSecretKey(decoded);
}

export async function getBalance(
  connection: Connection,
  pubkey: PublicKey
): Promise<number> {
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

export async function transferSOL(
  connection: Connection,
  from: Keypair,
  to: PublicKey,
  lamports: number
): Promise<string> {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports,
    })
  );
  const sig = await sendAndConfirmTransaction(connection, tx, [from]);
  logger.info(`Transfer confirmed`, {
    agent: "solana",
    from: from.publicKey.toBase58().slice(0, 8) + "...",
    to: to.toBase58().slice(0, 8) + "...",
    lamports,
    sig: sig.slice(0, 12) + "...",
  });
  return sig;
}

export async function airdropIfNeeded(
  connection: Connection,
  keypair: Keypair,
  minSOL = 0.5
): Promise<void> {
  const bal = await getBalance(connection, keypair.publicKey);
  if (bal < minSOL) {
    logger.info(`Balance low (${bal} SOL), requesting airdrop...`, { agent: "solana" });
    const sig = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(sig);
    logger.info(`Airdrop confirmed`, { agent: "solana" });
  }
}
