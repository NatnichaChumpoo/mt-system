-- ============================================================
-- seed.sql  — generated from data.js (ข้อมูลสมมุติ)
-- รันหลัง schema.sql ใน Supabase SQL Editor
-- ============================================================
begin;
-- ปิด trigger ระหว่าง seed เพื่อคุมค่าให้ตรง data.js
alter table maintenance_requests disable trigger trg_notify_request;
alter table maintenance_requests disable trigger trg_request_no;
alter table spare_part_usage     disable trigger trg_apply_usage;
alter table stock_movements      disable trigger trg_recalc_stock;
alter table spare_parts          disable trigger trg_notify_low_stock;

-- mc_groups
insert into mc_groups(code,name) values ('COMPRESS','Compression');
insert into mc_groups(code,name) values ('INJECTIO','Injection');
insert into mc_groups(code,name) values ('MACHININ','Machining');
insert into mc_groups(code,name) values ('FORMING','Forming');
insert into mc_groups(code,name) values ('UTILITY','Utility');
insert into mc_groups(code,name) values ('VACUUM','Vacuum');
insert into mc_groups(code,name) values ('CNC','CNC');

-- departments
insert into departments(name) values ('Production Line 1');
insert into departments(name) values ('Production Line 2');
insert into departments(name) values ('Maintenance Workshop');
insert into departments(name) values ('Forming Line');
insert into departments(name) values ('Maintenance');
insert into departments(name) values ('Warehouse');
insert into departments(name) values ('Plant Management');
insert into departments(name) values ('IT / System');

-- problem_categories
insert into problem_categories(name) values ('Electrical');
insert into problem_categories(name) values ('Mechanical');
insert into problem_categories(name) values ('Hydraulic');
insert into problem_categories(name) values ('Pneumatic');
insert into problem_categories(name) values ('Other');

-- suppliers
insert into suppliers(name,lead_time_days) values ('Industrial Supply Co.',7);
insert into suppliers(name,lead_time_days) values ('Fluid Components Ltd.',7);
insert into suppliers(name,lead_time_days) values ('Home Pro Depot',7);

-- app_users
insert into app_users(full_name,role,email,is_active) values ('Somchai K.','operator'::user_role,'somchai@car.local',true);
insert into app_users(full_name,role,email,is_active) values ('Wichai S.','operator'::user_role,'wichai@car.local',true);
insert into app_users(full_name,role,email,is_active) values ('Somsak R.','technician'::user_role,'somsak@car.local',true);
insert into app_users(full_name,role,email,is_active) values ('Nattawut P.','technician'::user_role,'nattawut@car.local',true);
insert into app_users(full_name,role,email,is_active) values ('Prasert W.','supervisor'::user_role,'prasert@car.local',true);
insert into app_users(full_name,role,email,is_active) values ('Wanida T.','store'::user_role,'wanida@car.local',true);
insert into app_users(full_name,role,email,is_active) values ('Direk M.','manager'::user_role,'direk@car.local',true);
insert into app_users(full_name,role,email,is_active) values ('Admin','admin'::user_role,'admin@car.local',true);

