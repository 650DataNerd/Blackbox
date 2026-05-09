require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { realtime: { transport: ws } }
);

app.get("/api/stats", async (req, res) => {
  try {
    const [intel, reports, trades] = await Promise.all([
      supabase.from("intel_batches").select("id", { count: "exact", head: true }),
      supabase.from("reports").select("id", { count: "exact", head: true }),
      supabase.from("trades").select("id", { count: "exact", head: true }),
    ]);
    res.json({
      batches: intel.count ?? 0,
      reports: reports.count ?? 0,
      trades: trades.count ?? 0,
    });
  } catch (e) {
    res.json({ batches: 0, reports: 0, trades: 0 });
  }
});

app.get("/api/reports", async (req, res) => {
  try {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(20);
    res.json(data || []);
  } catch (e) { res.json([]); }
});

app.get("/api/trades", async (req, res) => {
  try {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(20);
    res.json(data || []);
  } catch (e) { res.json([]); }
});

app.get("/api/intel", async (req, res) => {
  try {
    const { data } = await supabase
      .from("intel_batches")
      .select("*")
      .order("fetched_at", { ascending: false })
      .limit(20);
    res.json(data || []);
  } catch (e) { res.json([]); }
});

app.listen(3000, () => console.log("Dashboard running at http://localhost:3000"));
