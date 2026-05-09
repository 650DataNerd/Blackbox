import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { IntelItem, IntelReport, TradeRecord } from "./types";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
  {
    realtime: { transport: ws },
  }
);

export async function saveIntelItems(items: IntelItem[]): Promise<void> {
  const rows = items.map(i => ({
    id: i.id,
    source: i.source,
    title: i.title,
    summary: i.summary,
    url: i.url,
    published_at: i.publishedAt,
    tags: i.tags,
    sentiment: i.sentiment,
    fetched_at: i.fetchedAt,
  }));
  const { error } = await supabase
    .from("intel_batches")
    .upsert(rows, { onConflict: "id" });
  if (error) throw new Error("Supabase intel save failed: " + error.message);
}

export async function saveReport(report: IntelReport): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .upsert({
      id: report.id,
      generated_at: report.generatedAt,
      sources_used: report.sourcesUsed,
      top_signals: report.topSignals,
      risk_level: report.riskLevel,
      recommended_action: report.recommendedAction,
      confidence: report.confidence,
      summary: report.summary,
      paid_tx_signature: report.paidTxSignature ?? null,
    }, { onConflict: "id" });
  if (error) throw new Error("Supabase report save failed: " + error.message);
}

export async function saveTrade(trade: TradeRecord): Promise<void> {
  const { error } = await supabase
    .from("trades")
    .upsert({
      id: trade.id,
      executed_at: trade.executedAt,
      action: trade.action,
      asset: trade.asset,
      based_on_report_id: trade.basedOnReportId,
      tx_signature: trade.txSignature ?? null,
      status: trade.status,
      note: trade.note ?? null,
    }, { onConflict: "id" });
  if (error) throw new Error("Supabase trade save failed: " + error.message);
}

export async function getRecentReports(limit = 20) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getRecentTrades(limit = 20) {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("executed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getRecentIntel(limit = 20) {
  const { data, error } = await supabase
    .from("intel_batches")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getStats() {
  const [intel, reports, trades] = await Promise.all([
    supabase.from("intel_batches").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("trades").select("id", { count: "exact", head: true }),
  ]);
  return {
    batches: intel.count ?? 0,
    reports: reports.count ?? 0,
    trades: trades.count ?? 0,
  };
}