-- machines
insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values ('MC-001','Compression Machine A1',(select id from mc_groups where name='Compression'),'A'::machine_rank,'HIGH'::criticality_level,(select id from departments where name='Production Line 1'),'Zone A','Maker Corp','MX-200','2022-01-15'::date,'Running'::machine_status);
insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values ('MC-002','Compression Machine A2',(select id from mc_groups where name='Compression'),'A'::machine_rank,'HIGH'::criticality_level,(select id from departments where name='Production Line 1'),'Zone A','Maker Corp','MX-200','2022-01-15'::date,'Running'::machine_status);
insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values ('MC-003','Injection Molding B1',(select id from mc_groups where name='Injection'),'B'::machine_rank,'MEDIUM'::criticality_level,(select id from departments where name='Production Line 2'),'Zone B','Nissei','NJ-500','2023-05-20'::date,'Running'::machine_status);
insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values ('MC-004','Injection Molding B2',(select id from mc_groups where name='Injection'),'B'::machine_rank,'MEDIUM'::criticality_level,(select id from departments where name='Production Line 2'),'Zone B','Nissei','NJ-500','2023-05-22'::date,'Stop'::machine_status);
insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values ('MC-005','CNC Milling C1',(select id from mc_groups where name='Machining'),'C'::machine_rank,'LOW'::criticality_level,(select id from departments where name='Maintenance Workshop'),'Zone C','Fanuc','Robodrill','2024-11-02'::date,'Running'::machine_status);
insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values ('C16','เครื่องอัด 200 Ton',(select id from mc_groups where name='Forming'),'B'::machine_rank,'MEDIUM'::criticality_level,(select id from departments where name='Forming Line'),'Zone D','TECO','200T-Vacuum','2021-03-10'::date,'Running'::machine_status);
insert into machines(code,name,mc_group_id,rank,criticality,department_id,location,maker,model,install_date,status)
 values ('EX-01','Extruder 01',(select id from mc_groups where name='Forming'),'B'::machine_rank,'MEDIUM'::criticality_level,(select id from departments where name='Forming Line'),'Zone D','Battenfeld','EX-90','2022-08-01'::date,'Running'::machine_status);

-- spare_parts
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-01','Hydraulic pump',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-02','Filter',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-03','Oil Mirror',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-04','Solenoid Valve releasing cylinder upper',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-05','Solenoid Valve Main Cylinder',(select id from mc_groups where name='Forming'),1,2,1,2,1,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-06','Solenoid Valve Mold Move in Cylinder',(select id from mc_groups where name='Forming'),1,2,1,2,1,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-07','Counterbalance Valve',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-08','Counterbalance Valve',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-09','Proportion Pressure & Flow Compound Valve',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,31000);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-22','Temperature Controller',(select id from mc_groups where name='Forming'),3,5,2,5,7,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-23','Magnetic Contactor Motor pump',(select id from mc_groups where name='Forming'),2,4,1,3,2,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-25','Overload Motor pump Hyd',(select id from mc_groups where name='Forming'),3,5,2,5,6,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-26','Overload Motor Vacuum',(select id from mc_groups where name='Forming'),2,4,1,3,2,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-27','Relay',(select id from mc_groups where name='Forming'),1,2,1,2,0,9,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-28','PLC Controller',(select id from mc_groups where name='Forming'),1,2,1,2,0,9,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-30','PLC Controller',(select id from mc_groups where name='Forming'),1,2,1,2,0,9,28000);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-33','Touch Screen',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-34','Heater (Top Plate)',(select id from mc_groups where name='Forming'),2,3,1,3,0,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-35','Heater (Top/Lower Plate)',(select id from mc_groups where name='Forming'),2,4,1,3,1,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-36','Heater (Top/Lower Plate)',(select id from mc_groups where name='Forming'),1,2,1,2,1,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-37','Heater (Top Plate)',(select id from mc_groups where name='Forming'),1,2,1,2,5,6,0);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-38','Insulating plate top 560x630 S400HT',(select id from mc_groups where name='Forming'),1,2,1,2,0,6,12271);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-39','Socket Head Screw M16x75',(select id from mc_groups where name='Forming'),12,20,6,18,0,6,36.85);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-40','Proximity Sensor',(select id from mc_groups where name='Injection'),2,4,1,3,3,6,1850);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-41','Servo Motor Drive',(select id from mc_groups where name='Injection'),1,2,1,2,1,9,42000);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-42','Conveyor Belt Motor',(select id from mc_groups where name='Injection'),2,3,1,3,4,6,8600);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-43','Thermocouple Type-K',(select id from mc_groups where name='Injection'),5,10,3,8,12,3,420);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-44','Limit Switch Safety Gate',(select id from mc_groups where name='Injection'),3,6,2,5,2,6,560);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-50','Ball Bearing 6206',(select id from mc_groups where name='Machining'),6,12,4,10,15,3,180);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-51','Spindle Belt',(select id from mc_groups where name='Machining'),2,4,1,3,1,6,1200);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-52','Coolant Pump',(select id from mc_groups where name='Machining'),1,2,1,2,2,6,5400);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-60','Air Filter Regulator',(select id from mc_groups where name='Utility'),4,8,2,6,9,3,340);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-61','Pneumatic Cylinder',(select id from mc_groups where name='Utility'),3,6,2,5,7,3,2100);
insert into spare_parts(code,name,mc_group_id,min_stock,max_stock,safety_stock,rop,current_stock,criticality_score,unit_cost)
 values ('PT-65','Belt',(select id from mc_groups where name='Utility'),2,4,1,3,2,3,9000);

