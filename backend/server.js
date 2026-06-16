// server.js - Complete Auto Rubber Maintenance REST API
import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool, q, getSafeDbConfig, verifyDbConnectionOnce } from "./db.js";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

const PORT = process.env.PORT || 3001;
const today = () => new Date().toISOString().slice(0, 10);

// ---------- mappers: SQL rows -> prototype (window.DATA) shape ----------
const rankFromScore = (s) => (s >= 9 ? "Critical" : s >= 6 ? "Medium" : "Low");
const scoreFromRank = (r) => (r === "Critical" ? 9 : r === "Medium" ? 6 : 3);

async function buildData() {
  const [machines, parts, requests, repairs, usage, pm, users, moves, suppliers, pos, poItems, reviewHistory] = await Promise.all([
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
              m.code AS mc, m.name AS mcName, d.name AS dept, u.full_name AS reporter,
              r.prod_decision, r.prod_reason, r.review_round
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
    q(`SELECT pm.id, m.code AS mc, m.name, pm.checklist, pm.frequency,
              pm.last_pm_date, pm.next_pm_date, pm.completed
       FROM pm_schedules pm JOIN machines m ON m.id = pm.machine_id`),
    q(`SELECT id, full_name, email, role, phone, telegram_chat_id, is_active FROM app_users ORDER BY full_name`),
    q(`SELECT sm.type, sm.qty, sm.moved_at, sm.note, sp.code, sp.name
       FROM stock_movements sm JOIN spare_parts sp ON sp.id = sm.part_id
       ORDER BY sm.moved_at DESC`),
    q(`SELECT id, name, lead_time_days FROM suppliers ORDER BY name`),
    q(`SELECT po.po_no, po.expected_date, po.note, po.total_cost, po.created_at,
              s.name AS supplier, COUNT(poi.id) AS item_count
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
       GROUP BY po.id
       ORDER BY po.created_at DESC`),
    q(`SELECT po.po_no, sp.code, sp.name, poi.qty, poi.unit_cost
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.po_id
       JOIN spare_parts sp ON sp.id = poi.part_id`),
    q(`SELECT mr.request_no, pr.round, pr.decision, pr.reason, pr.decided_at
       FROM prod_reviews pr
       JOIN maintenance_requests mr ON mr.id = pr.request_id
       ORDER BY mr.request_no, pr.round`),
  ]);

  const roleRev = { operator:"Operator", maintenance:"Maintenance",
    technician:"Maintenance", supervisor:"Maintenance",
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
    prodDecision:r.prod_decision || null, prodReason:r.prod_reason || "",
    reviewRound:r.review_round || 0,
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
    id:p.id, mc:p.mc, name:p.name, checklist:p.checklist, freq:p.frequency,
    last:p.last_pm_date || "", next:p.next_pm_date || "",
    status:p.completed && p.next_pm_date >= today() ? "Completed" : (p.next_pm_date && p.next_pm_date < today() ? "Overdue" : "Due Later"),
  }));
  D.users = users.map((u, i) => ({
    id:"U-" + String(i + 1).padStart(3, "0"), db_id:u.id, name:u.full_name,
    user:(u.email || "").split("@")[0], email:u.email || "",
    role:roleRev[u.role] || "Operator", dbRole:u.role,
    phone:u.phone || "", telegramId:u.telegram_chat_id || "",
    dept:"", status:u.is_active ? "Active" : "Inactive",
  }));
  D.stockIn = moves.filter((m) => m.type === "IN").map((m) => ({
    date:(m.moved_at || "").slice(0, 10), doc:m.note || "", code:m.code, name:m.name, qty:m.qty, by:"",
  }));
  D.stockOut = moves.filter((m) => m.type === "OUT").map((m) => ({
    date:(m.moved_at || "").slice(0, 10), doc:m.note || "", code:m.code, name:m.name,
    qty:m.qty, by:"", mc:"", reason:m.note || "",
  }));
  D.suppliers = suppliers.map((s) => ({ name:s.name, leadTime:s.lead_time_days || 0 }));
  D.purchaseOrders = pos.map((p) => ({
    no:p.po_no, supplier:p.supplier || "—", date:(p.created_at || "").slice(0, 10),
    expected:(p.expected_date || "").slice(0, 10), items:p.item_count,
    total:Number(p.total_cost), note:p.note || "",
  }));
  D.poItems = {};
  poItems.forEach((x) => {
    (D.poItems[x.po_no] = D.poItems[x.po_no] || []).push({
      code:x.code, name:x.name, qty:x.qty, unit:Number(x.unit_cost),
    });
  });
  D.reviewHistory = {};
  reviewHistory.forEach((h) => {
    (D.reviewHistory[h.request_no] = D.reviewHistory[h.request_no] || []).push({
      round:h.round, decision:h.decision, reason:h.reason || "", decidedAt:h.decided_at,
    });
  });
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

