/* ============================================================
   gen_seed.mjs  (dev tool)
   อ่าน data.js เดิม แล้ว generate seed.sql สำหรับ Supabase
   รัน:  node supabase/gen_seed.mjs > supabase/seed.sql
   ============================================================ */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
global.window = {};
require(path.join(__dirname, "..", "data.js"));
const D = global.window.DATA;

const q = (v) =>
  v === null || v === undefined || v === ""
    ? "null"
    : "'" + String(v).replace(/'/g, "''") + "'";
const n = (v) => (v === null || v === undefined || v === "" ? "null" : Number(v));
// แปลงวันที่/เวลา "2026-05-25 08:30" -> timestamptz literal
const ts = (v) => (v ? "'" + v + "'::timestamptz" : "null");
const d = (v) => (v ? "'" + v + "'::date" : "null");

const roleMap = {
  Operator: "operator", Technician: "technician", Supervisor: "supervisor",
  "Store Keeper": "store", Manager: "manager", Admin: "admin",
};
const statusMap = { Completed: "Completed", "In Progress": "In Progress", Waiting: "Waiting", New: "New" };
// user lookup by full_name (subselect)
const u = (name) =>
  name ? `(select id from app_users where full_name=${q(name)} limit 1)` : "null";

const out = [];
const w = (s) => out.push(s);

w("-- ============================================================");
w("-- seed.sql  — generated from data.js (ข้อมูลสมมุติ)");
w("-- รันหลัง schema.sql ใน Supabase SQL Editor");
w("-- ============================================================");
w("begin;");
w("-- ปิด trigger ระหว่าง seed เพื่อคุมค่าให้ตรง data.js");
w("alter table maintenance_requests disable trigger trg_notify_request;");
w("alter table maintenance_requests disable trigger trg_request_no;");
w("alter table spare_part_usage     disable trigger trg_apply_usage;");
w("alter table stock_movements      disable trigger trg_recalc_stock;");
w("alter table spare_parts          disable trigger trg_notify_low_stock;");
w("");

// ---- mc_groups ----
const groups = [...new Set([
  ...D.machines.map((m) => m.group),
  ...D.parts.map((p) => p.group),
  "Vacuum", "CNC",
])];
w("-- mc_groups");
groups.forEach((g) =>
  w(`insert into mc_groups(code,name) values (${q(g.toUpperCase().slice(0,8))},${q(g)});`)
);
w("");

// ---- departments ----
const depts = [...new Set([
  ...D.machines.map((m) => m.dept),
  ...D.users.map((x) => x.dept),
])];
w("-- departments");
depts.forEach((x) => w(`insert into departments(name) values (${q(x)});`));
w("");

// ---- problem_categories ----
w("-- problem_categories");
["Electrical", "Mechanical", "Hydraulic", "Pneumatic", "Other"].forEach((c) =>
  w(`insert into problem_categories(name) values (${q(c)});`)
);
w("");

// ---- suppliers ----
const sups = [...new Set(Object.values(D.usage).flat().map((x) => x.supplier))];
w("-- suppliers");
sups.forEach((s) => w(`insert into suppliers(name,lead_time_days) values (${q(s)},7);`));
w("");

// ---- app_users ----
w("-- app_users");
D.users.forEach((x) =>
  w(`insert into app_users(full_name,role,email,is_active) values (${q(x.name)},${q(roleMap[x.role])}::user_role,${q(x.user + "@car.local")},${x.status === "Active"});`)
);
w("");

// ---- machines ----
w("-- machines");
D.machines.forEach((m) =>
  w(`insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values (${q(m.code)},${q(m.name)},(select id from mc_groups where name=${q(m.group)}),${q(m.rank)}::machine_rank,${q(m.crit)}::criticality_level,(select id from departments where name=${q(m.dept)}),${q(m.zone)},${q(m.maker)},${q(m.model)},${d(m.install)},${q(m.status)}::machine_status);`)
);
w("");

// ---- spare_parts (set current_stock ตรงจาก cur) ----
w("-- spare_parts");
D.parts.forEach((p) =>
  w(`insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values (${q(p.code)},${q(p.name)},(select id from mc_groups where name=${q(p.group)}),${n(p.min)},${n(p.max)},${n(p.safety)},${n(p.rop)},${n(p.cur)},${n(p.score)},${n(p.price)});`)
);
w("");

// ---- maintenance_requests ----
w("-- maintenance_requests");
D.requests.forEach((r) =>
  w(`insert into maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 values (${q(r.no)},(select id from machines where code=${q(r.mc)}),${q(r.problem)},${q(r.priority)}::request_priority,${u(r.reporter)},(select id from departments where name=${q(r.dept)}),${q(statusMap[r.status] || "New")}::request_status,${ts(r.start)},${ts(r.finish)});`)
);
w("");

// ---- repair_actions ----
const techMap = {
  "Technician A (Somsak)": "Somsak R.",
  "Technician B (Nattawut)": "Nattawut P.",
};
const byMap = { "MGR-Prasert": "Prasert W." };
w("-- repair_actions");
Object.entries(D.repairs).forEach(([reqNo, ra]) =>
  w(`insert into repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 values ((select id from maintenance_requests where request_no=${q(reqNo)}),${u(techMap[ra.tech] || ra.tech)},(select id from problem_categories where name=${q(ra.cat)}),${q(ra.root)},${q(ra.action)},${n(ra.hrs)},${q(ra.verify)}::verify_status,${u(byMap[ra.by] || ra.by)});`)
);
w("");

// ---- spare_part_usage (trigger ปิด -> ไม่สร้าง movement ซ้ำ) ----
w("-- spare_part_usage");
Object.entries(D.usage).forEach(([reqNo, list]) =>
  list.forEach((x) =>
    w(`insert into spare_part_usage(request_id,part_id,qty_used,unit_cost)
 select (select id from maintenance_requests where request_no=${q(reqNo)}),sp.id,${n(x.qty)},${n(x.unit)}
 from spare_parts sp where sp.code=${q(x.code)};`)
  )
);
w("");

// ---- stock_movements (จาก stockIn / stockOut log) ----
w("-- stock_movements (historical log)");
D.stockIn.forEach((s) =>
  w(`insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'IN',${n(s.qty)},${ts(s.date)},${q(s.doc)} from spare_parts where code=${q(s.code)};`)
);
D.stockOut.forEach((s) =>
  w(`insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'OUT',${n(s.qty)},${ts(s.date)},${q(s.reason || s.doc)} from spare_parts where code=${q(s.code)};`)
);
w("");

// ---- pm_schedules ----
w("-- pm_schedules");
D.pm.forEach((p) =>
  w(`insert into pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 select id,${q(p.checklist)},${q(p.freq)}::pm_frequency,${d(p.last)},${d(p.next)},${p.status === "Completed"} from machines where code=${q(p.mc)};`)
);
w("");

w("-- เปิด trigger กลับ");
w("alter table maintenance_requests enable trigger trg_notify_request;");
w("alter table maintenance_requests enable trigger trg_request_no;");
w("alter table spare_part_usage     enable trigger trg_apply_usage;");
w("alter table stock_movements      enable trigger trg_recalc_stock;");
w("alter table spare_parts          enable trigger trg_notify_low_stock;");
w("commit;");

process.stdout.write(out.join("\n") + "\n");
