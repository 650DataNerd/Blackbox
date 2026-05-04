import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import crypto from "crypto";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import { getConnection, loadKeypair, airdropIfNeeded } from "../../lib/solana";
import { writeToRegistry, hashData } from "../../lib/registry";
import { logger } from "../../lib/logger";
import { IntelItem } from "../../lib/types";

const AGENT_ID = "scraper-v1";
const DATA_DIR = path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

async function fetchCoinGecko(): Promise<IntelItem[]> {
  try {
    const url = "https://api.coingecko.com/api/v3/news?per_page=10";
    const res = await axios.get(url, { timeout: 8000 });
    const articles = res.data?.data ?? [];
    return articles.map((a: any) => ({
      id: crypto.randomUUID(),
      source: "coingecko",
      title: a.title ?? "",
      summary: a.description ?? a.title ?? "",
      url: a.url ?? "",
      publishedAt: a.updated_at ?? new Date().toISOString(),
      tags: ["crypto"],
      sentiment: "neutral" as const,
      fetchedAt: new Date().toISOString(),
    }));
  } catch (err: any) {
    logger.warn("CoinGecko fetch failed", { agent: AGENT_ID, error: err.message });
    return [];
  }
}

async function fetchHackerNews(): Promise<IntelItem[]> {
  try {
    const topRes = await axios.get(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { timeout: 8000 }
    );
    const ids: number[] = topRes.data.slice(0, 8);

    const items = await Promise.all(
      ids.map((id) =>
        axios
          .get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { timeout: 5000 })
          .then((r) => r.data)
          .catch(() => null)
      )
    );

    return items
      .filter((i) => i && i.title)
      .map((i) => ({
        id: crypto.randomUUID(),
        source: "hackernews",
        title: i.title,
        summary: i.title,
        url: i.url ?? `https://news.ycombinator.com/item?id=${i.id}`,
        publishedAt: new Date(i.time * 1000).toISOString(),
        tags: ["tech", "news"],
        sentiment: "neutral" as const,
        fetchedAt: new Date().toISOString(),
      }));
  } catch (err: any) {
    logger.warn("HackerNews fetch failed", { agent: AGENT_ID, error: err.message });
    return [];
  }
}

async function fetchCryptoCompare(): Promise<IntelItem[]> {
  try {
    const url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular";
    const res = await axios.get(url, { timeout: 8000 });
    const articles = res.data?.Data ?? [];
    return articles.slice(0, 8).map((a: any) => ({
      id: crypto.randomUUID(),
      source: "cryptocompare",
      title: a.title ?? "",
      summary: a.body?.slice(0, 200) ?? a.title ?? "",
      url: a.url ?? "",
      publishedAt: new Date(a.published_on * 1000).toISOString(),
      tags: a.categories?.split("|") ?? ["crypto"],
      sentiment: "neutral" as const,
      fetchedAt: new Date().toISOString(),
    }));
  } catch (err: any) {
    logger.warn("CryptoCompare fetch failed", { agent: AGENT_ID, error: err.message });
    return [];
  }
}

async function runScrapeCycle(
  connection: ReturnType<typeof getConnection>,
  agentKeypair: ReturnType<typeof loadKeypair>
) {
  logger.info("Starting scrape cycle", { agent: AGENT_ID });

  const [geckoItems, hnItems, ccItems] = await Promise.all([
    fetchCoinGecko(),
    fetchHackerNews(),
    fetchCryptoCompare(),
  ]);

  const allItems: IntelItem[] = [...geckoItems, ...hnItems, ...ccItems];

  if (allItems.length === 0) {
    logger.warn("No items fetched this cycle", { agent: AGENT_ID });
    return;
  }

  const batchId = `batch-${Date.now()}`;
  const outPath = path.join(DATA_DIR, `${batchId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(allItems, null, 2));

  logger.info(`Saved ${allItems.length} intel items`, {
    agent: AGENT_ID,
    file: batchId,
    sources: [...new Set(allItems.map(i => i.source))].join(", "),
  });

  const dataHash = hashData(allItems);
  try {
    await writeToRegistry(connection, agentKeypair, {
      type: "intel",
      agentId: AGENT_ID,
      dataHash,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.warn("Registry write failed", { agent: AGENT_ID, error: err.message });
  }

  logger.info(`Cycle complete — ${batchId}`, { agent: AGENT_ID });
}

async function main() {
  logger.info("Scraper Agent starting", { agent: AGENT_ID });

  const privateKey = process.env.SCRAPER_AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error("SCRAPER_AGENT_PRIVATE_KEY not set in .env");

  const connection = getConnection();
  const agentKeypair = loadKeypair(privateKey);

  logger.info(`Wallet: ${agentKeypair.publicKey.toBase58()}`, { agent: AGENT_ID });

  await airdropIfNeeded(connection, agentKeypair);
  await runScrapeCycle(connection, agentKeypair);

  cron.schedule("*/15 * * * *", async () => {
    await runScrapeCycle(connection, agentKeypair);
  });

  logger.info("Scraper running — fetching every 15 minutes", { agent: AGENT_ID });
}

main().catch((err) => {
  logger.error("Scraper Agent crashed", { agent: AGENT_ID, error: err.message });
  process.exit(1);
});
