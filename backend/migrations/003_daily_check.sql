-- Migration 003: Daily Machine Check System
-- ระบบเช็คความพร้อมเครื่องจักรประจำวัน

-- ─────────────────────────────────────────────────────────────
-- 1) เพิ่ม column ใน machines
-- ─────────────────────────────────────────────────────────────
ALTER TABLE machines
  ADD COLUMN line_group VARCHAR(5) DEFAULT NULL COMMENT 'A/B/C/D/TFC',
  ADD COLUMN check_template_type_id TINYINT DEFAULT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2) ตารางประเภท template
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS check_template_types (
  id   TINYINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 3) รายการตรวจต่อ template
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS check_template_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  template_type_id TINYINT NOT NULL,
  seq_label       VARCHAR(10) NOT NULL,
  item_desc       TEXT NOT NULL,
  standard_criteria VARCHAR(200),
  method          VARCHAR(100),
  sort_order      TINYINT NOT NULL,
  FOREIGN KEY (template_type_id) REFERENCES check_template_types(id)
);

-- ─────────────────────────────────────────────────────────────
-- 4) บันทึกการเช็ครายวัน (1 row ต่อเครื่องต่อวัน)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_check_records (
  id              CHAR(36)     PRIMARY KEY,
  machine_code    VARCHAR(32)  NOT NULL,
  check_date      DATE         NOT NULL,
  operator_name   VARCHAR(100),
  scanned_at      DATETIME,
  submitted_at    DATETIME,
  status          ENUM('pending','submitted','approved') DEFAULT 'pending',
  auto_request_id VARCHAR(36)  DEFAULT NULL COMMENT 'FK → maintenance_requests.id ถ้ามีปัญหา',
  UNIQUE KEY uq_machine_date (machine_code, check_date)
);

-- ─────────────────────────────────────────────────────────────
-- 5) ผลรายการตรวจ (1 row ต่อ item ต่อ record)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_check_results (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  record_id CHAR(36)    NOT NULL,
  item_id   INT         NOT NULL,
  result    ENUM('P','W','F','V') NOT NULL COMMENT 'P=ปกติ W=บกพร่อง(△) F=เสีย(×) V=แก้ไขแล้ว',
  ticked_at DATETIME,
  remarks   VARCHAR(500),
  FOREIGN KEY (record_id) REFERENCES daily_check_records(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)   REFERENCES check_template_items(id)
);

-- ─────────────────────────────────────────────────────────────
-- 6) บันทึกการอนุมัติรายวัน (batch per line per role)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_check_approvals (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  check_date    DATE        NOT NULL,
  line_group    VARCHAR(5)  NOT NULL,
  approver_role ENUM('PD Supervisor','MT Leader','PD Manager') NOT NULL,
  approver_name VARCHAR(100),
  approved_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes         VARCHAR(500),
  UNIQUE KEY uq_approval (check_date, line_group, approver_role)
);

-- ─────────────────────────────────────────────────────────────
-- 7) Seed: ประเภท template
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO check_template_types (id, name) VALUES
  (1, 'Vacuum Press'),
  (2, 'Non-Vacuum Press'),
  (3, 'C-Series Simplified'),
  (4, 'D-Modern DESMA'),
  (5, 'TFC01 - Degreasing'),
  (6, 'TFC02 - Shot Blasting'),
  (7, 'TFC03 - Adhesive Station'),
  (8, 'TFC04 - Paint Table');

-- ─────────────────────────────────────────────────────────────
-- 8) Seed: รายการตรวจต่อ template
-- ─────────────────────────────────────────────────────────────

