// server.js - Complete Auto Rubber Maintenance REST API
import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import { pool, q, getSafeDbConfig, verifyDbConnectionOnce } from "./db.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const today = () => new Date().toISOString().slice(0, 10);

// ---------- mappers: SQL rows -> prototype (window.DATA) shape ----------
const rankFromScore = (s) => (s >= 9 ? "Critical" : s >= 6 ? "Medium" : "Low");

async function buildData() {
  const [machines, parts, requests, repairs, usage, pm, users, moves] = await Promise.all([
    q(`SELECT m.code, m.name, g.name AS grp, m.\`rank\` AS \`rank\`, d.name AS dept,
              m.location AS zone, m.maker, m.model, m.install_date AS install,
              m.criticality AS crit, m.status
       FROM machines m
       LEFT JOIN mc_groups g ON g.id = m.mc_group_id
       LEFT JOIN departments d ON d.id = m.department_id
       ORDER BY m.code`),
    q(`SELECT p.code, p.name, g.name AS grp, p.min_stock, p.max_stock, p.safety_stock,
              p.rop, p.current_stock, p.criticality_score, p.unit_cost, s.lead_time_days
       FROM spare_parts p
       LEFT JOIN mc_groups g ON g.id = p.mc_group_id
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       ORDER BY p.code`),
    q(`SELECT r.request_no, r.problem_description, r.priority, r.status,
              r.accepted_by_name, r.accepted_at,
              r.breakdown_start, r.finish_repair, r.downtime_hours,
              m.code AS mc, m.name AS mcName, d.name AS dept, u.full_name AS reporter
       FROM maintenance_requests r
       JOIN machines m ON m.id = r.machine_id
       LEFT JOIN departments d ON d.id = r.department_id
       LEFT JOIN app_users u ON u.id = r.reporter_id
       ORDER BY r.breakdown_start`),
    q(`SELECT mr.request_no, t.full_name AS tech, pc.name AS cat, ra.root_cause,
              ra.corrective_action, ra.repair_hours, ra.verification_status,
              v.full_name AS verifier, mr.breakdown_start, mr.finish_repair
       FROM repair_actions ra
       JOIN maintenance_requests mr ON mr.id = ra.request_id
       LEFT JOIN app_users t ON t.id = ra.technician_id
       LEFT JOIN problem_categories pc ON pc.id = ra.problem_category_id
       LEFT JOIN app_users v ON v.id = ra.verified_by`),
    q(`SELECT mr.request_no, sp.code, sp.name, spu.qty_used, spu.unit_cost, s.name AS supplier
       FROM spare_part_usage spu
       JOIN maintenance_requests mr ON mr.id = spu.request_id
       JOIN spare_parts sp ON sp.id = spu.part_id
       LEFT JOIN suppliers s ON s.id = sp.supplier_id`),
    q(`SELECT m.code AS mc, m.name, pm.checklist, pm.frequency,
              pm.last_pm_date, pm.next_pm_date, pm.completed
       FROM pm_schedules pm JOIN machines m ON m.id = pm.machine_id`),
    q(`SELECT full_name, email, role, is_active FROM app_users ORDER BY full_name`),
    q(`SELECT sm.type, sm.qty, sm.moved_at, sm.note, sp.code, sp.name
       FROM stock_movements sm JOIN spare_parts sp ON sp.id = sm.part_id
       ORDER BY sm.moved_at DESC`),
  ]);

  const roleRev = { operator:"Operator", technician:"Technician", supervisor:"Supervisor",
    store:"Store Keeper", manager:"Manager", admin:"Admin" };

  const D = {};
  D.machines = machines.map((m) => ({
    code:m.code, name:m.name, group:m.grp || "", rank:m.rank, dept:m.dept || "",
    zone:m.zone || "", maker:m.maker || "", model:m.model || "", install:m.install || "",
    crit:m.crit, status:m.status,
  }));
  D.parts = parts.map((p) => {
    const o = { code:p.code, name:p.name, group:p.grp || "", brand:"—",
      partRank:rankFromScore(p.criticality_score), max:p.max_stock, min:p.min_stock,
      safety:p.safety_stock, rop:p.rop, cur:p.current_stock, price:Number(p.unit_cost),
      leadTime:p.lead_time_days || 0, score:p.criticality_score, owner:"—" };
    o.value = o.cur * o.price;
    o.status = o.cur <= 0 ? "critical" : o.cur <= o.rop ? "reorder" : "normal";
    return o;
  });
  D.requests = requests.map((r) => ({
    no:r.request_no, date:r.breakdown_start, mc:r.mc, mcName:r.mcName, type:"งานซ่อม",
    problem:r.problem_description, priority:r.priority, reporter:r.reporter || "",
    dept:r.dept || "", status:r.status, start:r.breakdown_start,
    finish:r.finish_repair || "", downtime:r.downtime_hours,
    acceptedBy:r.accepted_by_name || "", acceptedAt:r.accepted_at || "",
  }));
  D.repairs = {};
  repairs.forEach((ra) => {
    D.repairs[ra.request_no] = {
      tech:ra.tech || "", cat:ra.cat || "", root:ra.root_cause || "",
      action:ra.corrective_action || "", causeType:"เสื่อมสภาพ",
      hrs:Number(ra.repair_hours || 0), verify:ra.verification_status,
      by:ra.verifier || "", start:ra.breakdown_start || "", finish:ra.finish_repair || "",
    };
  });
  D.usage = {};
  usage.forEach((x) => {
    (D.usage[x.request_no] = D.usage[x.request_no] || []).push({
      code:x.code, name:x.name, qty:x.qty_used, unit:Number(x.unit_cost), supplier:x.supplier || "",
    });
  });
  D.pm = pm.map((p) => ({
    mc:p.mc, name:p.name, checklist:p.checklist, freq:p.frequency,
    last:p.last_pm_date || "", next:p.next_pm_date || "",
    status:p.completed ? "Completed" : (p.next_pm_date && p.next_pm_date < today() ? "Overdue" : "Due Later"),
  }));
  D.users = users.map((u, i) => ({
    id:"U-" + String(i + 1).padStart(3, "0"), name:u.full_name,
    user:(u.email || "").split("@")[0], role:roleRev[u.role] || "Operator",
    dept:"", status:u.is_active ? "Active" : "Inactive",
  }));
  D.stockIn = moves.filter((m) => m.type === "IN").map((m) => ({
    date:(m.moved_at || "").slice(0, 10), doc:m.note || "", code:m.code, name:m.name, qty:m.qty, by:"",
  }));
  D.stockOut = moves.filter((m) => m.type === "OUT").map((m) => ({
    date:(m.moved_at || "").slice(0, 10), doc:m.note || "", code:m.code, name:m.name,
    qty:m.qty, by:"", mc:"", reason:m.note || "",
  }));
  return D;
}

