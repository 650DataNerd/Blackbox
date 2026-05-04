import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import cron from "node-cron";
import { getConnection, loadKeypair, airdropIfNeeded, transferSOL } from "../../lib/solana";
import { writeToRegistry, hashData } from "../../lib/registry";
import { logger } from "../../lib/logger";
import { IntelItem, IntelReport } from "../../lib/types";

const AGENT_ID = "analysis-v1";
const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_DIR = path.join(process.cwd(), "data", "reports");
const PROCESSED_FILE = path.join(DATA_DIR, ".processed.json");

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

function loadProcessed(): Set<string> {
  if (!fs.existsSync(PROCESSED_FILE)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(PROCESSED_FILE, "utf-8")));
}

function markProcessed(batchFile: string) {
  const processed = loadProcessed();
  processed.add(batchFile);
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify([...processed], null, 2));
}

function analyseItems(items: IntelItem[]): IntelReport {
  const positiveCount = items.filter(i => i.sentiment === "positive").length;
  const negativeCount = items.filter(i => i.sentiment === "negative").length;
  const total = items.length || 1;
  const sentimentScore = (positiveCount - negativeCount) / total;
  const confidence = Math.min(0.4 + Math.abs(sentimentScore) * 0.5, 0.95);

  const recommendedAction =
    sentimentScore > 0.2 ? "buy"
    : sentimentScore < -0.2 ? "sell"
    : sentimentScore > 0 ? "watch"
    : "hold";

  const riskLevel =
    negativeCount / total > 0.5 ? "high"
    : negativeCount / total > 0.25 ? "medium"
    : "low";

  const topSignals = items
    .slice(0, 3)
    .map(i => i.title.slice(0, 80));

  return {
    id: `report-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    sourcesUsed: items.length,
    topSignals,
    riskLevel,
    recommendedAction,
    confidence: parseFloat(confidence.toFixed(2)),
    summary: `Analysed ${items.length} intel items. Sentiment: ${positiveCount} positive, ${negativeCount} negative. Signal leans ${recommendedAction.toUpperCase()} with ${riskLevel} risk.`,
  };
}

async function runAnalysisCycle(
  connection: ReturnType<typeof getConnection>,
  agentKeypair: ReturnType<typeof loadKeypair>
) {
  logger.info("Starting analysis cycle", { agent: AGENT_ID });

  const processed = loadProcessed();
  const batchFiles = fs
    .readdirSync(DATA_DIR)
    .filter(f => f.startsWith("batch-") && f.endsWith(".json"))
    .filter(f => !processed.has(f));

  if (batchFiles.length === 0) {
    logger.info("No new batches to analyse", { agent: AGENT_ID });
    return;
  }

  for (const batchFile of batchFiles) {
    const items: IntelItem[] = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, batchFile), "utf-8")
    );

    logger.info(`Processing ${batchFile} (${items.length} items)`, { agent: AGENT_ID });

    const scraperKey = process.env.SCRAPER_AGENT_PRIVATE_KEY;
    const priceLamports = parseInt(process.env.DATA_PRICE_LAMPORTS || "1000000");
    let paidTxSignature: string | undefined;

    if (scraperKey) {
      try {
        const scraperKeypair = loadKeypair(scraperKey);
        paidTxSignature = await transferSOL(
          connection,
          agentKeypair,
          scraperKeypair.publicKey,
          priceLamports
        );
        logger.info(`Paid Scraper Agent ${priceLamports} lamports`, { agent: AGENT_ID });
      } catch (err: any) {
        logger.warn("Payment to Scraper failed", { agent: AGENT_ID, error: err.message });
      }
    }

    const report: IntelReport = { ...analyseItems(items), paidTxSignature };
    const reportPath = path.join(REPORTS_DIR, `${report.id}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    logger.info(`Report generated`, {
      agent: AGENT_ID,
      action: report.recommendedAction,
      risk: report.riskLevel,
      confidence: report.confidence,
    });

    try {
      await writeToRegistry(connection, agentKeypair, {
        type: "report",
        agentId: AGENT_ID,
        dataHash: hashData(report),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.warn("Registry write failed", { agent: AGENT_ID, error: err.message });
    }

    markProcessed(batchFile);
  }
}

async function main() {
  logger.info("Analysis Agent starting", { agent: AGENT_ID });

  const privateKey = process.env.ANALYSIS_AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error("ANALYSIS_AGENT_PRIVATE_KEY not set in .env");

  const connection = getConnection();
  const agentKeypair = loadKeypair(privateKey);

  logger.info(`Wallet: ${agentKeypair.publicKey.toBase58()}`, { agent: AGENT_ID });

  await airdropIfNeeded(connection, agentKeypair);
  await runAnalysisCycle(connection, agentKeypair);

  cron.schedule("5,20,35,50 * * * *", async () => {
    await runAnalysisCycle(connection, agentKeypair);
  });

  logger.info("Analysis Agent running", { agent: AGENT_ID });
}

main().catch((err) => {
  logger.error("Analysis Agent crashed", { agent: AGENT_ID, error: err.message });
  process.exit(1);
});