-- Type 1: Vacuum Press (20 sub-items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(1,'1a','เช็คกระบอกสูบ Main ใหญ่','สะอาด','มือ, ตา',1),
(1,'1b','เช็ครอยรั่วกระบอกสูบ Main ใหญ่','ห้ามรั่ว','มือ, ตา',2),
(1,'2a','เช็คการรั่วกระบอกสไลด์','ห้ามรั่ว','มือ, ตา',3),
(1,'2b','เช็คการรั่วเกจวัดแรงดัน','ห้ามรั่ว','มือ, ตา',4),
(1,'2c','เช็คการรั่วน้ำมันข้อต่อสาย Hydraulic','ห้ามรั่ว','มือ, ตา',5),
(1,'3','เช็คระดับและเติมน้ำมันไฮดรอลิกที่ถังเก็บน้ำมัน','ห้ามต่ำกว่า Min','มือ, ตา',6),
(1,'4','เช็คระดับน้ำมัน Vacuum ที่ถังเก็บน้ำมัน','ห้ามต่ำกว่า Min','มือ, ตา',7),
(1,'5','เช็คระดับแรงดันน้ำมัน Hydraulic','0 - 5000 psi','มือ, ตา',8),
(1,'6','เช็คการรั่วของ WATER COOLER ตามจุดต่อ','ห้ามรั่ว','มือ, ตา',9),
(1,'7a','7.1 วาวล์เปิดน้ำเข้าของ WATER COOLER','วาล์วเปิด','มือ, ตา',10),
(1,'7b','7.2 วาวล์เปิดน้ำกลับของ WATER COOLER','วาล์วเปิด','มือ, ตา',11),
(1,'8','หลอดไฟโชว์, สายไฟฟ้า, SW ต่างๆ ตู้ MAIN','ปกติ','มือ, ตา',12),
(1,'9','หลอดไฟโชว์, สายไฟฟ้า, SW ต่างๆ','ปกติ','มือ, ตา',13),
(1,'10','เช็คซีลฝา Vacuum','ไม่ขาด-แตก','มือ, ตา',14),
(1,'11','เช็คการทำงานของพัดลมระบายอากาศและฟิวเตอร์','ใช้งานได้','มือ, ตา',15),
(1,'12','เช็คปีกยก MOLD แผ่นบน/กลาง','ห้ามหลวม','มือ, ตา',16),
(1,'13','ตรวจเช็คน็อตยึดเสา น็อตกระบอกเมน','น็อตไม่หลวม ไม่คลาย','ทดสอบการอัด/มือหมุนน็อต',17),
(1,'14','เช็คแรงดัน Vacuum ที่เกจวัดแรงดัน','40 - 75 Cmhg','จดบันทึก',18),
(1,'15a','15.1 ตรวจเช็คน็อตยึด Heater Plate บน 4 จุด','น็อตไม่หลวม ไม่คลาย','มือหมุนน็อต',19),
(1,'15b','15.2 ตรวจเช็คน็อตยึด Heater Plate ล่าง 4 จุด','น็อตไม่หลวม ไม่คลาย','มือหมุนน็อต',20);

-- Type 2: Non-Vacuum Press (16 rows / 12 numbered items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(2,'1a','เช็คกระบอกสูบ Main ใหญ่','สะอาด','มือ, ตา',1),
(2,'1b','เช็ครอยรั่วกระบอกสูบ Main ใหญ่','ห้ามรั่ว','มือ, ตา',2),
(2,'2a','เช็คการรั่วกระบอกสไลด์','ห้ามรั่ว','มือ, ตา',3),
(2,'2b','เช็คการรั่วเกจวัดแรงดัน','ห้ามรั่ว','มือ, ตา',4),
(2,'2c','เช็คการรั่วน้ำมันข้อต่อสาย Hydraulic','ห้ามรั่ว','มือ, ตา',5),
(2,'3','เช็คระดับและเติมน้ำมันไฮดรอลิกที่ถังเก็บน้ำมัน','ห้ามต่ำกว่า Min','มือ, ตา',6),
(2,'4','เช็คแขนดัน Mold แผ่นบน/กลาง','ห้ามหลวม','มือ, ตา',7),
(2,'5','เช็คระดับแรงดันน้ำมัน Hydraulic','0 - 5000 psi','มือ, ตา',8),
(2,'6','เช็คการรั่วของ WATER COOLER ตามจุดต่อ','ห้ามรั่ว','มือ, ตา',9),
(2,'7a','7.1 วาวล์เปิดน้ำเข้าของ WATER COOLER','วาล์วเปิด','มือ, ตา',10),
(2,'7b','7.2 วาวล์เปิดน้ำกลับของ WATER COOLER','วาล์วเปิด','มือ, ตา',11),
(2,'8','หลอดไฟโชว์, สายไฟฟ้า, SW ต่างๆ ตู้ MAIN','ปกติ','มือ, ตา',12),
(2,'9','หลอดไฟโชว์, สายไฟฟ้า, SW ต่างๆ','ปกติ','มือ, ตา',13),
(2,'10','น็อตยึด HEATING PLATE','ขันให้แน่น','มือ, ตา',14),
(2,'11','เช็คการทำงานของพัดลมระบายอากาศและฟิวเตอร์','ใช้งานได้','มือ, ตา',15),
(2,'12','ตรวจเช็คน็อตยึดเสา น็อตกระบอกเมน','น็อตไม่หลวม ไม่คลาย','ทดสอบการอัด/มือหมุนน็อต',16);

-- Type 3: C-Series Simplified (8 items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(3,'1','เช็ค Switch ฉุกเฉินของเครื่องจักร','ใช้งานได้','มือ, ตา',1),
(3,'2','เช็คอุปกรณ์ไฟฟ้าและ Switch ส่วนต่างๆ','ใช้งานได้','มือ, ตา',2),
(3,'3','เช็คระดับน้ำมันไฮโดรลิค','Max - Min','มือ, ตา',3),
(3,'4','เช็คระบบหล่อเย็นของเครื่องจักร','30 - 100°C','ตา',4),
(3,'5','เช็คกระบอกสูบ Main ของเครื่องจักร','สะอาด','มือ, ตา',5),
(3,'6','เช็คปีกยกแผ่นบนของ Mold','ไม่หลวม','มือ, ตา',6),
(3,'7','เช็คการทำงานทั้งหมดของเครื่องจักร','ปกติ','ทดลองใช้',7),
(3,'8','เช็คการทำงานของพัดลมระบายอากาศและฟิวเตอร์','ใช้งานได้','มือ, ตา',8);

-- Type 4: D-Modern DESMA (13 rows / 11 numbered items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(4,'1a','เช็คกระบอกสูบ Main ใหญ่','สะอาด','มือ, ตา',1),
(4,'1b','1.2 เช็ครอยรั่วกระบอกสูบ Main ใหญ่','ห้ามรั่ว','มือ, ตา',2),
(4,'2','เช็คการรั่วน้ำมันข้อต่อสาย Hydraulic','ห้ามรั่ว','มือ, ตา',3),
(4,'3','เช็คระดับและเติมน้ำมันไฮดรอลิกที่ถังเก็บน้ำมัน','ห้ามต่ำกว่า Min','มือ, ตา',4),
(4,'4','เช็คระดับแรงดัน Hydraulic','0 - 5000 psi','มือ, ตา',5),
(4,'5','เช็คการรั่วของ WATER COOLER ตามจุดต่อ','ห้ามรั่ว','มือ, ตา',6),
(4,'6','หลอดไฟโชว์สถานะการทำงานเครื่อง','ปกติ','มือ, ตา',7),
(4,'7','เกจวัดระดับลม','3 - 5 bar','มือ, ตา',8),
(4,'8','เช็คระดับน้ำมัน COLD RUNNER','หลอดไฟโชว์','มือ, ตา',9),
(4,'9a','9.1 เช็คสวิทช์ต่างๆ บนหน้าจอ','ไม่แตกชำรุด','มือ, ตา',10),
(4,'9b','9.2 เช็คหน้าจอทัชสกรีน','ไม่แตกชำรุด','มือ, ตา',11),
(4,'10','เช็คเซนเซอร์เซฟตี้หน้าเครื่อง','ทดสอบการทำงาน','มือ, ตา',12),
(4,'11','ตรวจเช็คน็อตยึดเสา น็อตกระบอกเมน','น็อตไม่หลวม ไม่คลาย','ทดสอบการอัด/มือหมุนน็อต',13);

-- Type 5: TFC01 - Degreasing (9 items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(5,'1','ตรวจเช็คโครงสร้างเครื่องจักร','ไม่ชำรุด ไม่เป็นสนิม','ตา',1),
(5,'2','ตรวจเช็คสวิตช์ควบคุมและสวิตช์ฉุกเฉิน','ทำงานปกติ ไม่ชำรุด','ตา, มือ, ทดสอบ',2),
(5,'3','ตรวจเช็คโครงสร้างมอเตอร์ปั้มน้ำและท่อน้ำ','ไม่ชำรุด ไม่มีน้ำรั่ว','มือ, ตา',3),
(5,'4','ตรวจเช็คระบบทำความร้อน','ทำความร้อนได้ปกติ','ตา, ทดสอบ',4),
(5,'5','ตรวจเช็คชุดมอเตอร์ปั้มน้ำ','ทำงานปกติ ไม่มีเสียงดัง','ตา, หู, ทดสอบ',5),
(5,'6','ตรวจเช็คชุดไทม์เมอร์','นับเวลาปกติ','ตา, ทดสอบ',6),
(5,'7','ตรวจเช็คระบบลม','สายลมไม่แตก ไม่มีลมรั่ว','หู, ทดสอบ',7),
(5,'8','ตรวจเช็คโครงสร้างเครน','ไม่ชำรุด เสาไม่เอียง','ตา',8),
(5,'9','ตรวจเช็คการทำงานของเครน','ทำงานปกติ ไม่มีเสียงดัง','ตา, หู, ทดสอบ',9);

-- Type 6: TFC02 - Shot Blasting (11 items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(6,'1','ตรวจเช็คโครงสร้างเครื่องจักร','ไม่ชำรุด ไม่เป็นสนิม','ตา',1),
(6,'2','ตรวจเช็คสวิตช์ควบคุมและสวิตช์ฉุกเฉิน','ทำงานปกติ ไม่ชำรุด','ตา, มือ, ทดสอบ',2),
(6,'3','ตรวจเช็คชุดมอเตอร์ยิงทรายเหล็ก','ทำงานปกติ ไม่มีเสียงดัง','ตา, มือ, หู, ทดสอบ',3),
(6,'4','ตรวจเช็คชุดมอเตอร์หมุนถาดใส่ชิ้นงาน','ทำงานปกติ ไม่มีเสียงดัง','ตา, มือ, หู, ทดสอบ',4),
(6,'5','ตรวจเช็คชุดมอเตอร์ลำเลียงเม็ดทรายเหล็กขึ้น-ลง','ทำงานปกติ ไม่มีเสียงดัง','ตา, มือ, หู, ทดสอบ',5),
(6,'6','ตรวจเช็คชุดมอเตอร์ดูดฝุ่นเม็ดทรายเหล็ก','ทำงานปกติ ไม่มีเสียงดัง','ตา, มือ, หู, ทดสอบ',6),
(6,'7','ตรวจเช็คชุดไทม์เมอร์','นับเวลาปกติ','ตา, ทดสอบ',7),
(6,'8','ตรวจเช็คชุด Alarm สิ้นสุดการทำงาน','มีเสียงดังเตือนปกติ','ตา, หู, ทดสอบ',8),
(6,'9','ตรวจเช็คประตูเปิด-ปิดต่างๆ','เปิด-ปิดปกติ ไม่ฝืด','ตา, มือ, ทดสอบ',9),
(6,'10','ตรวจเช็คท่อต่างๆ','ไม่แตกชำรุด ไม่มีฝุ่นรั่ว','ตา, ทดสอบ',10),
(6,'11','ตรวจเช็คตะแกรง','ไม่อุดตัน ไม่ชำรุด','ตา',11);

-- Type 7: TFC03 - Adhesive Station (8 items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(7,'1','ตรวจเช็คโครงสร้างต่างๆ','ไม่ชำรุด ไม่เป็นสนิม','ตา',1),
(7,'2','ตรวจเช็คสวิตช์ควบคุมและสวิตช์ฉุกเฉิน','ทำงานปกติ ไม่ชำรุด','ตา, มือ, ทดสอบ',2),
(7,'3','ตรวจเช็คชุดมอเตอร์โบลเวอร์ดูดกลิ่น (ชุดที่ 1)','ทำงานปกติ ไม่มีเสียงดัง','ตา, มือ, หู, ทดสอบ',3),
(7,'4','ตรวจเช็คชุดมอเตอร์โบลเวอร์ดูดกลิ่น (ชุดที่ 2)','ทำงานปกติ ไม่มีเสียงดัง','ตา, มือ, หู, ทดสอบ',4),
(7,'5','ตรวจเช็คชุดมอเตอร์โบลเวอร์ดูดกลิ่น (ชุดที่ 3)','ทำงานปกติ ไม่มีเสียงดัง','ตา, มือ, หู, ทดสอบ',5),
(7,'6','ตรวจเช็คไฟส่องสว่างชุดโบลเวอร์','ส่องสว่างปกติ ไม่กระพริบ','ตา, มือ, ทดสอบ',6),
(7,'7','ตรวจเช็คชุดรางเลื่อน','เลื่อนปกติ ไม่ติดขัด','ตา, มือ, ทดสอบ',7),
(7,'8','ตรวจเช็คไฟส่องสว่างชุดทาสี','ส่องสว่างปกติ ไม่กระพริบ','ตา, มือ, ทดสอบ',8);

-- Type 8: TFC04 - Paint Table (7 items)
INSERT IGNORE INTO check_template_items (template_type_id,seq_label,item_desc,standard_criteria,method,sort_order) VALUES
(8,'1','ตรวจเช็คโครงสร้างต่างๆ','ไม่ชำรุด ไม่เป็นสนิม','ตา',1),
(8,'2','ตรวจเช็คไฟส่องสว่างชุดโบลเวอร์','ส่องสว่างปกติ ไม่กระพริบ','ตา, มือ, ทดสอบ',2),
(8,'3','ตรวจเช็คชุดรางเลื่อน','เลื่อนปกติ ไม่ติดขัด','ตา, มือ, ทดสอบ',3),
(8,'4','ตรวจเช็คไฟส่องสว่างชุดทาสี','ส่องสว่างปกติ ไม่กระพริบ','ตา, มือ, ทดสอบ',4),
(8,'5','ตรวจเช็คความสะอาดโต๊ะทาสี','ต้องสะอาด ไม่มีฝุ่น','ตา, มือ',5),
(8,'6','ตรวจเช็คถ้วยอุปกรณ์ มีป้ายชี้บ่ง','มีป้ายบ่งชี้ที่ชัดเจน','ตา, มือ',6),
(8,'7','ตรวจเช็คแปรงทาสีและพร้อมใช้งาน','ขนแปรงยาว 10 ซม.','ตา, มือ, ตลับเมตร',7);

-- ─────────────────────────────────────────────────────────────
-- 9) Seed: เครื่องจักรจริง 65 เครื่อง
-- ─────────────────────────────────────────────────────────────
-- mc_group: 1=Compression, 2=Injection, 4=Forming, 5=Utility, 6=Vacuum
-- dept:     1=Production Line 1, 2=Production Line 2, 5=Maintenance
-- template: 1=Vacuum, 2=NonVac, 3=CSimple, 4=DModern, 5-8=TFC

INSERT IGNORE INTO machines (id,code,name,mc_group_id,`rank`,criticality,department_id,status,line_group,check_template_type_id) VALUES
-- Line A (dept=1, Production Line 1)
(UUID(),'A01','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A02','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A03','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A04','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A05','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A06','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A07','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A08','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A09','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A10','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','A',2),
(UUID(),'A17','Hydraulic PRESS 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'A18','Hydraulic PRESS 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'A19','Hydraulic PRESS 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'A20','Hydraulic PRESS 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'D1','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'D2','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'D3','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'D4','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
(UUID(),'D5','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','A',1),
-- Line B (dept=1, Production Line 1)
(UUID(),'B01','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B02','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B03','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B04','Hydraulic PRESS 250 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B05','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B06','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B07','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B08','Hydraulic VACUUM 200 Ton',1,'B','MEDIUM',1,'Running','B',2),
(UUID(),'B09','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B10','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B11','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B12','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B13','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B14','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B15','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B16','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B17','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B18','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B19','Hydraulic PRESS 200 Ton',1,'B','MEDIUM',1,'Running','B',1),
(UUID(),'B20','Hydraulic PRESS 50 Ton', 1,'C','LOW',   1,'Running','B',1),
(UUID(),'B21','Hydraulic PRESS 50 Ton', 1,'C','LOW',   1,'Running','B',1),
-- Line C (dept=2, Production Line 2)
(UUID(),'A11','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'A12','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C01','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C02','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C03','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C06','INJECTION RUBBER 100 Ton',2,'B','MEDIUM',2,'Running','C',3),
(UUID(),'C07','INJECTION RUBBER 150 Ton',2,'B','MEDIUM',2,'Running','C',3),
(UUID(),'C08','INJECTION RUBBER 150 Ton',2,'B','MEDIUM',2,'Running','C',3),
(UUID(),'C09','INJECTION RUBBER 150 Ton',2,'B','MEDIUM',2,'Running','C',3),
(UUID(),'C10','INJECTION RUBBER 150 Ton',2,'B','MEDIUM',2,'Running','C',3),
(UUID(),'C13','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C14','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C15','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C16','Hydraulic VACUUM 200 Ton',6,'B','MEDIUM',2,'Running','C',1),
(UUID(),'C17','INJECTION RUBBER 300 Ton',2,'A','HIGH',  2,'Running','C',3),
-- Line D (dept=2, Production Line 2)
(UUID(),'D06','Hydraulic COMPRESSION 500 Ton',1,'A','HIGH',  2,'Running','D',2),
(UUID(),'D07','Hydraulic DESMA 400 Ton',       4,'B','MEDIUM',2,'Running','D',4),
(UUID(),'D08','Hydraulic DESMA 250 Ton',       4,'B','MEDIUM',2,'Running','D',4),
(UUID(),'D09','Hydraulic DESMA 400 Ton',       4,'B','MEDIUM',2,'Running','D',4),
(UUID(),'D10','Hydraulic DESMA 250 Ton',       4,'B','MEDIUM',2,'Running','D',4),
(UUID(),'D11','Hydraulic DESMA 250 Ton',       4,'B','MEDIUM',2,'Running','D',4),
-- TFC Utility (dept=5, Maintenance)
(UUID(),'TFC01','DEGREASING MACHINE',       5,'C','LOW',5,'Running','TFC',5),
(UUID(),'TFC02','SHOT BLASTING MACHINE',    5,'C','LOW',5,'Running','TFC',6),
(UUID(),'TFC03','ADHESIVE STATION MACHINE', 5,'C','LOW',5,'Running','TFC',7),
(UUID(),'TFC04','โต๊ะทาสี และอุปกรณ์การทำงาน',5,'C','LOW',5,'Running','TFC',8);
