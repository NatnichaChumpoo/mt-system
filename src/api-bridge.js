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
    { m:"ธ.ค.", v:7.2 }, { m:"ม.ค.", v:6.1 }, { m:"ก.พ.", v:5.4 },
    { m:"มี.ค.", v:4.8 }, { m:"เม.ย.", v:3.6 }, { m:"พ.ค.", v:2.75 },
  ];
  DATA.roleUser = {
    Operator:{ name:"Somchai K.", short:"SK" }, Technician:{ name:"Somsak R.", short:"SR" },
    Supervisor:{ name:"Prasert W.", short:"PW" }, "Store Keeper":{ name:"Wanida T.", short:"WT" },
    Manager:{ name:"Direk M.", short:"DM" }, Admin:{ name:"Admin", short:"AD" },
  };
  DATA.roleLabelTH = {
    Operator:"พนักงานหน้างาน", Technician:"ช่างซ่อมบำรุง", Supervisor:"หัวหน้างาน MT",
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