-- maintenance_requests
insert into maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 values ('REQ-2026-001',(select id from machines where code='MC-001'),'Heater element broken, temperature dropped','High'::request_priority,(select id from app_users where full_name='Somchai K.' limit 1),(select id from departments where name='Production Line 1'),'Completed'::request_status,'2026-05-25 08:30'::timestamptz,'2026-05-25 10:45'::timestamptz);
insert into maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 values ('REQ-2026-002',(select id from machines where code='MC-004'),'Hydraulic oil leak from main cylinder','Critical'::request_priority,(select id from app_users where full_name='Wichai S.' limit 1),(select id from departments where name='Production Line 2'),'In Progress'::request_status,'2026-05-26 13:15'::timestamptz,null);
insert into maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 values ('REQ-2026-003',(select id from machines where code='MC-003'),'Conveyor motor makes abnormal noise','Medium'::request_priority,(select id from app_users where full_name='Anan P.' limit 1),(select id from departments where name='Production Line 2'),'Waiting'::request_status,'2026-05-27 10:00'::timestamptz,null);
insert into maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 values ('REQ-2026-004',(select id from machines where code='MC-002'),'Limit switch malfunction at safety gate','Low'::request_priority,(select id from app_users where full_name='Somchai K.' limit 1),(select id from departments where name='Production Line 1'),'Completed'::request_status,'2026-05-28 06:45'::timestamptz,'2026-05-28 07:15'::timestamptz);
insert into maintenance_requests(request_no,machine_id,problem_description,priority,reporter_id,department_id,status,breakdown_start,finish_repair)
 values ('REQ-2026-005',(select id from machines where code='C16'),'Vacuum pump pressure unstable, ปั๊มสุญญากาศแรงดันตก','High'::request_priority,(select id from app_users where full_name='Prasit T.' limit 1),(select id from departments where name='Forming Line'),'Waiting'::request_status,'2026-05-29 14:20'::timestamptz,null);

-- repair_actions
insert into repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 values ((select id from maintenance_requests where request_no='REQ-2026-001'),(select id from app_users where full_name='Somsak R.' limit 1),(select id from problem_categories where name='Electrical'),'Heater coil accumulated corrosion and burnt out','Replaced with new heater element and tested current load',2.25,'Approved'::verify_status,(select id from app_users where full_name='Prasert W.' limit 1));
insert into repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 values ((select id from maintenance_requests where request_no='REQ-2026-002'),(select id from app_users where full_name='Nattawut P.' limit 1),(select id from problem_categories where name='Mechanical'),'O-ring seal degraded causing pressure drop','Under Repair — dismantling the hydraulic cylinder block',0,'Pending'::verify_status,null);
insert into repair_actions(request_id,technician_id,problem_category_id,root_cause,corrective_action,repair_hours,verification_status,verified_by)
 values ((select id from maintenance_requests where request_no='REQ-2026-004'),(select id from app_users where full_name='Somsak R.' limit 1),(select id from problem_categories where name='Electrical'),'Dust accumulation caused loose contact on limit switch','Cleaned contacts and adjusted alignment of the safety gate actuator',0.5,'Approved'::verify_status,(select id from app_users where full_name='Prasert W.' limit 1));

