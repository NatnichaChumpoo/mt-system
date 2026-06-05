/* gen_seed_mysql.mjs — สร้าง seed_mysql.sql จาก data.js (MySQL syntax)
   รัน: node mysql/gen_seed_mysql.mjs > mysql/seed_mysql.sql */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
global.window = {};
require(path.join(__dirname, "..", "data.js"));
const D = global.window.DATA;

const q = (v) => (v === null || v === undefined || v === "" ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
const n = (v) => (v === null || v === undefined || v === "" ? "null" : Number(v));
const ts = (v) => (v ? "'" + v + "'" : "null");
const d = (v) => (v ? "'" + v + "'" : "null");
const b = (v) => (v ? 1 : 0);
const roleMap = { Operator:"operator", Technician:"technician", Supervisor:"supervisor", "Store Keeper":"store", Manager:"manager", Admin:"admin" };
const statusMap = { Completed:"Completed", "In Progress":"In Progress", Waiting:"Waiting", New:"New" };
const u = (name) => (name ? `(select id from (select id,full_name from app_users) au where au.full_name=${q(name)} limit 1)` : "null");

const out = []; const w = (s) => out.push(s);
w("-- seed_mysql.sql — generated from data.js (ข้อมูลสมมุติ)");
w("-- รันหลัง schema_mysql.sql");
w("SET NAMES utf8mb4;");
w("SET @mt_seed = 1;  -- ปิด trigger ระหว่าง seed");
w("");

const groups = [...new Set([...D.machines.map(m=>m.group), ...D.parts.map(p=>p.group), "Vacuum","CNC"])];
w("-- mc_groups");
groups.forEach(g => w(`INSERT INTO mc_groups(code,name) VALUES (${q(g.toUpperCase().slice(0,8))},${q(g)});`));
w("");

const depts = [...new Set([...D.machines.map(m=>m.dept), ...D.users.map(x=>x.dept)])];
w("-- departments");
depts.forEach(x => w(`INSERT INTO departments(name) VALUES (${q(x)});`));
w("");

w("-- problem_categories");
["Electrical","Mechanical","Hydraulic","Pneumatic","Other"].forEach(c => w(`INSERT INTO problem_categories(name) VALUES (${q(c)});`));
w("");

const sups = [...new Set(Object.values(D.usage).flat().map(x=>x.supplier))];
w("-- suppliers");
sups.forEach(s => w(`INSERT INTO suppliers(name,lead_time_days) VALUES (${q(s)},7);`));
w("");

w("-- app_users");
D.users.forEach(x => w(`INSERT INTO app_users(full_name,role,email,is_active) VALUES (${q(x.name)},${q(roleMap[x.role])},${q(x.user+"@car.local")},${b(x.status==="Active")});`));
w("");

w("-- machines");
D.machines.forEach(m => w(`INSERT INTO machines(code,name,mc_group_id,\`rank\`,criticality,department_id,location,maker,model,install_date,status)
 VALUES (${q(m.code)},${q(m.name)},(SELECT id FROM mc_groups WHERE name=${q(m.group)}),${q(m.rank)},${q(m.crit)},(SELECT id FROM departments WHERE name=${q(m.dept)}),${q(m.zone)},${q(m.maker)},${q(m.model)},${d(m.install)},${q(m.status)});`));
w("");

w("-- spare_parts (current_stock = cur ตรง ๆ)");
D.parts.forEach(p => w(`INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES (${q(p.code)},${q(p.name)},(SELECT id FROM mc_groups WHERE name=${q(p.group)}),${n(p.min)},${n(p.max)},${n(p.safety)},${n(p.rop)},${n(p.cur)},${n(p.score)},${n(p.price)});`));
w("");

w("-- maintenance_requests");
D.requests.forEach(r => w(`INSERT INTO maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 VALUES (${q(r.no)},(SELECT id FROM machines WHERE code=${q(r.mc)}),${q(r.problem)},${q(r.priority)},${u(r.reporter)},(SELECT id FROM departments WHERE name=${q(r.dept)}),${q(statusMap[r.status]||"New")},${ts(r.start)},${ts(r.finish)});`));
w("");
w("-- ตั้ง counter ให้ต่อจากเลขที่ seed ไว้");
const yrs = [...new Set(D.requests.map(r=>(r.no.match(/REQ-(\d{4})/)||[])[1]).filter(Boolean))];
yrs.forEach(y => {
  const cnt = D.requests.filter(r=>r.no.startsWith("REQ-"+y)).length;
  w(`INSERT INTO seq_counters(cname,val) VALUES (${q("REQ-"+y)},${cnt}) ON DUPLICATE KEY UPDATE val=${cnt};`);
});
w("");

const techMap = { "Technician A (Somsak)":"Somsak R.", "Technician B (Nattawut)":"Nattawut P." };
const byMap = { "MGR-Prasert":"Prasert W." };
w("-- repair_actions");
Object.entries(D.repairs).forEach(([reqNo, ra]) => w(`INSERT INTO repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 VALUES ((SELECT id FROM maintenance_requests WHERE request_no=${q(reqNo)}),${u(techMap[ra.tech]||ra.tech)},(SELECT id FROM problem_categories WHERE name=${q(ra.cat)}),${q(ra.root)},${q(ra.action)},${n(ra.hrs)},${q(ra.verify)},${u(byMap[ra.by]||ra.by)});`));
w("");

w("-- spare_part_usage (trigger ปิด -> ไม่สร้าง movement ซ้ำ)");
Object.entries(D.usage).forEach(([reqNo, list]) => list.forEach(x => w(`INSERT INTO spare_part_usage(request_id,part_id,qty_used,unit_cost)
 SELECT (SELECT id FROM maintenance_requests WHERE request_no=${q(reqNo)}), sp.id, ${n(x.qty)}, ${n(x.unit)}
 FROM spare_parts sp WHERE sp.code=${q(x.code)};`)));
w("");

w("-- stock_movements (historical log)");
D.stockIn.forEach(s => w(`INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'IN',${n(s.qty)},${ts(s.date)},${q(s.doc)} FROM spare_parts WHERE code=${q(s.code)};`));
D.stockOut.forEach(s => w(`INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'OUT',${n(s.qty)},${ts(s.date)},${q(s.reason||s.doc)} FROM spare_parts WHERE code=${q(s.code)};`));
w("");

w("-- pm_schedules");
D.pm.forEach(p => w(`INSERT INTO pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 SELECT id,${q(p.checklist)},${q(p.freq)},${d(p.last)},${d(p.next)},${b(p.status==="Completed")} FROM machines WHERE code=${q(p.mc)};`));
w("");

w("SET @mt_seed = NULL;  -- เปิด trigger กลับ");
process.stdout.write(out.join("\n") + "\n");
