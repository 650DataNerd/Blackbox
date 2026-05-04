import { z } from "zod";

export const IntelItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  publishedAt: z.string(),
  tags: z.array(z.string()),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  fetchedAt: z.string(),
});
export type IntelItem = z.infer<typeof IntelItemSchema>;

export const IntelReportSchema = z.object({
  id: z.string(),
  generatedAt: z.string(),
  sourcesUsed: z.number(),
  topSignals: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high"]),
  recommendedAction: z.enum(["buy", "sell", "hold", "watch"]),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  paidTxSignature: z.string().optional(),
});
export type IntelReport = z.infer<typeof IntelReportSchema>;

export const TradeRecordSchema = z.object({
  id: z.string(),
  executedAt: z.string(),
  action: z.enum(["buy", "sell", "hold"]),
  asset: z.string(),
  basedOnReportId: z.string(),
  txSignature: z.string().optional(),
  status: z.enum(["simulated", "submitted", "confirmed", "failed"]),
  note: z.string().optional(),
});
export type TradeRecord = z.infer<typeof TradeRecordSchema>;

export const RegistryEntrySchema = z.object({
  type: z.enum(["intel", "report", "trade"]),
  agentId: z.string(),
  dataHash: z.string(),
  timestamp: z.string(),
});
export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;