// ---------- WRITE: แก้ไขอะไหล่ ----------
app.put("/api/parts/:code", async (req, res) => {
  const { code } = req.params;
  const { name, group, partRank, max = 0, min = 0, safety = 0, rop = 0, price = 0 } = req.body || {};
  if (!name || !group) return res.status(400).json({ error: "name และ group จำเป็นต้องระบุ" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[sp]] = await conn.query(`SELECT id FROM spare_parts WHERE code = ?`, [code]);
    if (!sp) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบอะไหล่: " + code }); }
    const [[grp]] = await conn.query(`SELECT id FROM mc_groups WHERE name = ?`, [group]);
    if (!grp) { await conn.rollback(); return res.status(400).json({ error: "ไม่พบกลุ่ม: " + group }); }
    await conn.query(
      `UPDATE spare_parts SET name=?, mc_group_id=?, min_stock=?, max_stock=?, safety_stock=?, rop=?, unit_cost=?, criticality_score=? WHERE code=?`,
      [name, grp.id, Number(min)||0, Number(max)||0, Number(safety)||0, Number(rop)||0, Number(price)||0, scoreFromRank(partRank), code]
    );
    await conn.commit();
    res.json({ ok: true, code });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

app.post("/api/parts", async (req, res) => {
  const { code, name, group, partRank, max = 0, min = 0, safety = 0, rop = 0, price = 0 } = req.body || {};
  if (!code || !name || !group) {
    return res.status(400).json({ error: "code, name, group are required" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[grp]] = await conn.query(`SELECT id FROM mc_groups WHERE name = ?`, [group]);
    if (!grp) {
      await conn.rollback();
      return res.status(400).json({ error: "ไม่พบกลุ่มเครื่องจักร: " + group });
    }
    const id = crypto.randomUUID();
    await conn.query(
      `INSERT INTO spare_parts (id, code, name, mc_group_id, min_stock, max_stock, safety_stock, rop, current_stock, criticality_score, unit_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, code, name, grp.id, min, max, safety, rop, scoreFromRank(partRank), price]
    );
    await conn.commit();
    res.json({ ok: true, code });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "รหัสอะไหล่นี้มีอยู่แล้ว: " + code });
    }
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

    // PD-reject notifications insert related_request_id=NULL (to hide the "รับงาน" button),
    // so clean those up by matching the request_no embedded in their subject.
    await conn.query(
      `DELETE FROM notification_log WHERE related_request_id = ? OR (related_request_id IS NULL AND subject LIKE CONCAT('%', ?, '%'))`,
      [requestRow.id, requestNo]
    );
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
    const [[r]] = await conn.query(`SELECT id, status FROM maintenance_requests WHERE request_no = ?`, [requestNo]);
    if (!r) { await conn.rollback(); return res.status(400).json({ error: "request not found" }); }
    const newStatus = r.status === "Returned" ? "Resubmitted" : "Completed";
    const [[existing]] = await conn.query(`SELECT id FROM repair_actions WHERE request_id = ? LIMIT 1`, [r.id]);
    if (existing) {
      await conn.query(
        `UPDATE repair_actions SET root_cause=?, corrective_action=?, repair_hours=?, verification_status=? WHERE id=?`,
        [repair.root || null, repair.action || null, repair.hrs ?? null, repair.verify || "Approved", existing.id]
      );
    } else {
      await conn.query(
        `INSERT INTO repair_actions (request_id, root_cause, corrective_action, repair_hours, verification_status)
         VALUES (?, ?, ?, ?, ?)`,
        [r.id, repair.root || null, repair.action || null, repair.hrs ?? null, repair.verify || "Approved"]
      );
    }
    for (const p of parts) {
      const [[sp]] = await conn.query(`SELECT id, unit_cost FROM spare_parts WHERE code = ?`, [p.code]);
      if (!sp) continue;
      await conn.query(
        `INSERT INTO spare_part_usage (request_id, part_id, qty_used, unit_cost) VALUES (?, ?, ?, ?)`,
        [r.id, sp.id, p.qty, p.unit ?? sp.unit_cost]
      );
    }
    await conn.query(
      `UPDATE maintenance_requests SET status=?, finish_repair=NOW(), prod_decision=NULL, prod_reason=NULL, review_round=review_round+1 WHERE id=?`, [newStatus, r.id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback(); console.error(e); res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- WRITE: PD อนุมัติ/ไม่อนุมัติ ----------
app.put("/api/requests/:no/prodapprove", async (req, res) => {
  const { no } = req.params;
  const { decision, reason = "" } = req.body || {};
  if (!["Approved", "Rejected"].includes(decision))
    return res.status(400).json({ error: "decision must be Approved or Rejected" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[r]] = await conn.query(
      `SELECT id, review_round FROM maintenance_requests WHERE request_no = ?`, [no]
    );
    if (!r) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบใบแจ้งซ่อม" }); }
    await conn.query(
      `INSERT INTO prod_reviews (request_id, round, decision, reason) VALUES (?, ?, ?, ?)`,
      [r.id, r.review_round, decision, reason || null]
    );
    const newStatus = decision === "Rejected" ? "Returned" : "Completed";
    await conn.query(
      `UPDATE maintenance_requests SET status=?, prod_decision=?, prod_reason=?, prod_decided_at=NOW() WHERE id=?`,
      [newStatus, decision, reason, r.id]
    );
    if (decision === "Rejected" && process.env.TELEGRAM_TEAM_CHAT) {
      const msg = `❌ <b>PD ส่งงานคืน</b> — ${no}\nเหตุผล: ${reason || "ไม่ระบุ"}\nกรุณาดำเนินการซ่อมและบันทึกผลใหม่อีกครั้ง`;
      await conn.query(
        `INSERT INTO notification_log (channel, recipient, subject, message, related_request_id, status)
         VALUES ('telegram', 'TEAM_CHAT', ?, ?, NULL, 'pending')`,
        [`PD ส่งงานคืน ${no}`, msg]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback(); console.error(e); res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- WRITE: รับเข้า/เบิกออกอะไหล่ (DB ตัดสต็อกเอง) ----------
app.post("/api/stock-movements", async (req, res) => {
  const { code, type, qty, by, reason, mc, date } = req.body || {};
  const qtyNum = Number(qty);
  if (!code || (type !== "IN" && type !== "OUT") || !qtyNum || qtyNum <= 0) {
    return res.status(400).json({ error: "code, type (IN/OUT), qty (มากกว่า 0) จำเป็นต้องระบุ" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[sp]] = await conn.query(
      `SELECT id, current_stock, unit_cost FROM spare_parts WHERE code = ?`, [code]
    );
    if (!sp) {
      await conn.rollback();
      return res.status(400).json({ error: "ไม่พบอะไหล่: " + code });
    }
    if (type === "OUT" && sp.current_stock < qtyNum) {
      await conn.rollback();
      return res.status(400).json({ error: `คงคลังไม่พอ (มี ${sp.current_stock} ต้องการเบิก ${qtyNum})` });
    }

    let movedBy = null;
    if (by) {
      const [u] = await conn.query(
        `SELECT id
         FROM app_users
         WHERE full_name COLLATE utf8mb4_0900_ai_ci =
               CAST(? AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_0900_ai_ci
         LIMIT 1`,
        [by]
      );
      movedBy = u[0] ? u[0].id : null;
    }

    const note = (type === "OUT" && mc)
      ? [reason, "เครื่อง/ใบแจ้ง: " + mc].filter(Boolean).join(" · ")
      : (reason || null);

    await conn.query(
      `INSERT INTO stock_movements (part_id, type, qty, unit_cost, note, moved_by, moved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sp.id, type, qtyNum, sp.unit_cost, note, movedBy, date || new Date()]
    );
    const newStock = type === "IN" ? sp.current_stock + qtyNum : sp.current_stock - qtyNum;
    await conn.query(`UPDATE spare_parts SET current_stock = ? WHERE id = ?`, [newStock, sp.id]);

    await conn.commit();
    res.json({ ok: true, code, cur: newStock });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

// ---------- WRITE: สร้างใบสั่งซื้อ (PO) ----------
app.post("/api/purchase-orders", async (req, res) => {
  const { supplier, expectedDate, note, items = [] } = req.body || {};
  const cleanItems = (Array.isArray(items) ? items : [])
    .map((it) => ({ code: it.code, qty: Number(it.qty) }))
    .filter((it) => it.code && it.qty > 0);
  if (!supplier || cleanItems.length === 0) {
    return res.status(400).json({ error: "ผู้ขายและรายการอะไหล่อย่างน้อย 1 รายการ จำเป็นต้องระบุ" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[sup]] = await conn.query(`SELECT id FROM suppliers WHERE name = ?`, [supplier]);
    if (!sup) { await conn.rollback(); return res.status(400).json({ error: "ไม่พบผู้ขาย: " + supplier }); }

    const parts = [];
    for (const it of cleanItems) {
      const [[sp]] = await conn.query(`SELECT id, unit_cost FROM spare_parts WHERE code = ?`, [it.code]);
      if (!sp) { await conn.rollback(); return res.status(400).json({ error: "ไม่พบอะไหล่: " + it.code }); }
      parts.push({ id: sp.id, qty: it.qty, unitCost: Number(sp.unit_cost) });
    }
    const totalCost = parts.reduce((s, p) => s + p.qty * p.unitCost, 0);

    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const counterKey = `PO-${year}`;
    await conn.query(
      `INSERT INTO seq_counters (cname, val)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE val = val + 1`,
      [counterKey]
    );
    const [[seqRow]] = await conn.query(`SELECT val AS seq FROM seq_counters WHERE cname = ?`, [counterKey]);
    const poNo = `PO-${year}-${String(seqRow.seq).padStart(3, "0")}`;

    await conn.query(
      `INSERT INTO purchase_orders (id, po_no, supplier_id, expected_date, note, total_cost)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, poNo, sup.id, expectedDate || null, note || null, totalCost]
    );
    for (const p of parts) {
      await conn.query(
        `INSERT INTO purchase_order_items (po_id, part_id, qty, unit_cost) VALUES (?, ?, ?, ?)`,
        [id, p.id, p.qty, p.unitCost]
      );
    }
    await conn.commit();
    res.json({ ok: true, po_no: poNo, total: totalCost });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

// ---------- WRITE: แก้ไขเครื่องจักร ----------
app.put("/api/machines/:code", async (req, res) => {
  const { code } = req.params;
  const { name, group, rank, criticality, dept, location, maker, model, installDate, status } = req.body || {};
  if (!name || !group) return res.status(400).json({ error: "name และ group จำเป็นต้องระบุ" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[mc]] = await conn.query(`SELECT id FROM machines WHERE code = ?`, [code]);
    if (!mc) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบเครื่อง: " + code }); }
    const [[grp]] = await conn.query(`SELECT id FROM mc_groups WHERE name = ?`, [group]);
    if (!grp) { await conn.rollback(); return res.status(400).json({ error: "ไม่พบกลุ่มเครื่องจักร: " + group }); }
    let deptId = null;
    if (dept) {
      const [[d]] = await conn.query(`SELECT id FROM departments WHERE name = ?`, [dept]);
      deptId = d ? d.id : null;
    }
    await conn.query(
      `UPDATE machines SET name=?, mc_group_id=?, \`rank\`=?, criticality=?, department_id=?, location=?, maker=?, model=?, install_date=?, status=? WHERE code=?`,
      [name, grp.id, rank || "C", criticality || "LOW", deptId, location || null, maker || null, model || null, installDate || null, status || "Running", code]
    );
    await conn.commit();
    res.json({ ok: true, code });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

// ---------- WRITE: เพิ่มเครื่องจักรใหม่ ----------
app.post("/api/machines", async (req, res) => {
  const { code, name, group, rank = "C", criticality = "LOW", dept, location, maker, model, installDate, status = "Running" } = req.body || {};
  if (!code || !name || !group) {
    return res.status(400).json({ error: "code, name, group จำเป็นต้องระบุ" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[grp]] = await conn.query(`SELECT id FROM mc_groups WHERE name = ?`, [group]);
    if (!grp) { await conn.rollback(); return res.status(400).json({ error: "ไม่พบกลุ่มเครื่องจักร: " + group }); }
    let deptId = null;
    if (dept) {
      const [[d]] = await conn.query(`SELECT id FROM departments WHERE name = ?`, [dept]);
      deptId = d ? d.id : null;
    }
    const id = crypto.randomUUID();
    await conn.query(
      `INSERT INTO machines (id, code, name, mc_group_id, \`rank\`, criticality, department_id, location, maker, model, install_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, code, name, grp.id, rank, criticality, deptId, location || null, maker || null, model || null, installDate || null, status]
    );
    await conn.commit();
    res.json({ ok: true, code });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "รหัสเครื่องนี้มีอยู่แล้ว: " + code });
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

// ---------- WRITE: ลบเครื่องจักร ----------
app.delete("/api/machines/:code", async (req, res) => {
  const { code } = req.params;
  const conn = await pool.getConnection();
  try {
    const [[mc]] = await conn.query(`SELECT id FROM machines WHERE code = ?`, [code]);
    if (!mc) return res.status(404).json({ error: "ไม่พบเครื่อง: " + code });
    const [[reqc]] = await conn.query(`SELECT COUNT(*) c FROM maintenance_requests WHERE machine_id = ?`, [mc.id]);
    const [[pmc]] = await conn.query(`SELECT COUNT(*) c FROM pm_schedules WHERE machine_id = ?`, [mc.id]);
    if (reqc.c > 0 || pmc.c > 0) {
      return res.status(409).json({ error: "ไม่สามารถลบได้ เนื่องจากเครื่องนี้มีใบแจ้งซ่อมหรือแผน PM ที่เกี่ยวข้องอยู่" });
    }
    await conn.query(`DELETE FROM machines WHERE id = ?`, [mc.id]);
    res.json({ ok: true, code });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally {
    conn.release();
  }
});

// ---------- WRITE: เพิ่มผู้ใช้งาน ----------
app.post("/api/users", async (req, res) => {
  const { fullName, role = "operator", email, phone, telegramId } = req.body || {};
  if (!fullName) return res.status(400).json({ error: "fullName จำเป็นต้องระบุ" });
  const validRoles = ["operator","maintenance","technician","supervisor","manager","planner","store","purchasing","admin"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "role ไม่ถูกต้อง" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = crypto.randomUUID();
    await conn.query(
      `INSERT INTO app_users (id, full_name, role, email, phone, telegram_chat_id, is_active) VALUES (?,?,?,?,?,?,1)`,
      [id, fullName, role, email || null, phone || null, telegramId || null]
    );
    await conn.commit();
    res.json({ ok: true, id });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "อีเมลนี้มีในระบบแล้ว" });
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- WRITE: แก้ไขผู้ใช้งาน ----------
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { fullName, role, email, phone, telegramId, isActive } = req.body || {};
  if (!fullName) return res.status(400).json({ error: "fullName จำเป็นต้องระบุ" });
  const validRoles = ["operator","maintenance","technician","supervisor","manager","planner","store","purchasing","admin"];
  if (role && !validRoles.includes(role)) return res.status(400).json({ error: "role ไม่ถูกต้อง" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[u]] = await conn.query(`SELECT id FROM app_users WHERE id = ?`, [id]);
    if (!u) { await conn.rollback(); return res.status(404).json({ error: "ไม่พบผู้ใช้" }); }
    await conn.query(
      `UPDATE app_users SET full_name=?, role=?, email=?, phone=?, telegram_chat_id=?, is_active=? WHERE id=?`,
      [fullName, role || "operator", email || null, phone || null, telegramId || null, isActive !== false ? 1 : 0, id]
    );
    await conn.commit();
    res.json({ ok: true, id });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "อีเมลนี้มีในระบบแล้ว" });
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- READ: Reliability Analysis ----------
app.get("/api/reliability", async (req, res) => {
  const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 12);
  const conn = await pool.getConnection();
  try {
    const [pareto] = await conn.query(
      `SELECT m.code, m.name, m.rank, m.status,
              COUNT(*) AS breakdown_count,
              ROUND(SUM(r.downtime_hours), 2) AS total_downtime,
              ROUND(AVG(r.downtime_hours), 2) AS avg_downtime
       FROM maintenance_requests r
       JOIN machines m ON m.id = r.machine_id
       WHERE r.breakdown_start >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY m.id ORDER BY breakdown_count DESC LIMIT 10`,
      [months]
    );
    const [trend] = await conn.query(
      `SELECT DATE_FORMAT(breakdown_start,'%Y-%m') AS month,
              COUNT(*) AS breakdowns,
              ROUND(SUM(downtime_hours),2) AS total_downtime
       FROM maintenance_requests
       WHERE breakdown_start >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY month ORDER BY month`,
      [months]
    );
    const [rootCause] = await conn.query(
      `SELECT pc.name AS category, COUNT(*) AS count
       FROM repair_actions ra
       JOIN problem_categories pc ON pc.id = ra.problem_category_id
       JOIN maintenance_requests r ON r.id = ra.request_id
       WHERE r.breakdown_start >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY pc.id ORDER BY count DESC`,
      [months]
    );
    const [mtbfPerMachine] = await conn.query(
      `SELECT m.code, m.name, m.rank,
              COUNT(*) AS breakdowns,
              ROUND(SUM(r.downtime_hours),2) AS total_downtime,
              ROUND(AVG(r.downtime_hours),2) AS mttr,
              ROUND((? * 30 * 24 - COALESCE(SUM(r.downtime_hours),0)) / NULLIF(COUNT(*),0), 1) AS mtbf
       FROM maintenance_requests r
       JOIN machines m ON m.id = r.machine_id
       WHERE r.breakdown_start >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY m.id ORDER BY breakdowns DESC`,
      [months, months]
    );
    const [repeatFailure] = await conn.query(
      `SELECT m.code, m.name, m.rank, pc.name AS category, COUNT(*) AS repeat_count
       FROM repair_actions ra
       JOIN maintenance_requests r ON r.id = ra.request_id
       JOIN machines m ON m.id = r.machine_id
       JOIN problem_categories pc ON pc.id = ra.problem_category_id
       WHERE r.breakdown_start >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY m.id, pc.id HAVING repeat_count > 1
       ORDER BY repeat_count DESC`,
      [months]
    );
    const [costPerMachine] = await conn.query(
      `SELECT m.code, m.name, m.rank,
              COUNT(DISTINCT r.id) AS repairs,
              ROUND(SUM(spu.total_cost), 2) AS parts_cost
       FROM maintenance_requests r
       JOIN machines m ON m.id = r.machine_id
       JOIN spare_part_usage spu ON spu.request_id = r.id
       WHERE r.breakdown_start >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY m.id ORDER BY parts_cost DESC`,
      [months]
    );
    res.json({ pareto, trend, rootCause, mtbfPerMachine, repeatFailure, costPerMachine, months });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- READ: Monthly Report ----------
app.get("/api/monthly-report", async (req, res) => {
  const now   = new Date();
  const year  = Number(req.query.year)  || now.getFullYear();
  const month = Number(req.query.month) || (now.getMonth() + 1);
  const pad   = String(month).padStart(2, "0");
  const start = `${year}-${pad}-01`;
  // last day of month
  const end   = new Date(year, month, 0).toISOString().slice(0, 10);

  const conn = await pool.getConnection();
  try {
    // 1) KPI summary
    const [[kpi]] = await conn.query(
      `SELECT
         COUNT(*)                                        AS total_requests,
         SUM(status = 'Completed')                       AS completed,
         SUM(status NOT IN ('Completed','Resubmitted'))  AS in_progress,
         ROUND(SUM(COALESCE(downtime_hours, 0)), 1)      AS total_downtime,
         SUM(priority = 'Critical')                      AS critical_count
       FROM maintenance_requests
       WHERE DATE(created_at) BETWEEN ? AND ?`, [start, end]
    );

    // 2) PM summary
    const [[pmKpi]] = await conn.query(
      `SELECT
         COUNT(*)                          AS total_pm,
         SUM(completed = TRUE)             AS pm_completed,
         SUM(completed = FALSE AND next_pm_date < ?)  AS pm_overdue
       FROM pm_schedules
       WHERE next_pm_date BETWEEN ? AND ?`, [end, start, end]
    );

    // 3) repair detail rows
    const [repairs] = await conn.query(
      `SELECT r.request_no, m.code AS machine_code, m.name AS machine_name,
              r.problem_description AS description, r.priority, r.status,
              r.created_at, r.finish_repair AS completed_at,
              ROUND(COALESCE(r.downtime_hours, 0), 1) AS downtime,
              ra.corrective_action,
              r.accepted_by_name AS technician
       FROM maintenance_requests r
       LEFT JOIN machines m ON m.id = r.machine_id
       LEFT JOIN repair_actions ra ON ra.request_id = r.id
       WHERE DATE(r.created_at) BETWEEN ? AND ?
       ORDER BY r.created_at`, [start, end]
    );

    // 4) PM detail rows
    const [pmRows] = await conn.query(
      `SELECT pm.checklist, pm.frequency, pm.next_pm_date, pm.last_pm_date,
              pm.completed,
              m.code AS machine_code, m.name AS machine_name, m.rank
       FROM pm_schedules pm
       JOIN machines m ON m.id = pm.machine_id
       WHERE pm.next_pm_date BETWEEN ? AND ?
       ORDER BY pm.next_pm_date`, [start, end]
    );

    // 5) top 5 machines by breakdown
    const [topMachines] = await conn.query(
      `SELECT m.code, m.name, m.rank,
              COUNT(*) AS breakdowns,
              ROUND(SUM(COALESCE(r.downtime_hours, 0)), 1) AS downtime
       FROM maintenance_requests r
       LEFT JOIN machines m ON m.id = r.machine_id
       WHERE DATE(r.created_at) BETWEEN ? AND ?
       GROUP BY m.id ORDER BY breakdowns DESC LIMIT 5`, [start, end]
    );

    // 6) parts cost this month
    const [[costRow]] = await conn.query(
      `SELECT ROUND(SUM(spu.qty_used * spu.unit_cost), 2) AS parts_cost, COUNT(*) AS parts_items
       FROM spare_part_usage spu
       JOIN maintenance_requests r ON r.id = spu.request_id
       WHERE DATE(r.created_at) BETWEEN ? AND ?`, [start, end]
    );

    res.json({ year, month, start, end, kpi, pmKpi, repairs, pmRows, topMachines, costRow });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- helpers ----------
function calcNextPmDate(fromDate, frequency) {
  const d = new Date(fromDate);
  if (frequency === "Daily")     d.setDate(d.getDate() + 1);
  else if (frequency === "Weekly")    d.setDate(d.getDate() + 7);
  else if (frequency === "Monthly")   d.setMonth(d.getMonth() + 1);
  else if (frequency === "Quarterly") d.setMonth(d.getMonth() + 3);
  else if (frequency === "Yearly")    d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// ---------- WRITE: สร้างแผน PM ----------
app.post("/api/pm-schedules", async (req, res) => {
  const { machineCode, checklist, frequency, nextPmDate } = req.body || {};
  if (!machineCode || !checklist || !frequency) return res.status(400).json({ error: "machineCode, checklist, frequency จำเป็นต้องระบุ" });
  const conn = await pool.getConnection();
  try {
    const [[mc]] = await conn.query(`SELECT id FROM machines WHERE code = ?`, [machineCode]);
    if (!mc) return res.status(404).json({ error: "ไม่พบเครื่อง: " + machineCode });
    const id = crypto.randomUUID();
    const next = nextPmDate || calcNextPmDate(today(), frequency);
    await conn.query(
      `INSERT INTO pm_schedules (id, machine_id, checklist, frequency, next_pm_date, completed) VALUES (?, ?, ?, ?, ?, FALSE)`,
      [id, mc.id, checklist, frequency, next]
    );
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- WRITE: แก้ไขแผน PM ----------
app.put("/api/pm-schedules/:id", async (req, res) => {
  const { id } = req.params;
  const { checklist, frequency, nextPmDate } = req.body || {};
  if (!checklist || !frequency) return res.status(400).json({ error: "checklist, frequency จำเป็นต้องระบุ" });
  const conn = await pool.getConnection();
  try {
    const [[pm]] = await conn.query(`SELECT id FROM pm_schedules WHERE id = ?`, [id]);
    if (!pm) return res.status(404).json({ error: "ไม่พบแผน PM" });
    await conn.query(
      `UPDATE pm_schedules SET checklist=?, frequency=?, next_pm_date=? WHERE id=?`,
      [checklist, frequency, nextPmDate || null, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- WRITE: ลบแผน PM ----------
app.delete("/api/pm-schedules/:id", async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    const [[pm]] = await conn.query(`SELECT id FROM pm_schedules WHERE id = ?`, [id]);
    if (!pm) return res.status(404).json({ error: "ไม่พบแผน PM" });
    await conn.query(`DELETE FROM pm_schedules WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  } finally { conn.release(); }
});

// ---------- WRITE: กดทำ PM เสร็จ ----------
app.post("/api/pm-schedules/:id/complete", async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    const [[pm]] = await conn.query(`SELECT frequency FROM pm_schedules WHERE id = ?`, [id]);
    if (!pm) return res.status(404).json({ error: "ไม่พบแผน PM" });
    const t = today();
    const next = calcNextPmDate(t, pm.frequency);
    await conn.query(
      `UPDATE pm_schedules SET last_pm_date=?, next_pm_date=?, completed=TRUE WHERE id=?`,
      [t, next, id]
    );
    res.json({ ok: true, last: t, next });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
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
