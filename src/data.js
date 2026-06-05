/* ============================================================
   MT_System — data layer (real values from uploaded workbooks)
   Exposed as window.DATA
   ============================================================ */
(function () {
  const DATA = {};

  /* ---------------- Machines (Machine_Master) ---------------- */
  DATA.machines = [
    { code:"MC-001", name:"Compression Machine A1", group:"Compression", rank:"A", dept:"Production Line 1", zone:"Zone A", maker:"Maker Corp", model:"MX-200", install:"2022-01-15", crit:"HIGH", status:"Running" },
    { code:"MC-002", name:"Compression Machine A2", group:"Compression", rank:"A", dept:"Production Line 1", zone:"Zone A", maker:"Maker Corp", model:"MX-200", install:"2022-01-15", crit:"HIGH", status:"Running" },
    { code:"MC-003", name:"Injection Molding B1", group:"Injection", rank:"B", dept:"Production Line 2", zone:"Zone B", maker:"Nissei", model:"NJ-500", install:"2023-05-20", crit:"MEDIUM", status:"Running" },
    { code:"MC-004", name:"Injection Molding B2", group:"Injection", rank:"B", dept:"Production Line 2", zone:"Zone B", maker:"Nissei", model:"NJ-500", install:"2023-05-22", crit:"MEDIUM", status:"Stop" },
    { code:"MC-005", name:"CNC Milling C1", group:"Machining", rank:"C", dept:"Maintenance Workshop", zone:"Zone C", maker:"Fanuc", model:"Robodrill", install:"2024-11-02", crit:"LOW", status:"Running" },
    { code:"C16",    name:"เครื่องอัด 200 Ton", group:"Forming", rank:"B", dept:"Forming Line", zone:"Zone D", maker:"TECO", model:"200T-Vacuum", install:"2021-03-10", crit:"MEDIUM", status:"Running" },
    { code:"EX-01",  name:"Extruder 01", group:"Forming", rank:"B", dept:"Forming Line", zone:"Zone D", maker:"Battenfeld", model:"EX-90", install:"2022-08-01", crit:"MEDIUM", status:"Running" },
  ];

  /* default machine shown after QR scan */
  DATA.scannedMachine = "MC-001";

  /* ---------------- Maintenance requests ---------------- */
  DATA.requests = [
    { no:"REQ-2026-001", date:"2026-05-25 08:30", mc:"MC-001", mcName:"Compression Machine A1", type:"งานซ่อม", problem:"Heater element broken, temperature dropped", priority:"High", reporter:"Somchai K.", dept:"Production Line 1", status:"Completed", start:"2026-05-25 08:30", finish:"2026-05-25 10:45", downtime:2.25 },
    { no:"REQ-2026-002", date:"2026-05-26 13:15", mc:"MC-004", mcName:"Injection Molding B2", type:"งานซ่อม", problem:"Hydraulic oil leak from main cylinder", priority:"Critical", reporter:"Wichai S.", dept:"Production Line 2", status:"In Progress", start:"2026-05-26 13:15", finish:"", downtime:null },
    { no:"REQ-2026-003", date:"2026-05-27 10:00", mc:"MC-003", mcName:"Injection Molding B1", type:"งานซ่อม", problem:"Conveyor motor makes abnormal noise", priority:"Medium", reporter:"Anan P.", dept:"Production Line 2", status:"Waiting", start:"2026-05-27 10:00", finish:"", downtime:null },
    { no:"REQ-2026-004", date:"2026-05-28 06:45", mc:"MC-002", mcName:"Compression Machine A2", type:"งานซ่อม", problem:"Limit switch malfunction at safety gate", priority:"Low", reporter:"Somchai K.", dept:"Production Line 1", status:"Completed", start:"2026-05-28 06:45", finish:"2026-05-28 07:15", downtime:0.5 },
    { no:"REQ-2026-005", date:"2026-05-29 14:20", mc:"C16", mcName:"เครื่องอัด 200 Ton", type:"งานซ่อม", problem:"Vacuum pump pressure unstable, ปั๊มสุญญากาศแรงดันตก", priority:"High", reporter:"Prasit T.", dept:"Forming Line", status:"Waiting", start:"2026-05-29 14:20", finish:"", downtime:null },
  ];

  /* ---------------- Repair actions ---------------- */
  DATA.repairs = {
    "REQ-2026-001": { tech:"Technician A (Somsak)", cat:"Electrical", root:"Heater coil accumulated corrosion and burnt out", action:"Replaced with new heater element and tested current load", causeType:"เสื่อมสภาพ", hrs:2.25, verify:"Approved", by:"MGR-Prasert", start:"08:30", finish:"10:45" },
    "REQ-2026-002": { tech:"Technician B (Nattawut)", cat:"Mechanical", root:"O-ring seal degraded causing pressure drop", action:"Under Repair — dismantling the hydraulic cylinder block", causeType:"เสื่อมสภาพ", hrs:0, verify:"Pending", by:"", start:"13:15", finish:"" },
    "REQ-2026-004": { tech:"Technician A (Somsak)", cat:"Electrical", root:"Dust accumulation caused loose contact on limit switch", action:"Cleaned contacts and adjusted alignment of the safety gate actuator", causeType:"เสื่อมสภาพ", hrs:0.5, verify:"Approved", by:"MGR-Prasert", start:"06:45", finish:"07:15" },
  };

  /* ---------------- Spare part usage per request ---------------- */
  DATA.usage = {
    "REQ-2026-001": [ { code:"SP-H012", name:"Heater Element 200W", qty:1, unit:1500, supplier:"Industrial Supply Co." } ],
    "REQ-2026-002": [ { code:"SP-O881", name:"Hydraulic O-Ring Kit v2", qty:2, unit:450, supplier:"Fluid Components Ltd." } ],
    "REQ-2026-004": [ { code:"SP-E004", name:"Contact Cleaner Spray", qty:1, unit:180, supplier:"Home Pro Depot" } ],
  };

  /* ---------------- PM schedule ---------------- */
  DATA.pm = [
    { mc:"MC-001", name:"Compression Machine A1", checklist:"Check heater wiring & insulation resistance", freq:"Monthly",   last:"2026-05-10", next:"2026-06-10", status:"Completed" },
    { mc:"MC-002", name:"Compression Machine A2", checklist:"Check heater wiring & insulation resistance", freq:"Monthly",   last:"2026-05-10", next:"2026-06-10", status:"Completed" },
    { mc:"MC-003", name:"Injection Molding B1",   checklist:"Lubricate main conveyor bearings & chains", freq:"Weekly",     last:"2026-05-24", next:"2026-05-31", status:"Completed" },
    { mc:"MC-004", name:"Injection Molding B2",   checklist:"Hydraulic oil filter cleaning & quality check", freq:"Quarterly", last:"2026-02-15", next:"2026-05-15", status:"Overdue" },
    { mc:"MC-005", name:"CNC Milling C1",         checklist:"Spindle runout alignment calibration check", freq:"Yearly",   last:"2025-11-01", next:"2026-11-01", status:"Due Later" },
    { mc:"C16",    name:"เครื่องอัด 200 Ton",       checklist:"Vacuum pump oil & seal inspection", freq:"Monthly", last:"2026-04-28", next:"2026-05-28", status:"Overdue" },
  ];

  /* ---------------- Core KPI ---------------- */
  DATA.kpi = [
    { key:"MTBF",  name:"MTBF", full:"Mean Time Between Failures", value:"420", unit:"ชม.", target:"เพิ่มขึ้น 20%", state:"good",  delta:"+18%", trend:"up",   note:"Total Running Hrs / Breakdowns" },
    { key:"MTTR",  name:"MTTR", full:"Mean Time To Repair", value:"1.38", unit:"ชม.", target:"ลดลง 30%", state:"good",  delta:"−24%", trend:"down", note:"Total Repair Hrs / Breakdowns" },
    { key:"BRK",   name:"Breakdown Rate", full:"จำนวนครั้งที่เสีย/เดือน", value:"4", unit:"ครั้ง/เดือน", target:"ลดลง 50%", state:"warn",  delta:"−12%", trend:"down", note:"Total Breakdown Incidents" },
    { key:"DOWN",  name:"Total Downtime", full:"เวลาเครื่องหยุดรวม", value:"2.75", unit:"ชม.", target:"ให้ต่ำที่สุด", state:"good",  delta:"−0.9h", trend:"down", note:"Sum of all downtime" },
    { key:"PM",    name:"PM Compliance", full:"ความสอดคล้องแผน PM", value:"80", unit:"%", target:"> 95%", state:"bad",   delta:"15% ต่ำกว่าเป้า", trend:"flat", note:"Completed PM / Planned PM" },
  ];

  /* ---------------- Risk matrix (Rank x Part criticality) ---------------- */
  DATA.riskMatrix = [
    { rank:"Rank A", sub:"High Impact MC", crit:"Critical Part",  zone:"HIGH",   proto:"Telegram Alert ทันที + แจ้งหัวหน้า (Email)" },
    { rank:"Rank A", sub:"High Impact MC", crit:"Medium / Low",   zone:"HIGH",   proto:"Telegram Alert ทันที ถึงทีมช่าง" },
    { rank:"Rank B", sub:"Medium Impact",  crit:"Critical Part",  zone:"MEDIUM", proto:"Email Log + Telegram มาตรฐาน" },
    { rank:"Rank B", sub:"Medium Impact",  crit:"Medium / Low",   zone:"MEDIUM", proto:"คิวงานบนเว็บ (Mobile Queue)" },
    { rank:"Rank C", sub:"Low Impact",     crit:"Low Criticality",zone:"LOW",    proto:"Work Order Backlog Log" },
  ];
  /* grid form: rows = ranks, cols = part criticality */
  DATA.riskGrid = {
    rows:["Rank A","Rank B","Rank C"],
    cols:["Critical Part","Medium Part","Low Part"],
    zone:{ "Rank A":["HIGH","HIGH","HIGH"], "Rank B":["MEDIUM","MEDIUM","MEDIUM"], "Rank C":["MEDIUM","LOW","LOW"] }
  };

  /* ---------------- MC Group summary (Executive_Dashboard) ---------------- */
  DATA.mcGroups = [
    { group:"Compression", machines:12, parts:320, value:1250000, critical:48, reorder:12, risk:"HIGH" },
    { group:"Injection",   machines:8,  parts:240, value:980000,  critical:35, reorder:8,  risk:"HIGH" },
    { group:"Vacuum",      machines:5,  parts:120, value:450000,  critical:15, reorder:3,  risk:"MEDIUM" },
    { group:"CNC",         machines:4,  parts:90,  value:780000,  critical:18, reorder:5,  risk:"MEDIUM" },
    { group:"Utility",     machines:10, parts:150, value:220000,  critical:5,  reorder:1,  risk:"LOW" },
  ];

  /* inventory KPIs */
  DATA.invKpi = [
    { name:"Inventory Accuracy", value:96, unit:"%", target:98, state:"warn" },
    { name:"Critical Part Availability", value:95, unit:"%", target:100, state:"bad" },
    { name:"Dead Stock Value", value:145000, unit:"฿", target:50000, state:"bad", money:true, lowerBetter:true },
    { name:"Emergency Purchase", value:8, unit:"%", target:5, state:"warn", lowerBetter:true },
  ];

  /* Pareto — top failing parts (synthesized from usage + criticality) */
  DATA.pareto = [
    { name:"PLC Controller", code:"PT-28", count:11 },
    { name:"Solenoid Valve", code:"PT-04", count:8 },
    { name:"Heater Element", code:"PT-34", count:6 },
    { name:"Hydraulic Pump", code:"PT-01", count:5 },
    { name:"O-Ring / Seal", code:"PT-13", count:4 },
    { name:"Filter", code:"PT-02", count:3 },
    { name:"Relay", code:"PT-27", count:2 },
    { name:"Belt", code:"PT-65", count:1 },
  ];

  /* downtime trend (6 months, hrs) */
  DATA.downtimeTrend = [
    { m:"ธ.ค.", v:7.2 }, { m:"ม.ค.", v:6.1 }, { m:"ก.พ.", v:5.4 },
    { m:"มี.ค.", v:4.8 }, { m:"เม.ย.", v:3.6 }, { m:"พ.ค.", v:2.75 },
  ];

  /* ---------------- Spare part master data (V5 Master Data subset) ---------------- */
  // fields: code,name,group,brand,partRank,max,min,safety,rop,cur,price,leadTime,score,owner
  const P = (code,name,group,brand,partRank,max,min,safety,rop,cur,price,leadTime,score,owner)=>(
    {code,name,group,brand,partRank,max,min,safety,rop,cur,price,leadTime,score,owner}
  );
  DATA.parts = [
    P("PT-01","Hydraulic pump","Forming","TECO","Medium",2,1,1,2,0,0,0,6,"Maintenance Team"),
    P("PT-02","Filter","Forming","Mahle","Medium",2,1,1,2,0,0,0,6,"Maintenance Team"),
    P("PT-03","Oil Mirror","Forming","—","Low",2,1,1,2,0,0,0,6,"Maintenance Team"),
    P("PT-04","Solenoid Valve releasing cylinder upper","Forming","Yuken","Medium",2,1,1,2,0,0,7,6,"Maintenance Team"),
    P("PT-05","Solenoid Valve Main Cylinder","Forming","Yuken","Medium",2,1,1,2,1,0,7,6,"Maintenance Team"),
    P("PT-06","Solenoid Valve Mold Move in Cylinder","Forming","Yuken","Medium",2,1,1,2,1,0,7,6,"Maintenance Team"),
    P("PT-07","Counterbalance Valve","Forming","Yuken","Critical",2,1,1,2,0,0,7,6,"Maintenance Team"),
    P("PT-08","Counterbalance Valve","Forming","Yuken","Critical",2,1,1,2,0,0,7,6,"Maintenance Team"),
    P("PT-09","Proportion Pressure & Flow Compound Valve","Forming","Yuken","Critical",2,1,1,2,0,31000,7,6,"Maintenance Team"),
    P("PT-22","Temperature Controller","Forming","Omron","Medium",5,3,2,5,7,0,7,6,"Maintenance Team"),
    P("PT-23","Magnetic Contactor Motor pump","Forming","Fuji","Medium",4,2,1,3,2,0,0,6,"Maintenance Team"),
    P("PT-25","Overload Motor pump Hyd","Forming","Fuji","Medium",5,3,2,5,6,0,7,6,"Maintenance Team"),
    P("PT-26","Overload Motor Vacuum","Forming","Fuji","Medium",4,2,1,3,2,0,7,6,"Maintenance Team"),
    P("PT-27","Relay","Forming","Omron","Critical",2,1,1,2,0,0,7,9,"Maintenance Team"),
    P("PT-28","PLC Controller","Forming","Omron","Critical",2,1,1,2,0,0,30,9,"Maintenance Team"),
    P("PT-30","PLC Controller","Forming","Omron","Critical",2,1,1,2,0,28000,30,9,"Maintenance Team"),
    P("PT-33","Touch Screen","Forming","Fuji","Critical",2,1,1,2,0,0,14,6,"Maintenance Team"),
    P("PT-34","Heater (Top Plate)","Forming","Srang Sern","Medium",3,2,1,3,0,0,45,6,"Maintenance Team"),
    P("PT-35","Heater (Top/Lower Plate)","Forming","Srang Sern","Medium",4,2,1,3,1,0,45,6,"Maintenance Team"),
    P("PT-36","Heater (Top/Lower Plate)","Forming","Srang Sern","Medium",2,1,1,2,1,0,45,6,"Maintenance Team"),
    P("PT-37","Heater (Top Plate)","Forming","Srang Sern","Medium",2,1,1,2,5,0,45,6,"Maintenance Team"),
    P("PT-38","Insulating plate top 560x630 S400HT","Forming","Desma","Medium",2,1,1,2,0,12271,30,6,"Maintenance Team"),
    P("PT-39","Socket Head Screw M16x75","Forming","Desma","Low",20,12,6,18,0,36.85,30,6,"Maintenance Team"),
    P("PT-40","Proximity Sensor","Injection","Omron","Medium",4,2,1,3,3,1850,7,6,"Maintenance Team"),
    P("PT-41","Servo Motor Drive","Injection","Nissei","Critical",2,1,1,2,1,42000,21,9,"Maintenance Team"),
    P("PT-42","Conveyor Belt Motor","Injection","Mitsubishi","Medium",3,2,1,3,4,8600,14,6,"Maintenance Team"),
    P("PT-43","Thermocouple Type-K","Injection","RKC","Medium",10,5,3,8,12,420,7,3,"Store Keeper"),
    P("PT-44","Limit Switch Safety Gate","Injection","Omron","Medium",6,3,2,5,2,560,7,6,"Maintenance Team"),
    P("PT-50","Ball Bearing 6206","Machining","NSK","Low",12,6,4,10,15,180,3,3,"Store Keeper"),
    P("PT-51","Spindle Belt","Machining","Mitsuboshi","Medium",4,2,1,3,1,1200,7,6,"Maintenance Team"),
    P("PT-52","Coolant Pump","Machining","Fanuc","Medium",2,1,1,2,2,5400,14,6,"Maintenance Team"),
    P("PT-60","Air Filter Regulator","Utility","SMC","Low",8,4,2,6,9,340,3,3,"Store Keeper"),
    P("PT-61","Pneumatic Cylinder","Utility","Festo","Low",6,3,2,5,7,2100,7,3,"Store Keeper"),
    P("PT-65","Belt","Utility","Bando","Low",4,2,1,3,2,9000,7,3,"Store Keeper"),
  ];

  /* compute status for each part */
  DATA.parts.forEach(p=>{
    p.value = p.cur * p.price;
    if(p.cur<=0) p.status="critical";        // ของหมด
    else if(p.cur<=p.rop) p.status="reorder"; // ต่ำกว่า ROP
    else p.status="normal";
  });

  /* ---------------- Stock logs ---------------- */
  DATA.stockIn = [
    { date:"2026-05-29", doc:"PO-2026-014", code:"PT-43", name:"Thermocouple Type-K", qty:6, by:"Store_Admin" },
    { date:"2026-05-22", doc:"PO-2026-013", code:"PT-22", name:"Temperature Controller", qty:4, by:"Store_Admin" },
    { date:"2026-05-18", doc:"PO-2026-012", code:"PT-37", name:"Heater (Top Plate)", qty:3, by:"Store_Admin" },
    { date:"2026-05-12", doc:"PO-2026-011", code:"PT-25", name:"Overload Motor pump Hyd", qty:4, by:"Store_Admin" },
    { date:"2026-05-01", doc:"INIT-001", code:"PT-50", name:"Ball Bearing 6206", qty:15, by:"Store_Admin" },
    { date:"2026-05-01", doc:"INIT-001", code:"PT-60", name:"Air Filter Regulator", qty:9, by:"Store_Admin" },
  ];
  DATA.stockOut = [
    { date:"2026-05-28", doc:"REQ-2026-004", code:"SP-E004", name:"Contact Cleaner Spray", qty:1, by:"ช่างสมศักดิ์", mc:"MC-002", reason:"ใช้ในการซ่อม REQ-2026-004" },
    { date:"2026-05-26", doc:"REQ-2026-002", code:"SP-O881", name:"Hydraulic O-Ring Kit v2", qty:2, by:"ช่างณัฐวุฒิ", mc:"MC-004", reason:"ใช้ในการซ่อม REQ-2026-002" },
    { date:"2026-05-25", doc:"REQ-2026-001", code:"SP-H012", name:"Heater Element 200W", qty:1, by:"ช่างสมศักดิ์", mc:"MC-001", reason:"ใช้ในการซ่อม REQ-2026-001" },
    { date:"2026-05-12", doc:"REQ-2026001", code:"PT-01", name:"Hydraulic pump", qty:2, by:"ช่างสมชาย", mc:"C16", reason:"อะไหล่เสื่อมสภาพตามรอบ (PM)" },
    { date:"2026-05-12", doc:"REQ-2026001", code:"PT-04", name:"Solenoid Valve", qty:2, by:"ช่างสมชาย", mc:"C16", reason:"อะไหล่เสื่อมสภาพตามรอบ (PM)" },
  ];

  /* ---------------- Users (Admin) ---------------- */
  DATA.users = [
    { id:"U-001", name:"Somchai K.",   user:"somchai",  role:"Operator",     dept:"Production Line 1", status:"Active" },
    { id:"U-002", name:"Wichai S.",    user:"wichai",   role:"Operator",     dept:"Production Line 2", status:"Active" },
    { id:"U-003", name:"Somsak R.",    user:"somsak",   role:"Technician",   dept:"Maintenance",       status:"Active" },
    { id:"U-004", name:"Nattawut P.",  user:"nattawut", role:"Technician",   dept:"Maintenance",       status:"Active" },
    { id:"U-005", name:"Prasert W.",   user:"prasert",  role:"Supervisor",   dept:"Maintenance",       status:"Active" },
    { id:"U-006", name:"Wanida T.",    user:"wanida",   role:"Store Keeper", dept:"Warehouse",         status:"Active" },
    { id:"U-007", name:"Direk M.",     user:"direk",    role:"Manager",      dept:"Plant Management",  status:"Active" },
    { id:"U-008", name:"Admin",        user:"admin",    role:"Admin",        dept:"IT / System",       status:"Active" },
  ];

  /* identity per role for the topbar */
  DATA.roleUser = {
    "Operator":    { name:"Somchai K.",  short:"SK" },
    "Technician":  { name:"Somsak R.",   short:"SR" },
    "Supervisor":  { name:"Prasert W.",  short:"PW" },
    "Store Keeper":{ name:"Wanida T.",   short:"WT" },
    "Manager":     { name:"Direk M.",    short:"DM" },
    "Admin":       { name:"Admin",       short:"AD" },
  };

  DATA.roleLabelTH = {
    "Operator":"พนักงานหน้างาน",
    "Technician":"ช่างซ่อมบำรุง",
    "Supervisor":"หัวหน้างาน MT",
    "Store Keeper":"เจ้าหน้าที่คลัง",
    "Manager":"ผู้บริหาร",
    "Admin":"ผู้ดูแลระบบ",
  };

  /* helpers */
  DATA.fmtMoney = n => "฿" + Number(n||0).toLocaleString("en-US");
  DATA.fmtNum = n => Number(n||0).toLocaleString("en-US");
  DATA.partByCode = code => DATA.parts.find(p=>p.code===code);
  DATA.machineByCode = code => DATA.machines.find(m=>m.code===code);
  DATA.requestsForMachine = code => DATA.requests.filter(r=>r.mc===code);

  window.DATA = DATA;
})();
