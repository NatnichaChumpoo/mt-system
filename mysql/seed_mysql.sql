-- seed_mysql.sql — generated from data.js (ข้อมูลสมมุติ)
-- รันหลัง schema_mysql.sql
SET NAMES utf8mb4;
SET @mt_seed = 1;  -- ปิด trigger ระหว่าง seed

-- mc_groups
INSERT INTO mc_groups(code,name) VALUES ('COMPRESS','Compression');
INSERT INTO mc_groups(code,name) VALUES ('INJECTIO','Injection');
INSERT INTO mc_groups(code,name) VALUES ('MACHININ','Machining');
INSERT INTO mc_groups(code,name) VALUES ('FORMING','Forming');
INSERT INTO mc_groups(code,name) VALUES ('UTILITY','Utility');
INSERT INTO mc_groups(code,name) VALUES ('VACUUM','Vacuum');
INSERT INTO mc_groups(code,name) VALUES ('CNC','CNC');

-- departments
INSERT INTO departments(name) VALUES ('Production Line 1');
INSERT INTO departments(name) VALUES ('Production Line 2');
INSERT INTO departments(name) VALUES ('Maintenance Workshop');
INSERT INTO departments(name) VALUES ('Forming Line');
INSERT INTO departments(name) VALUES ('Maintenance');
INSERT INTO departments(name) VALUES ('Warehouse');
INSERT INTO departments(name) VALUES ('Plant Management');
INSERT INTO departments(name) VALUES ('IT / System');

-- problem_categories
INSERT INTO problem_categories(name) VALUES ('Electrical');
INSERT INTO problem_categories(name) VALUES ('Mechanical');
INSERT INTO problem_categories(name) VALUES ('Hydraulic');
INSERT INTO problem_categories(name) VALUES ('Pneumatic');
INSERT INTO problem_categories(name) VALUES ('Other');

-- suppliers
INSERT INTO suppliers(name,lead_time_days) VALUES ('Industrial Supply Co.',7);
INSERT INTO suppliers(name,lead_time_days) VALUES ('Fluid Components Ltd.',7);
INSERT INTO suppliers(name,lead_time_days) VALUES ('Home Pro Depot',7);

-- app_users
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Somchai K.','operator','somchai@car.local',1);
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Wichai S.','operator','wichai@car.local',1);
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Somsak R.','technician','somsak@car.local',1);
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Nattawut P.','technician','nattawut@car.local',1);
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Prasert W.','supervisor','prasert@car.local',1);
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Wanida T.','store','wanida@car.local',1);
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Direk M.','manager','direk@car.local',1);
INSERT INTO app_users(full_name,role,email,is_active) VALUES ('Admin','admin','admin@car.local',1);

-- machines
INSERT INTO machines(code,name,mc_group_id,`rank`,criticality,department_id,location,maker,model,install_date,status)
 VALUES ('MC-001','Compression Machine A1',(SELECT id FROM mc_groups WHERE name='Compression'),'A','HIGH',(SELECT id FROM departments WHERE name='Production Line 1'),'Zone A','Maker Corp','MX-200','2022-01-15','Running');
INSERT INTO machines(code,name,mc_group_id,`rank`,criticality,department_id,location,maker,model,install_date,status)
 VALUES ('MC-002','Compression Machine A2',(SELECT id FROM mc_groups WHERE name='Compression'),'A','HIGH',(SELECT id FROM departments WHERE name='Production Line 1'),'Zone A','Maker Corp','MX-200','2022-01-15','Running');
INSERT INTO machines(code,name,mc_group_id,`rank`,criticality,department_id,location,maker,model,install_date,status)
 VALUES ('MC-003','Injection Molding B1',(SELECT id FROM mc_groups WHERE name='Injection'),'B','MEDIUM',(SELECT id FROM departments WHERE name='Production Line 2'),'Zone B','Nissei','NJ-500','2023-05-20','Running');
