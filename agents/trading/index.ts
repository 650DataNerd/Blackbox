import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import cron from "node-cron";
import { getConnection, loadKeypair, airdropIfNeeded, transferSOL } from "../../lib/solana";
import { writeToRegistry, hashData } from "../../lib/registry";
import { logger } from "../../lib/logger";
import { IntelReport, TradeRecord } from "../../lib/types";

const AGENT_ID = "trading-v1";
const REPORTS_DIR = path.join(process.cwd(), "data", "reports");
const TRADES_DIR = path.join(process.cwd(), "data", "trades");
const PROCESSED_FILE = path.join(process.cwd(), "data", ".trades-processed.json");

if (!fs.existsSync(TRADES_DIR)) fs.mkdirSync(TRADES_DIR, { recursive: true });

function loadProcessed(): Set<string> {
  if (!fs.existsSync(PROCESSED_FILE)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(PROCESSED_FILE, "utf-8")));
}

function markProcessed(reportId: string) {
  const p = loadProcessed();
  p.add(reportId);
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify([...p], null, 2));
}

function decideAction(report: IntelReport): { action: "buy" | "sell" | "hold"; asset: string; note: string } {
  if (report.confidence < 0.6) {
    return { action: "hold", asset: "SOL", note: `Confidence too low (${report.confidence}) — holding` };
  }
  if (report.recommendedAction === "buy" && report.riskLevel !== "high") {
    return { action: "buy", asset: "SOL", note: `Buy signal, ${report.riskLevel} risk, confidence ${report.confidence}` };
  }
  if (report.recommendedAction === "sell") {
    return { action: "sell", asset: "SOL", note: `Sell signal, risk: ${report.riskLevel}` };
  }
  return { action: "hold", asset: "SOL", note: `No clear signal — holding` };
}

async function runTradingCycle(
  connection: ReturnType<typeof getConnection>,
  agentKeypair: ReturnType<typeof loadKeypair>
) {
  logger.info("Starting trading cycle", { agent: AGENT_ID });

  if (!fs.existsSync(REPORTS_DIR)) {
    logger.info("No reports directory yet", { agent: AGENT_ID });
    return;
  }

  const processed = loadProcessed();
  const reportFiles = fs
    .readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith(".json"))
    .filter(f => !processed.has(f.replace(".json", "")));

  if (reportFiles.length === 0) {
    logger.info("No new reports to act on", { agent: AGENT_ID });
    return;
  }

  for (const reportFile of reportFiles) {
    const report: IntelReport = JSON.parse(
      fs.readFileSync(path.join(REPORTS_DIR, reportFile), "utf-8")
    );

    logger.info(`Reading report ${report.id}`, { agent: AGENT_ID });

    const analysisKey = process.env.ANALYSIS_AGENT_PRIVATE_KEY;
    const priceLamports = parseInt(process.env.REPORT_PRICE_LAMPORTS || "2000000");
    let paymentTx: string | undefined;

    if (analysisKey) {
      try {
        const analysisKeypair = loadKeypair(analysisKey);
        paymentTx = await transferSOL(
          connection,
          agentKeypair,
          analysisKeypair.publicKey,
          priceLamports
        );
        logger.info(`Paid Analysis Agent ${priceLamports} lamports`, { agent: AGENT_ID });
      } catch (err: any) {
        logger.warn("Payment to Analysis Agent failed", { agent: AGENT_ID, error: err.message });
      }
    }

    const decision = decideAction(report);

    const trade: TradeRecord = {
      id: `trade-${Date.now()}`,
      executedAt: new Date().toISOString(),
      action: decision.action,
      asset: decision.asset,
      basedOnReportId: report.id,
      txSignature: paymentTx,
      status: "simulated",
      note: decision.note,
    };

    const tradePath = path.join(TRADES_DIR, `${trade.id}.json`);
    fs.writeFileSync(tradePath, JSON.stringify(trade, null, 2));

    logger.info(`Trade executed (simulated)`, {
      agent: AGENT_ID,
      action: trade.action,
      asset: trade.asset,
      note: trade.note,
    });

    try {
      await writeToRegistry(connection, agentKeypair, {
        type: "trade",
        agentId: AGENT_ID,
        dataHash: hashData(trade),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.warn("Registry write failed", { agent: AGENT_ID, error: err.message });
    }

    markProcessed(report.id);
  }
}

async function main() {
  logger.info("Trading Agent starting", { agent: AGENT_ID });

  const privateKey = process.env.TRADING_AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error("TRADING_AGENT_PRIVATE_KEY not set in .env");

  const connection = getConnection();
  const agentKeypair = loadKeypair(privateKey);

  logger.info(`Wallet: ${agentKeypair.publicKey.toBase58()}`, { agent: AGENT_ID });

  await airdropIfNeeded(connection, agentKeypair);
  await runTradingCycle(connection, agentKeypair);

  cron.schedule("10,25,40,55 * * * *", async () => {
    await runTradingCycle(connection, agentKeypair);
  });

  logger.info("Trading Agent running", { agent: AGENT_ID });
}

main().catch((err) => {
  logger.error("Trading Agent crashed", { agent: AGENT_ID, error: err.message });
  process.exit(1);
});