// ---------- READ: รวมทุกอย่างใน 1 request (ให้ bridge ใช้) ----------
app.get("/api/bootstrap", async (req, res) => {
  try { res.json(await buildData()); }
  catch (e) { console.error(e); res.status(500).json({ error: String(e.message || e) }); }
});

// แยกราย resource เผื่อใช้
app.get("/api/health", async (req, res) => {
  try {
    await verifyDbConnectionOnce();
    res.json({ ok: true, db: { ok: true, config: getSafeDbConfig() } });
  } catch (e) {
    res.status(503).json({
      ok: false,
      db: { ok: false, config: getSafeDbConfig(), error: String(e.message || e) },
    });
  }
});

// ---------- WRITE: แจ้งซ่อมใหม่ ----------
app.post("/api/requests", async (req, res) => {
  const { machineCode, problem, priority = "Medium", reporterName } = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[mc]] = await conn.query(`SELECT id FROM machines WHERE code = ?`, [machineCode]);
    if (!mc) {
      await conn.rollback();
      return res.status(400).json({ error: "machine not found" });
    }
    let reporterId = null;
    if (reporterName) {
      const [u] = await conn.query(
        `SELECT id
         FROM app_users
         WHERE full_name COLLATE utf8mb4_0900_ai_ci =
               CAST(? AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci
         LIMIT 1`,
        [reporterName]
      );
      reporterId = u[0] ? u[0].id : null;
    }

    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const counterKey = `REQ-${year}`;
    await conn.query(
      `INSERT INTO seq_counters (cname, val)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE val = LAST_INSERT_ID(val + 1)`,
      [counterKey]
    );
    const [[seqRow]] = await conn.query(`SELECT LAST_INSERT_ID() AS seq`);
    const requestNo = `REQ-${year}-${String(seqRow.seq).padStart(3, "0")}`;

    if (process.env.TELEGRAM_TEAM_CHAT) {
      await conn.query(`SET @telegram_team_chat = ?`, [process.env.TELEGRAM_TEAM_CHAT]);
    }
    await conn.query(
      `INSERT INTO maintenance_requests (id, request_no, machine_id, problem_description, priority, reporter_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Waiting')`,
      [id, requestNo, mc.id, problem, priority, reporterId]
    );
    await conn.commit();
    res.json({ ok: true, request_no: requestNo });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

app.post("/api/requests/:requestNo/complete", async (req, res) => {
  const requestNo = req.params.requestNo;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[r]] = await conn.query(`SELECT id FROM maintenance_requests WHERE request_no = ?`, [requestNo]);
    if (!r) { await conn.rollback(); return res.status(404).json({ error: "request not found" }); }
    await conn.query(
      `UPDATE maintenance_requests SET status = 'Completed', finish_repair = NOW() WHERE id = ?`, [r.id]
    );
    await conn.commit();
    res.json({ ok: true, request_no: requestNo });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

app.delete("/api/requests/:requestNo", async (req, res) => {
  const requestNo = req.params.requestNo;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[requestRow]] = await conn.query(
      `SELECT id FROM maintenance_requests WHERE request_no = ? LIMIT 1`,
      [requestNo]
    );
    if (!requestRow) {
      await conn.rollback();
      return res.status(404).json({ error: "request not found" });
    }

    await conn.query(`DELETE FROM notification_log WHERE related_request_id = ?`, [requestRow.id]);
    await conn.query(`DELETE FROM maintenance_requests WHERE id = ?`, [requestRow.id]);

    await conn.commit();
    res.json({ ok: true, request_no: requestNo });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

// ---------- WRITE: บันทึกการซ่อม + อะไหล่ (DB ตัดสต็อกเอง) ----------
app.post("/api/repairs", async (req, res) => {
  const { requestNo, repair = {}, parts = [] } = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[r]] = await conn.query(`SELECT id FROM maintenance_requests WHERE request_no = ?`, [requestNo]);
    if (!r) { await conn.rollback(); return res.status(400).json({ error: "request not found" }); }
    await conn.query(
      `INSERT INTO repair_actions (request_id, root_cause, corrective_action, repair_hours, verification_status)
       VALUES (?, ?, ?, ?, ?)`,
      [r.id, repair.root || null, repair.action || null, repair.hrs ?? null, repair.verify || "Pending"]
    );
    for (const p of parts) {
      const [[sp]] = await conn.query(`SELECT id, unit_cost FROM spare_parts WHERE code = ?`, [p.code]);
      if (!sp) continue;
      await conn.query(
        `INSERT INTO spare_part_usage (request_id, part_id, qty_used, unit_cost) VALUES (?, ?, ?, ?)`,
        [r.id, sp.id, p.qty, p.unit ?? sp.unit_cost]
      );
    }
    await conn.query(
      `UPDATE maintenance_requests SET status = 'Completed', finish_repair = NOW() WHERE id = ?`, [r.id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback(); console.error(e); res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

app.listen(PORT, async () => {
  console.log(`[API] listening on http://localhost:${PORT}`);
  try {
    await verifyDbConnectionOnce();
  } catch (e) {
    console.error("[API] startup DB check failed", getSafeDbConfig());
    console.error("[API] mysql error:", e.message);
  }
});
