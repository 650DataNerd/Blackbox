const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, "../data");
const REPORTS_DIR = path.join(DATA_DIR, "reports");
const TRADES_DIR = path.join(DATA_DIR, "trades");

function readJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".json") && !f.startsWith("."))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.fetchedAt || b.generatedAt || b.executedAt || 0) - 
                    new Date(a.fetchedAt || a.generatedAt || a.executedAt || 0));
}

app.get("/api/stats", (req, res) => {
  const batches = fs.existsSync(DATA_DIR) 
    ? fs.readdirSync(DATA_DIR).filter(f => f.startsWith("batch-")).length 
    : 0;
  const reports = fs.existsSync(REPORTS_DIR)
    ? fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith(".json")).length
    : 0;
  const trades = fs.existsSync(TRADES_DIR)
    ? fs.readdirSync(TRADES_DIR).filter(f => f.endsWith(".json")).length
    : 0;

  res.json({ batches, reports, trades, uptime: process.uptime() });
});

app.get("/api/reports", (req, res) => {
  const reports = readJsonFiles(REPORTS_DIR).slice(0, 10);
  res.json(reports);
});

app.get("/api/trades", (req, res) => {
  const trades = readJsonFiles(TRADES_DIR).slice(0, 10);
  res.json(trades);
});

app.get("/api/intel", (req, res) => {
  if (!fs.existsSync(DATA_DIR)) return res.json([]);
  const batches = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith("batch-") && f.endsWith(".json"))
    .sort().reverse().slice(0, 3);
  const items = batches.flatMap(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
    } catch { return []; }
  }).slice(0, 15);
  res.json(items);
});

app.listen(3000, () => console.log("Dashboard running at http://localhost:3000"));