INSERT INTO machines(code,name,mc_group_id,`rank`,criticality,department_id,location,maker,model,install_date,status)
 VALUES ('MC-004','Injection Molding B2',(SELECT id FROM mc_groups WHERE name='Injection'),'B','MEDIUM',(SELECT id FROM departments WHERE name='Production Line 2'),'Zone B','Nissei','NJ-500','2023-05-22','Stop');
INSERT INTO machines(code,name,mc_group_id,`rank`,criticality,department_id,location,maker,model,install_date,status)
 VALUES ('MC-005','CNC Milling C1',(SELECT id FROM mc_groups WHERE name='Machining'),'C','LOW',(SELECT id FROM departments WHERE name='Maintenance Workshop'),'Zone C','Fanuc','Robodrill','2024-11-02','Running');
INSERT INTO machines(code,name,mc_group_id,`rank`,criticality,department_id,location,maker,model,install_date,status)
 VALUES ('C16','เครื่องอัด 200 Ton',(SELECT id FROM mc_groups WHERE name='Forming'),'B','MEDIUM',(SELECT id FROM departments WHERE name='Forming Line'),'Zone D','TECO','200T-Vacuum','2021-03-10','Running');
INSERT INTO machines(code,name,mc_group_id,`rank`,criticality,department_id,location,maker,model,install_date,status)
 VALUES ('EX-01','Extruder 01',(SELECT id FROM mc_groups WHERE name='Forming'),'B','MEDIUM',(SELECT id FROM departments WHERE name='Forming Line'),'Zone D','Battenfeld','EX-90','2022-08-01','Running');

-- spare_parts (current_stock = cur ตรง ๆ)
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-01','Hydraulic pump',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-02','Filter',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-03','Oil Mirror',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-04','Solenoid Valve releasing cylinder upper',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-05','Solenoid Valve Main Cylinder',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,1,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-06','Solenoid Valve Mold Move in Cylinder',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,1,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-07','Counterbalance Valve',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-08','Counterbalance Valve',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-09','Proportion Pressure & Flow Compound Valve',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,31000);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-22','Temperature Controller',(SELECT id FROM mc_groups WHERE name='Forming'),3,5,2,5,7,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-23','Magnetic Contactor Motor pump',(SELECT id FROM mc_groups WHERE name='Forming'),2,4,1,3,2,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-25','Overload Motor pump Hyd',(SELECT id FROM mc_groups WHERE name='Forming'),3,5,2,5,6,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-26','Overload Motor Vacuum',(SELECT id FROM mc_groups WHERE name='Forming'),2,4,1,3,2,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-27','Relay',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,9,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-28','PLC Controller',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,9,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-30','PLC Controller',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,9,28000);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-33','Touch Screen',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-34','Heater (Top Plate)',(SELECT id FROM mc_groups WHERE name='Forming'),2,3,1,3,0,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-35','Heater (Top/Lower Plate)',(SELECT id FROM mc_groups WHERE name='Forming'),2,4,1,3,1,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-36','Heater (Top/Lower Plate)',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,1,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-37','Heater (Top Plate)',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,5,6,0);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-38','Insulating plate top 560x630 S400HT',(SELECT id FROM mc_groups WHERE name='Forming'),1,2,1,2,0,6,12271);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-39','Socket Head Screw M16x75',(SELECT id FROM mc_groups WHERE name='Forming'),12,20,6,18,0,6,36.85);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-40','Proximity Sensor',(SELECT id FROM mc_groups WHERE name='Injection'),2,4,1,3,3,6,1850);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-41','Servo Motor Drive',(SELECT id FROM mc_groups WHERE name='Injection'),1,2,1,2,1,9,42000);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-42','Conveyor Belt Motor',(SELECT id FROM mc_groups WHERE name='Injection'),2,3,1,3,4,6,8600);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-43','Thermocouple Type-K',(SELECT id FROM mc_groups WHERE name='Injection'),5,10,3,8,12,3,420);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-44','Limit Switch Safety Gate',(SELECT id FROM mc_groups WHERE name='Injection'),3,6,2,5,2,6,560);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-50','Ball Bearing 6206',(SELECT id FROM mc_groups WHERE name='Machining'),6,12,4,10,15,3,180);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-51','Spindle Belt',(SELECT id FROM mc_groups WHERE name='Machining'),2,4,1,3,1,6,1200);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-52','Coolant Pump',(SELECT id FROM mc_groups WHERE name='Machining'),1,2,1,2,2,6,5400);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-60','Air Filter Regulator',(SELECT id FROM mc_groups WHERE name='Utility'),4,8,2,6,9,3,340);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-61','Pneumatic Cylinder',(SELECT id FROM mc_groups WHERE name='Utility'),3,6,2,5,7,3,2100);
INSERT INTO spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 VALUES ('PT-65','Belt',(SELECT id FROM mc_groups WHERE name='Utility'),2,4,1,3,2,3,9000);

