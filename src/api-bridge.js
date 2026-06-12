/* ============================================================
   api-bridge.js - BRIDGE LAYER (เรียก REST API ของ Express + MySQL)
   แทน data.js : ดึง /api/bootstrap มาประกอบเป็น window.DATA รูปทรงเดิม
   - dispatch "mt-data-ready" ตอนโหลดครั้งแรก (ให้ app.jsx mount)
   - poll ทุก 8 วิ : ถ้าสถานะใบแจ้งซ่อมเปลี่ยน (เช่นช่างกดรับงานใน Telegram)
     จะ dispatch "mt-data-refresh" ให้เว็บอัปเดตสถานะอัตโนมัติ
   ============================================================ */
(function () {
  const DATA = {};
  const API = window.API_BASE || "";
  const POLL_MS = 8000;

  /* ---------- helpers ---------- */
  DATA.fmtMoney = (n) => "฿" + Number(n || 0).toLocaleString("en-US");
  DATA.fmtNum = (n) => Number(n || 0).toLocaleString("en-US");
  DATA.partByCode = (code) => DATA.parts.find((p) => p.code === code);
  DATA.machineByCode = (code) => DATA.machines.find((m) => m.code === code);
  DATA.requestsForMachine = (code) => DATA.requests.filter((r) => r.mc === code);
  DATA.scannedMachine = "MC-001";

  /* ---------- production approval decisions (DB-backed) ---------- */
  DATA.prodFor = (no) => { const r = DATA.requests.find(x => x.no === no); return r?.prodDecision ? { decision: r.prodDecision, reason: r.prodReason || "" } : null; };
  DATA.getReviewHistory = (no) => (DATA.reviewHistory || {})[no] || [];
  DATA.prodGet = () => { const m = {}; DATA.requests.forEach(r => { if (r.prodDecision) m[r.no] = { decision: r.prodDecision, reason: r.prodReason || "" }; }); return m; };
  DATA.prodSet = () => {}; // legacy no-op — use prodApprove instead
  DATA.prodApprove = async (no, decision, reason = "") => {
    const res = await fetch(API + "/api/requests/" + encodeURIComponent(no) + "/prodapprove", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "บันทึกไม่สำเร็จ");
    return j;
  };
  DATA.prodStatus = (no) => {
    const d = DATA.prodFor(no);
    if (!d)                        return { decision: "Pending",  cls: "b-amber", icon: null,    th: "รออนุมัติจากฝ่ายผลิต",   en: "Pending Production Review", dot: "var(--amber)" };
    if (d.decision === "Approved") return { decision: "Approved", cls: "b-green", icon: "check", th: "อนุมัติโดยฝ่ายผลิต",     en: "Approved by Production",   dot: "var(--green)", reason: d.reason };
    return                                { decision: "Rejected", cls: "b-red",   icon: "x",     th: "ไม่อนุมัติโดยฝ่ายผลิต",  en: "Rejected by Production",   dot: "var(--red)",   reason: d.reason };
  };

  /* ---------- KPI: คำนวณจริงจาก requests/pm (30 วันล่าสุด เทียบกับ 30 วันก่อนหน้า) ---------- */
  DATA.computeKpis = () => {
    const DAY = 86400000;
    const now = Date.now();
    const machines = (DATA.machines || []).length || 1;

    const stats = (fromDaysAgo, toDaysAgo) => {
      const from = now - fromDaysAgo * DAY;
      const to = now - toDaysAgo * DAY;
      const reqs = (DATA.requests || []).filter((r) => {
        const t = new Date(r.date).getTime();
        return t > from && t <= to;
      });
      const finished = reqs.filter((r) => r.downtime != null);
      const totalDown = finished.reduce((s, r) => s + Number(r.downtime || 0), 0);
      const breakdowns = reqs.length;
      const periodHrs = (fromDaysAgo - toDaysAgo) * 24 * machines;
      return {
        mtbf: breakdowns ? (periodHrs - totalDown) / breakdowns : periodHrs,
        mttr: finished.length ? totalDown / finished.length : 0,
        breakdowns, totalDown,
      };
    };

    const cur = stats(30, 0);
    const prev = stats(60, 30);

    const delta = (c, p) => {
      if (!p) return { delta: "–", trend: "flat" };
      const pct = ((c - p) / p) * 100;
      const trend = pct > 1 ? "up" : pct < -1 ? "down" : "flat";
      return { delta: (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%", trend };
    };
    const dMtbf = delta(cur.mtbf, prev.mtbf);
    const dMttr = delta(cur.mttr, prev.mttr);
    const dBrk  = delta(cur.breakdowns, prev.breakdowns);
    const dDown = delta(cur.totalDown, prev.totalDown);

    const pmList = DATA.pm || [];
    const pmPct = pmList.length ? Math.round(pmList.filter((p) => p.status === "Completed").length / pmList.length * 100) : 0;

    DATA.kpi = [
      { key:"MTBF", name:"MTBF", full:"Mean Time Between Failures", value:cur.mtbf.toFixed(0), unit:"ชม.", target:"เพิ่มขึ้น", state: cur.mtbf>=300?"good":cur.mtbf>=150?"warn":"bad", delta:dMtbf.delta, trend:dMtbf.trend, note:"(ชม.เครื่องวิ่งรวม − Downtime) / จำนวนครั้งเสีย (30 วันล่าสุด)" },
      { key:"MTTR", name:"MTTR", full:"Mean Time To Repair", value:cur.mttr.toFixed(2), unit:"ชม.", target:"ลดลง", state: cur.mttr<=2?"good":cur.mttr<=4?"warn":"bad", delta:dMttr.delta, trend:dMttr.trend, note:"Downtime เฉลี่ยต่อใบแจ้งซ่อมที่ปิดงานแล้ว (30 วันล่าสุด)" },
      { key:"BRK", name:"Breakdown Rate", full:"จำนวนครั้งที่เสีย/เดือน", value:String(cur.breakdowns), unit:"ครั้ง/เดือน", target:"ลดลง", state: cur.breakdowns<=3?"good":cur.breakdowns<=6?"warn":"bad", delta:dBrk.delta, trend:dBrk.trend, note:"จำนวนใบแจ้งซ่อมใหม่ใน 30 วันล่าสุด" },
      { key:"DOWN", name:"Total Downtime", full:"เวลาเครื่องหยุดรวม", value:cur.totalDown.toFixed(2), unit:"ชม.", target:"ให้ต่ำที่สุด", state: cur.totalDown<=10?"good":cur.totalDown<=24?"warn":"bad", delta:dDown.delta, trend:dDown.trend, note:"รวม Downtime ของใบแจ้งซ่อมที่ปิดงานแล้ว (30 วันล่าสุด)" },
      { key:"PM", name:"PM Compliance", full:"ความสอดคล้องแผน PM", value:String(pmPct), unit:"%", target:"> 95%", state: pmPct>=95?"good":pmPct>=80?"warn":"bad", delta:"–", trend:"flat", note:"Completed PM / Planned PM ทั้งหมด" },
    ];
  };
  DATA.riskMatrix = [
    { rank:"Rank A", sub:"High Impact MC", crit:"Critical Part", zone:"HIGH", proto:"Telegram Alert ทันที + แจ้งหัวหน้า (Email)" },
    { rank:"Rank A", sub:"High Impact MC", crit:"Medium / Low", zone:"HIGH", proto:"Telegram Alert ทันที ถึงทีมช่าง" },
    { rank:"Rank B", sub:"Medium Impact", crit:"Critical Part", zone:"MEDIUM", proto:"Email Log + Telegram มาตรฐาน" },
    { rank:"Rank B", sub:"Medium Impact", crit:"Medium / Low", zone:"MEDIUM", proto:"คิวงานบนเว็บ (Mobile Queue)" },
    { rank:"Rank C", sub:"Low Impact", crit:"Low Criticality", zone:"LOW", proto:"Work Order Backlog Log" },
  ];
  DATA.riskGrid = { rows:["Rank A","Rank B","Rank C"], cols:["Critical Part","Medium Part","Low Part"],
    zone:{ "Rank A":["HIGH","HIGH","HIGH"], "Rank B":["MEDIUM","MEDIUM","MEDIUM"], "Rank C":["MEDIUM","LOW","LOW"] } };
  DATA.mcGroups = [
    { group:"Compression", machines:12, parts:320, value:1250000, critical:48, reorder:12, risk:"HIGH" },
    { group:"Injection", machines:8, parts:240, value:980000, critical:35, reorder:8, risk:"HIGH" },
    { group:"Vacuum", machines:5, parts:120, value:450000, critical:15, reorder:3, risk:"MEDIUM" },
    { group:"CNC", machines:4, parts:90, value:780000, critical:18, reorder:5, risk:"MEDIUM" },
    { group:"Utility", machines:10, parts:150, value:220000, critical:5, reorder:1, risk:"LOW" },
  ];
  /* ---------- Inventory KPI: คำนวณจริงจาก parts/stockOut ---------- */
  DATA.computeInvKpi = () => {
    const parts = DATA.parts || [];
    const stockOut = DATA.stockOut || [];

    const stateHigher = (v, target, warnRatio = 0.9) => v >= target ? "good" : v >= target * warnRatio ? "warn" : "bad";
    const stateLower = (v, target, warnMul = 1.5) => v <= target ? "good" : v <= target * warnMul ? "warn" : "bad";

    // 1) สต็อกอยู่ในเกณฑ์ Min-Max
    const withRange = parts.filter((p) => p.max > 0);
    const inRange = withRange.filter((p) => p.cur >= p.min && p.cur <= p.max).length;
    const accuracyPct = withRange.length ? Math.round((inRange / withRange.length) * 100) : 100;

    // 2) Critical Part Availability: % ของอะไหล่ Critical ที่ยังไม่ของหมด
    const criticalParts = parts.filter((p) => p.partRank === "Critical");
    const availableCritical = criticalParts.filter((p) => p.status !== "critical").length;
    const availPct = criticalParts.length ? Math.round((availableCritical / criticalParts.length) * 100) : 100;

    // 3) Dead Stock Value: มีคงคลัง > 0 แต่ไม่เคยถูกเบิกออกเลย
    const movedCodes = new Set(stockOut.map((s) => s.code));
    const deadStockValue = parts
      .filter((p) => p.cur > 0 && !movedCodes.has(p.code))
      .reduce((s, p) => s + (p.value || 0), 0);

    // 4) Emergency Purchase: % ของการเบิกฉุกเฉินใน 30 วันล่าสุด
    const DAY = 86400000;
    const since = Date.now() - 30 * DAY;
    const recentOut = stockOut.filter((s) => new Date(s.date).getTime() >= since);
    const emergencyOut = recentOut.filter((s) => /ฉุกเฉิน|ด่วน|emergency|urgent/i.test(s.reason || ""));
    const emergencyPct = recentOut.length ? Math.round((emergencyOut.length / recentOut.length) * 100) : 0;

    DATA.invKpi = [
      { name:"สต็อกอยู่ในเกณฑ์ (Min-Max)", value:accuracyPct, unit:"%", target:95, state:stateHigher(accuracyPct, 95) },
      { name:"Critical Part Availability", value:availPct, unit:"%", target:100, state:stateHigher(availPct, 100, 0.9) },
      { name:"Dead Stock Value", value:Math.round(deadStockValue), unit:"฿", target:50000, state:stateLower(deadStockValue, 50000), money:true, lowerBetter:true },
      { name:"Emergency Purchase", value:emergencyPct, unit:"%", target:5, state:stateLower(emergencyPct, 5, 2), lowerBetter:true },
    ];
  };
  DATA.pareto = [
    { name:"PLC Controller", code:"PT-28", count:11 }, { name:"Solenoid Valve", code:"PT-04", count:8 },
    { name:"Heater Element", code:"PT-34", count:6 }, { name:"Hydraulic Pump", code:"PT-01", count:5 },
    { name:"O-Ring / Seal", code:"PT-13", count:4 }, { name:"Filter", code:"PT-02", count:3 },
    { name:"Relay", code:"PT-27", count:2 }, { name:"Belt", code:"PT-65", count:1 },
  ];
  DATA.downtimeTrend = [
    { m:"ธ.ค.", date:"2025-12-01", v:7.2 }, { m:"ม.ค.", date:"2026-01-01", v:6.1 }, { m:"ก.พ.", date:"2026-02-01", v:5.4 },
    { m:"มี.ค.", date:"2026-03-01", v:4.8 }, { m:"เม.ย.", date:"2026-04-01", v:3.6 }, { m:"พ.ค.", date:"2026-05-01", v:2.75 },
  ];
  const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  DATA.fmtThaiDate = (d) => `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  DATA.dateRangeLabel = (entries) => {
    if (!entries || !entries.length) return "";
    const start = new Date(entries[0].date);
    const lastM = new Date(entries[entries.length - 1].date);
    const end = new Date(lastM.getFullYear(), lastM.getMonth() + 1, 0);
    return `${DATA.fmtThaiDate(start)} – ${DATA.fmtThaiDate(end)}`;
  };
  DATA.roleUser = {
    Operator:{ name:"Somchai K.", short:"SK" }, Maintenance:{ name:"Somsak R.", short:"SR" },
    Technician:{ name:"Somsak R.", short:"SR" }, Supervisor:{ name:"Prasert W.", short:"PW" },
    "Store Keeper":{ name:"Wanida T.", short:"WT" },
    Manager:{ name:"Direk M.", short:"DM" }, Admin:{ name:"Admin", short:"AD" },
  };
  DATA.roleLabelTH = {
    Operator:"พนักงานหน้างาน", Maintenance:"ช่างซ่อมบำรุง / ฝ่าย MT",
    Technician:"ช่างซ่อมบำรุง", Supervisor:"ช่างซ่อมบำรุง / ฝ่าย MT",
    "Store Keeper":"เจ้าหน้าที่คลัง", Manager:"ผู้บริหาร", Admin:"ผู้ดูแลระบบ",
  };

  /* ---------- load จาก API ---------- */
  async function load() {
    const res = await fetch(API + "/api/bootstrap");
    if (!res.ok) throw new Error("API " + res.status + ": " + (await res.text()));
    const d = await res.json();
    Object.assign(DATA, {
      machines:d.machines, parts:d.parts, requests:d.requests, repairs:d.repairs,
      usage:d.usage, pm:d.pm, users:d.users, stockIn:d.stockIn, stockOut:d.stockOut,
      suppliers:d.suppliers, purchaseOrders:d.purchaseOrders, poItems:d.poItems,
    });
    DATA.computeKpis();
    DATA.computeInvKpi();
  }

  /* ---------- write helpers ---------- */
  DATA.createRequest = async ({ machineCode, problem, priority, reporterName }) => {
    const res = await fetch(API + "/api/requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineCode, problem, priority, reporterName }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "create failed");
    return j.request_no;
  };
  DATA.createUser = async ({ fullName, role, email, phone, telegramId }) => {
    const res = await fetch(API + "/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, role, email, phone, telegramId }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "เพิ่มผู้ใช้ไม่สำเร็จ");
    return j;
  };
  DATA.updateUser = async ({ db_id, fullName, role, email, phone, telegramId, isActive }) => {
    const res = await fetch(API + "/api/users/" + encodeURIComponent(db_id), {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, role, email, phone, telegramId, isActive }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "แก้ไขผู้ใช้ไม่สำเร็จ");
    return j;
  };
  DATA.updateMachine = async ({ code, name, group, rank, criticality, dept, location, maker, model, installDate, status }) => {
    const res = await fetch(API + "/api/machines/" + encodeURIComponent(code), {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, group, rank, criticality, dept, location, maker, model, installDate, status }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "แก้ไขเครื่องจักรไม่สำเร็จ");
    return j;
  };
  DATA.createMachine = async ({ code, name, group, rank, criticality, dept, location, maker, model, installDate, status }) => {
    const res = await fetch(API + "/api/machines", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, group, rank, criticality, dept, location, maker, model, installDate, status }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "เพิ่มเครื่องจักรไม่สำเร็จ");
    return j;
  };
  DATA.updatePart = async ({ code, name, group, partRank, max, min, safety, rop, price }) => {
    const res = await fetch(API + "/api/parts/" + encodeURIComponent(code), {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, group, partRank, max, min, safety, rop, price }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "แก้ไขอะไหล่ไม่สำเร็จ");
    return j;
  };
  DATA.createPart = async ({ code, name, group, partRank, max, min, safety, rop, price }) => {
    const res = await fetch(API + "/api/parts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, group, partRank, max, min, safety, rop, price }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "create part failed");
    return j;
  };
  DATA.recordStockMove = async ({ code, type, qty, by, reason, mc, date }) => {
    const res = await fetch(API + "/api/stock-movements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, qty, by, reason, mc, date }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "save failed");
    return j;
  };
  DATA.createPO = async ({ supplier, expectedDate, note, items }) => {
    const res = await fetch(API + "/api/purchase-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplier, expectedDate, note, items }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "create PO failed");
    return j;
  };
  DATA.deleteRequest = async (requestNo) => {
    const res = await fetch(API + "/api/requests/" + encodeURIComponent(requestNo), {
      method: "DELETE",
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "delete failed");
    return j;
  };
  DATA.completeRequest = async (requestNo) => {
    const res = await fetch(API + "/api/requests/" + encodeURIComponent(requestNo) + "/complete", {
      method: "POST",
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "complete failed");
    return j;
  };
  DATA.saveRepair = async (requestNo, repair, parts = []) => {
    const res = await fetch(API + "/api/repairs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestNo, repair, parts }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "save failed");
    return j;
  };
  DATA.refresh = load;

  /* ---------- auto-poll: ตรวจสถานะใบแจ้งซ่อม / คลังอะไหล่เปลี่ยน ---------- */
  const statusSig = () => (DATA.requests || []).map((r) => r.no + ":" + r.status).join("|");
  const invSig = () => (DATA.parts || []).map((p) => p.code + ":" + p.cur).join("|")
    + "#" + (DATA.stockIn || []).length + "#" + (DATA.stockOut || []).length + "#" + (DATA.purchaseOrders || []).length;
  let lastSig = "";
  let lastInvSig = "";
  async function pollOnce() {
    try {
      await load();
      const s = statusSig();
      const inv = invSig();
      if (s !== lastSig || inv !== lastInvSig) {
        lastSig = s;
        lastInvSig = inv;
        window.dispatchEvent(new Event("mt-data-refresh"));
      }
    } catch (e) { /* เงียบไว้ ไม่รบกวนผู้ใช้ */ }
  }

  /* ---------- bootstrap ---------- */
  window.DATA = DATA;
  load()
    .then(() => {
      lastSig = statusSig();
      lastInvSig = invSig();
      window.__MT_READY = true;
      window.dispatchEvent(new Event("mt-data-ready"));
      setInterval(pollOnce, POLL_MS);
      console.log("[api-bridge] loaded:", { machines: DATA.machines.length, requests: DATA.requests.length, parts: DATA.parts.length });
    })
    .catch((e) => {
      console.error("[api-bridge] load failed:", e);
      const root = document.getElementById("root");
      if (root) root.innerHTML =
        '<div style="padding:40px;font-family:sans-serif;max-width:640px;margin:40px auto;border:1px solid #e3ded3;border-radius:14px">' +
        '<h2 style="margin:0 0 8px">เชื่อม API ไม่สำเร็จ</h2>' +
        '<p style="color:#766">ตรวจสอบว่า backend รันอยู่ (npm start) และ <b>api-config.js</b> ชี้ URL ถูก และรัน schema_mysql.sql + seed_mysql.sql แล้ว</p>' +
        '<pre style="background:#faf8f3;padding:12px;border-radius:8px;overflow:auto;font-size:12px">' + String(e && e.message || e) + '</pre></div>';
    });
})();
