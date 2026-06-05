/* ============================================================
   supabase-bridge.js  —  BRIDGE LAYER (แทนที่ data.js)
   ------------------------------------------------------------
   ดึงข้อมูลสดจาก Supabase แล้วประกอบเป็น window.DATA "รูปทรงเดิม"
   เพื่อให้ UI prototype เดิมทำงานได้โดยไม่ต้องแก้หน้าจอ
   เมื่อโหลดเสร็จจะ dispatch event "mt-data-ready" ให้ app.jsx mount

   ส่วนที่เป็น "live" จาก DB: machines, requests, repairs, usage,
       parts, pm, stockIn/Out, users
   ส่วน analytics ที่ยังเป็นค่านำเสนอ (kpi, pareto, mcGroups ...)
       คงไว้ก่อน — ทำเป็น view เพิ่มภายหลังได้
   ============================================================ */
(function () {
  const DATA = {};

  /* ---------- helpers (เหมือน data.js) ---------- */
  DATA.fmtMoney = (n) => "฿" + Number(n || 0).toLocaleString("en-US");
  DATA.fmtNum = (n) => Number(n || 0).toLocaleString("en-US");
  DATA.partByCode = (code) => DATA.parts.find((p) => p.code === code);
  DATA.machineByCode = (code) => DATA.machines.find((m) => m.code === code);
  DATA.requestsForMachine = (code) => DATA.requests.filter((r) => r.mc === code);
  DATA.scannedMachine = "MC-001";

  /* ---------- static / presentational (ยังไม่ย้ายเข้า DB) ---------- */
  DATA.kpi = [
    { key:"MTBF", name:"MTBF", full:"Mean Time Between Failures", value:"420", unit:"ชม.", target:"เพิ่มขึ้น 20%", state:"good", delta:"+18%", trend:"up", note:"Total Running Hrs / Breakdowns" },
    { key:"MTTR", name:"MTTR", full:"Mean Time To Repair", value:"1.38", unit:"ชม.", target:"ลดลง 30%", state:"good", delta:"−24%", trend:"down", note:"Total Repair Hrs / Breakdowns" },
    { key:"BRK", name:"Breakdown Rate", full:"จำนวนครั้งที่เสีย/เดือน", value:"4", unit:"ครั้ง/เดือน", target:"ลดลง 50%", state:"warn", delta:"−12%", trend:"down", note:"Total Breakdown Incidents" },
    { key:"DOWN", name:"Total Downtime", full:"เวลาเครื่องหยุดรวม", value:"2.75", unit:"ชม.", target:"ให้ต่ำที่สุด", state:"good", delta:"−0.9h", trend:"down", note:"Sum of all downtime" },
    { key:"PM", name:"PM Compliance", full:"ความสอดคล้องแผน PM", value:"80", unit:"%", target:"> 95%", state:"bad", delta:"15% ต่ำกว่าเป้า", trend:"flat", note:"Completed PM / Planned PM" },
  ];
  // Risk matrix — อัปเดตเป็น Telegram ให้ตรงกับ notification_plan.md
  DATA.riskMatrix = [
    { rank:"Rank A", sub:"High Impact MC", crit:"Critical Part", zone:"HIGH", proto:"Telegram Alert ทันที + แจ้งหัวหน้า (Email)" },
    { rank:"Rank A", sub:"High Impact MC", crit:"Medium / Low", zone:"HIGH", proto:"Telegram Alert ทันที ถึงทีมช่าง" },
    { rank:"Rank B", sub:"Medium Impact", crit:"Critical Part", zone:"MEDIUM", proto:"Email Log + Telegram มาตรฐาน" },
    { rank:"Rank B", sub:"Medium Impact", crit:"Medium / Low", zone:"MEDIUM", proto:"คิวงานบนเว็บ (Mobile Queue)" },
    { rank:"Rank C", sub:"Low Impact", crit:"Low Criticality", zone:"LOW", proto:"Work Order Backlog Log" },
  ];
  DATA.riskGrid = {
    rows:["Rank A","Rank B","Rank C"], cols:["Critical Part","Medium Part","Low Part"],
    zone:{ "Rank A":["HIGH","HIGH","HIGH"], "Rank B":["MEDIUM","MEDIUM","MEDIUM"], "Rank C":["MEDIUM","LOW","LOW"] }
  };
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

  const roleRev = { operator:"Operator", technician:"Technician", supervisor:"Supervisor",
    store:"Store Keeper", manager:"Manager", admin:"Admin" };

  /* ---------- Supabase client ---------- */
  const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  window.sb = sb;

  const today = new Date().toISOString().slice(0, 10);

  async function load() {
    const [machines, parts, requests, repairs, usage, pm, users, moves] = await Promise.all([
      sb.from("machines").select("code,name,rank,criticality,location,maker,model,install_date,status,mc_groups(name),departments(name)").order("code"),
      sb.from("spare_parts").select("code,name,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost,mc_groups(name),suppliers(lead_time_days)").order("code"),
      sb.from("maintenance_requests").select("request_no,problem_description,priority,status,breakdown_start,finish_repair,downtime_hours,machines(code,name),departments(name),reporter:reporter_id(full_name)").order("breakdown_start"),
      sb.from("repair_actions").select("root_cause,corrective_action,repair_hours,verification_status,maintenance_requests(request_no,breakdown_start,finish_repair),technician:technician_id(full_name),problem_categories(name),verifier:verified_by(full_name)"),
      sb.from("spare_part_usage").select("qty_used,unit_cost,maintenance_requests(request_no),spare_parts(code,name,suppliers(name))"),
      sb.from("pm_schedules").select("checklist,frequency,last_pm_date,next_pm_date,completed,machines(code,name)"),
      sb.from("app_users").select("full_name,email,role,is_active").order("full_name"),
      sb.from("stock_movements").select("type,qty,moved_at,note,spare_parts(code,name)").order("moved_at", { ascending: false }),
    ]);

    const err = [machines, parts, requests, repairs, usage, pm, users, moves].find((r) => r.error);
    if (err) throw err.error;

    /* ---- machines ---- */
    DATA.machines = machines.data.map((m) => ({
      code:m.code, name:m.name, group:m.mc_groups?.name || "", rank:m.rank,
      dept:m.departments?.name || "", zone:m.location || "", maker:m.maker || "",
      model:m.model || "", install:m.install_date || "", crit:m.criticality, status:m.status,
    }));

    /* ---- parts (+ computed value/status เหมือน data.js) ---- */
    const rankFromScore = (s) => (s >= 9 ? "Critical" : s >= 6 ? "Medium" : "Low");
    DATA.parts = parts.data.map((p) => {
      const o = {
        code:p.code, name:p.name, group:p.mc_groups?.name || "", brand:"—",
        partRank:rankFromScore(p.criticality_score), max:p.max_stock, min:p.min_stock,
        safety:p.safety_stock, rop:p.rop, cur:p.current_stock, price:Number(p.unit_cost),
        leadTime:p.suppliers?.lead_time_days || 0, score:p.criticality_score, owner:"—",
      };
      o.value = o.cur * o.price;
      o.status = o.cur <= 0 ? "critical" : o.cur <= o.rop ? "reorder" : "normal";
      return o;
    });

    /* ---- requests ---- */
    DATA.requests = requests.data.map((r) => ({
      no:r.request_no, date:r.breakdown_start, mc:r.machines?.code || "",
      mcName:r.machines?.name || "", type:"งานซ่อม", problem:r.problem_description,
      priority:r.priority, reporter:r.reporter?.full_name || "", dept:r.departments?.name || "",
      status:r.status, start:r.breakdown_start, finish:r.finish_repair || "",
      downtime:r.downtime_hours,
      acceptedBy:"", acceptedAt:"",
    }));

    /* ---- repairs (keyed by request_no) ---- */
    DATA.repairs = {};
    repairs.data.forEach((ra) => {
      const no = ra.maintenance_requests?.request_no;
      if (!no) return;
      DATA.repairs[no] = {
        tech:ra.technician?.full_name || "", cat:ra.problem_categories?.name || "",
        root:ra.root_cause || "", action:ra.corrective_action || "", causeType:"เสื่อมสภาพ",
        hrs:Number(ra.repair_hours || 0), verify:ra.verification_status,
        by:ra.verifier?.full_name || "",
        start:ra.maintenance_requests?.breakdown_start || "",
        finish:ra.maintenance_requests?.finish_repair || "",
      };
    });

    /* ---- usage (keyed by request_no, array) ---- */
    DATA.usage = {};
    usage.data.forEach((x) => {
      const no = x.maintenance_requests?.request_no;
      if (!no) return;
      (DATA.usage[no] = DATA.usage[no] || []).push({
        code:x.spare_parts?.code || "", name:x.spare_parts?.name || "",
        qty:x.qty_used, unit:Number(x.unit_cost), supplier:x.spare_parts?.suppliers?.name || "",
      });
    });

    /* ---- pm ---- */
    DATA.pm = pm.data.map((p) => ({
      mc:p.machines?.code || "", name:p.machines?.name || "", checklist:p.checklist,
      freq:p.frequency, last:p.last_pm_date || "", next:p.next_pm_date || "",
      status:p.completed ? "Completed" : (p.next_pm_date && p.next_pm_date < today ? "Overdue" : "Due Later"),
    }));

    /* ---- users ---- */
    DATA.users = users.data.map((u, i) => ({
      id:"U-" + String(i + 1).padStart(3, "0"), name:u.full_name,
      user:(u.email || "").split("@")[0], role:roleRev[u.role] || "Operator",
      dept:"", status:u.is_active ? "Active" : "Inactive",
    }));

    /* ---- stock logs ---- */
    DATA.stockIn = moves.data.filter((m) => m.type === "IN").map((m) => ({
      date:(m.moved_at || "").slice(0, 10), doc:m.note || "", code:m.spare_parts?.code || "",
      name:m.spare_parts?.name || "", qty:m.qty, by:"",
    }));
    DATA.stockOut = moves.data.filter((m) => m.type === "OUT").map((m) => ({
      date:(m.moved_at || "").slice(0, 10), doc:m.note || "", code:m.spare_parts?.code || "",
      name:m.spare_parts?.name || "", qty:m.qty, by:"", mc:"", reason:m.note || "",
    }));
  }

  /* ---------- WRITE HELPERS (เรียกจากฟอร์มได้) ---------- */
  // แจ้งซ่อมใหม่ — DB จะรันเลข REQ + ยิง Telegram ให้เอง
  DATA.createRequest = async ({ machineCode, problem, priority, reporterName }) => {
    const { data: mc, error: mcErr } = await sb.from("machines").select("id").eq("code", machineCode).single();
    if (mcErr || !mc) throw new Error("Machine not found: " + machineCode);
    let reporter_id = null;
    if (reporterName) {
      const { data: u } = await sb.from("app_users").select("id").eq("full_name", reporterName).maybeSingle();
      reporter_id = u?.id || null;
    }
    const { data, error } = await sb.from("maintenance_requests")
      .insert({ machine_id: mc.id, problem_description: problem, priority, reporter_id, status: "Waiting" })
      .select("request_no").single();
    if (error) throw error;
    return data.request_no;
  };
  DATA.completeRequest = async (requestNo) => {
    const { data: r, error: findErr } = await sb.from("maintenance_requests").select("id").eq("request_no", requestNo).single();
    if (findErr || !r) throw new Error("Request not found: " + requestNo);
    const { error } = await sb.from("maintenance_requests").update({ status: "Completed", finish_repair: new Date().toISOString() }).eq("id", r.id);
    if (error) throw error;
  };
  DATA.deleteRequest = async (requestNo) => {
    const { data: r, error: findErr } = await sb.from("maintenance_requests").select("id").eq("request_no", requestNo).single();
    if (findErr || !r) throw new Error("Request not found: " + requestNo);
    const { error } = await sb.from("maintenance_requests").delete().eq("id", r.id);
    if (error) throw error;
  };
  // บันทึกการซ่อม + อะไหล่ที่ใช้ (DB ตัดสต็อกให้เอง)
  DATA.saveRepair = async (requestNo, repair, parts = []) => {
    const { data: r } = await sb.from("maintenance_requests").select("id").eq("request_no", requestNo).single();
    await sb.from("repair_actions").insert({
      request_id: r.id, root_cause: repair.root, corrective_action: repair.action,
      repair_hours: repair.hrs, verification_status: repair.verify || "Pending",
    });
    for (const p of parts) {
      const { data: sp } = await sb.from("spare_parts").select("id,unit_cost").eq("code", p.code).single();
      await sb.from("spare_part_usage").insert({
        request_id: r.id, part_id: sp.id, qty_used: p.qty, unit_cost: p.unit ?? sp.unit_cost,
      });
    }
    await sb.from("maintenance_requests").update({ status: "Completed", finish_repair: new Date().toISOString() }).eq("id", r.id);
  };
  DATA.refresh = load;

  /* ---------- bootstrap ---------- */
  window.DATA = DATA; // ตั้งไว้ล่วงหน้า (helpers พร้อม) แต่ยังไม่มี array
  load()
    .then(() => {
      window.__MT_READY = true;
      window.dispatchEvent(new Event("mt-data-ready"));
      console.log("[bridge] Supabase data loaded:", {
        machines: DATA.machines.length, requests: DATA.requests.length, parts: DATA.parts.length,
      });
    })
    .catch((e) => {
      console.error("[bridge] load failed:", e);
      const root = document.getElementById("root");
      if (root) root.innerHTML =
        '<div style="padding:40px;font-family:sans-serif;max-width:640px;margin:40px auto;border:1px solid #e3ded3;border-radius:14px">' +
        '<h2 style="margin:0 0 8px">เชื่อม Supabase ไม่สำเร็จ</h2>' +
        '<p style="color:#766">ตรวจสอบ <b>supabase-config.js</b> (URL / anon key) และว่ารัน schema.sql + seed.sql แล้ว</p>' +
        '<pre style="background:#faf8f3;padding:12px;border-radius:8px;overflow:auto;font-size:12px">' +
        String(e && e.message || e) + "</pre></div>";
    });
})();