-- spare_part_usage
insert into spare_part_usage(request_id,part_id,qty_used,unit_cost)
 select (select id from maintenance_requests where request_no='REQ-2026-001'),sp.id,1,1500
 from spare_parts sp where sp.code='SP-H012';
insert into spare_part_usage(request_id,part_id,qty_used,unit_cost)
 select (select id from maintenance_requests where request_no='REQ-2026-002'),sp.id,2,450
 from spare_parts sp where sp.code='SP-O881';
insert into spare_part_usage(request_id,part_id,qty_used,unit_cost)
 select (select id from maintenance_requests where request_no='REQ-2026-004'),sp.id,1,180
 from spare_parts sp where sp.code='SP-E004';

-- stock_movements (historical log)
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'IN',6,'2026-05-29'::timestamptz,'PO-2026-014' from spare_parts where code='PT-43';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'IN',4,'2026-05-22'::timestamptz,'PO-2026-013' from spare_parts where code='PT-22';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'IN',3,'2026-05-18'::timestamptz,'PO-2026-012' from spare_parts where code='PT-37';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'IN',4,'2026-05-12'::timestamptz,'PO-2026-011' from spare_parts where code='PT-25';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'IN',15,'2026-05-01'::timestamptz,'INIT-001' from spare_parts where code='PT-50';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'IN',9,'2026-05-01'::timestamptz,'INIT-001' from spare_parts where code='PT-60';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'OUT',1,'2026-05-28'::timestamptz,'ใช้ในการซ่อม REQ-2026-004' from spare_parts where code='SP-E004';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'OUT',2,'2026-05-26'::timestamptz,'ใช้ในการซ่อม REQ-2026-002' from spare_parts where code='SP-O881';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'OUT',1,'2026-05-25'::timestamptz,'ใช้ในการซ่อม REQ-2026-001' from spare_parts where code='SP-H012';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'OUT',2,'2026-05-12'::timestamptz,'อะไหล่เสื่อมสภาพตามรอบ (PM)' from spare_parts where code='PT-01';
insert into stock_movements(part_id,type,qty,moved_at,note)
 select id,'OUT',2,'2026-05-12'::timestamptz,'อะไหล่เสื่อมสภาพตามรอบ (PM)' from spare_parts where code='PT-04';

-- pm_schedules
insert into pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 select id,'Check heater wiring & insulation resistance','Monthly'::pm_frequency,'2026-05-10'::date,'2026-06-10'::date,true from machines where code='MC-001';
insert into pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 select id,'Check heater wiring & insulation resistance','Monthly'::pm_frequency,'2026-05-10'::date,'2026-06-10'::date,true from machines where code='MC-002';
insert into pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 select id,'Lubricate main conveyor bearings & chains','Weekly'::pm_frequency,'2026-05-24'::date,'2026-05-31'::date,true from machines where code='MC-003';
insert into pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 select id,'Hydraulic oil filter cleaning & quality check','Quarterly'::pm_frequency,'2026-02-15'::date,'2026-05-15'::date,false from machines where code='MC-004';
insert into pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 select id,'Spindle runout alignment calibration check','Yearly'::pm_frequency,'2025-11-01'::date,'2026-11-01'::date,false from machines where code='MC-005';
insert into pm_schedules(machine_id,checklist,frequency,last_pm_date,next_pm_date,completed)
 select id,'Vacuum pump oil & seal inspection','Monthly'::pm_frequency,'2026-04-28'::date,'2026-05-28'::date,false from machines where code='C16';

-- เปิด trigger กลับ
alter table maintenance_requests enable trigger trg_notify_request;
alter table maintenance_requests enable trigger trg_request_no;
alter table spare_part_usage     enable trigger trg_apply_usage;
alter table stock_movements      enable trigger trg_recalc_stock;
alter table spare_parts          enable trigger trg_notify_low_stock;
commit;