-- maintenance_requests
INSERT INTO maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 VALUES ('REQ-2026-001',(SELECT id FROM machines WHERE code='MC-001'),'Heater element broken, temperature dropped','High',(select id from (select id,full_name from app_users) au where au.full_name='Somchai K.' limit 1),(SELECT id FROM departments WHERE name='Production Line 1'),'Completed','2026-05-25 08:30','2026-05-25 10:45');
INSERT INTO maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 VALUES ('REQ-2026-002',(SELECT id FROM machines WHERE code='MC-004'),'Hydraulic oil leak from main cylinder','Critical',(select id from (select id,full_name from app_users) au where au.full_name='Wichai S.' limit 1),(SELECT id FROM departments WHERE name='Production Line 2'),'In Progress','2026-05-26 13:15',null);
INSERT INTO maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 VALUES ('REQ-2026-003',(SELECT id FROM machines WHERE code='MC-003'),'Conveyor motor makes abnormal noise','Medium',(select id from (select id,full_name from app_users) au where au.full_name='Anan P.' limit 1),(SELECT id FROM departments WHERE name='Production Line 2'),'Waiting','2026-05-27 10:00',null);
INSERT INTO maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 VALUES ('REQ-2026-004',(SELECT id FROM machines WHERE code='MC-002'),'Limit switch malfunction at safety gate','Low',(select id from (select id,full_name from app_users) au where au.full_name='Somchai K.' limit 1),(SELECT id FROM departments WHERE name='Production Line 1'),'Completed','2026-05-28 06:45','2026-05-28 07:15');
INSERT INTO maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 VALUES ('REQ-2026-005',(SELECT id FROM machines WHERE code='C16'),'Vacuum pump pressure unstable, ปั๊มสุญญากาศแรงดันตก','High',(select id from (select id,full_name from app_users) au where au.full_name='Prasit T.' limit 1),(SELECT id FROM departments WHERE name='Forming Line'),'Waiting','2026-05-29 14:20',null);

-- ตั้ง counter ให้ต่อจากเลขที่ seed ไว้
INSERT INTO seq_counters(cname,val) VALUES ('REQ-2026',5) ON DUPLICATE KEY UPDATE val=5;

-- repair_actions
INSERT INTO repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 VALUES ((SELECT id FROM maintenance_requests WHERE request_no='REQ-2026-001'),(select id from (select id,full_name from app_users) au where au.full_name='Somsak R.' limit 1),(SELECT id FROM problem_categories WHERE name='Electrical'),'Heater coil accumulated corrosion and burnt out','Replaced with new heater element and tested current load',2.25,'Approved',(select id from (select id,full_name from app_users) au where au.full_name='Prasert W.' limit 1));
INSERT INTO repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 VALUES ((SELECT id FROM maintenance_requests WHERE request_no='REQ-2026-002'),(select id from (select id,full_name from app_users) au where au.full_name='Nattawut P.' limit 1),(SELECT id FROM problem_categories WHERE name='Mechanical'),'O-ring seal degraded causing pressure drop','Under Repair — dismantling the hydraulic cylinder block',0,'Pending',null);
INSERT INTO repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 VALUES ((SELECT id FROM maintenance_requests WHERE request_no='REQ-2026-004'),(select id from (select id,full_name from app_users) au where au.full_name='Somsak R.' limit 1),(SELECT id FROM problem_categories WHERE name='Electrical'),'Dust accumulation caused loose contact on limit switch','Cleaned contacts and adjusted alignment of the safety gate actuator',0.5,'Approved',(select id from (select id,full_name from app_users) au where au.full_name='Prasert W.' limit 1));

