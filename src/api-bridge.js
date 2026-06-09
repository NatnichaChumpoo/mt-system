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

  /* ---------- static / presentational ---------- */
  DATA.kpi = [
    { key:"MTBF", name:"MTBF", full:"Mean Time Between Failures", value:"420", unit:"ชม.", target:"เพิ่มขึ้น 20%", state:"good", delta:"+18%", trend:"up", note:"Total Running Hrs / Breakdowns" },
    { key:"MTTR", name:"MTTR", full:"Mean Time To Repair", value:"1.38", unit:"ชม.", target:"ลดลง 30%", state:"good", delta:"−24%", trend:"down", note:"Total Repair Hrs / Breakdowns" },
    { key:"BRK", name:"Breakdown Rate", full:"จำนวนครั้งที่เสีย/เดือน", value:"4", unit:"ครั้ง/เดือน", target:"ลดลง 50%", state:"warn", delta:"−12%", trend:"down", note:"Total Breakdown Incidents" },
    { key:"DOWN", name:"Total Downtime", full:"เวลาเครื่องหยุดรวม", value:"2.75", unit:"ชม.", target:"ให้ต่ำที่สุด", state:"good", delta:"−0.9h", trend:"down", note:"Sum of all downtime" },
    { key:"PM", name:"PM Compliance", full:"ความสอดคล้องแผน PM", value:"80", unit:"%", target:"> 95%", state:"bad", delta:"15% ต่ำกว่าเป้า", trend:"flat", note:"Completed PM / Planned PM" },
  ];
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
  DATA.invKpi = [
    { name:"Inventory Accuracy", value:96, unit:"%", target:98, state:"warn" },
    { name:"Critical Part Availability", value:95, unit:"%", target:100, state:"bad" },
    { name:"Dead Stock Value", value:145000, unit:"฿", target:50000, state:"bad", money:true, lowerBetter:true },
    { name:"Emergency Purchase", value:8, unit:"%", target:5, state:"warn", lowerBetter:true },
  ];
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

  /* ---------- auto-poll: ตรวจสถานะใบแจ้งซ่อมเปลี่ยน ---------- */
  const statusSig = () => (DATA.requests || []).map((r) => r.no + ":" + r.status).join("|");
  let lastSig = "";
  async function pollOnce() {
    try {
      await load();
      const s = statusSig();
      if (s !== lastSig) {
        lastSig = s;
        window.dispatchEvent(new Event("mt-data-refresh"));
      }
    } catch (e) { /* เงียบไว้ ไม่รบกวนผู้ใช้ */ }
  }

  /* ---------- bootstrap ---------- */
  window.DATA = DATA;
  load()
    .then(() => {
      lastSig = statusSig();
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
