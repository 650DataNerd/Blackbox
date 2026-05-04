import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import crypto from "crypto";
import { RegistryEntry } from "./types";
import { logger } from "./logger";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export function hashData(data: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex")
    .slice(0, 16);
}

export async function writeToRegistry(
  connection: Connection,
  signer: Keypair,
  entry: RegistryEntry
): Promise<string> {
  const memoData = JSON.stringify(entry);
  const ix = new TransactionInstruction({
    keys: [{ pubkey: signer.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, "utf-8"),
  });
  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [signer]);
  logger.info(`Registry entry written on-chain`, {
    agent: entry.agentId,
    type: entry.type,
    hash: entry.dataHash,
    explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
  });
  return sig;
}