-- spare_part_usage (trigger ปิด -> ไม่สร้าง movement ซ้ำ)
INSERT INTO spare_part_usage(request_id,part_id,qty_used,unit_cost)
 SELECT (SELECT id FROM maintenance_requests WHERE request_no='REQ-2026-001'), sp.id, 1, 1500
 FROM spare_parts sp WHERE sp.code='SP-H012';
INSERT INTO spare_part_usage(request_id,part_id,qty_used,unit_cost)
 SELECT (SELECT id FROM maintenance_requests WHERE request_no='REQ-2026-002'), sp.id, 2, 450
 FROM spare_parts sp WHERE sp.code='SP-O881';
INSERT INTO spare_part_usage(request_id,part_id,qty_used,unit_cost)
 SELECT (SELECT id FROM maintenance_requests WHERE request_no='REQ-2026-004'), sp.id, 1, 180
 FROM spare_parts sp WHERE sp.code='SP-E004';

-- stock_movements (historical log)
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'IN',6,'2026-05-29','PO-2026-014' FROM spare_parts WHERE code='PT-43';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'IN',4,'2026-05-22','PO-2026-013' FROM spare_parts WHERE code='PT-22';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'IN',3,'2026-05-18','PO-2026-012' FROM spare_parts WHERE code='PT-37';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'IN',4,'2026-05-12','PO-2026-011' FROM spare_parts WHERE code='PT-25';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'IN',15,'2026-05-01','INIT-001' FROM spare_parts WHERE code='PT-50';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'IN',9,'2026-05-01','INIT-001' FROM spare_parts WHERE code='PT-60';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'OUT',1,'2026-05-28','ใช้ในการซ่อม REQ-2026-004' FROM spare_parts WHERE code='SP-E004';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'OUT',2,'2026-05-26','ใช้ในการซ่อม REQ-2026-002' FROM spare_parts WHERE code='SP-O881';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'OUT',1,'2026-05-25','ใช้ในการซ่อม REQ-2026-001' FROM spare_parts WHERE code='SP-H012';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'OUT',2,'2026-05-12','อะไหล่เสื่อมสภาพตามรอบ (PM)' FROM spare_parts WHERE code='PT-01';
INSERT INTO stock_movements(part_id,type,qty,moved_at,note)
 SELECT id,'OUT',2,'2026-05-12','อะไหล่เสื่อมสภาพตามรอบ (PM)' FROM spare_parts WHERE code='PT-04';

-- pm_schedules
INSERT INTO pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 SELECT id,'Check heater wiring & insulation resistance','Monthly','2026-05-10','2026-06-10',1 FROM machines WHERE code='MC-001';
INSERT INTO pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 SELECT id,'Check heater wiring & insulation resistance','Monthly','2026-05-10','2026-06-10',1 FROM machines WHERE code='MC-002';
INSERT INTO pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 SELECT id,'Lubricate main conveyor bearings & chains','Weekly','2026-05-24','2026-05-31',1 FROM machines WHERE code='MC-003';
INSERT INTO pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 SELECT id,'Hydraulic oil filter cleaning & quality check','Quarterly','2026-02-15','2026-05-15',0 FROM machines WHERE code='MC-004';
INSERT INTO pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 SELECT id,'Spindle runout alignment calibration check','Yearly','2025-11-01','2026-11-01',0 FROM machines WHERE code='MC-005';
INSERT INTO pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 SELECT id,'Vacuum pump oil & seal inspection','Monthly','2026-04-28','2026-05-28',0 FROM machines WHERE code='C16';

SET @mt_seed = NULL;  -- เปิด trigger กลับ
