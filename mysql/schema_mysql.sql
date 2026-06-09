-- =====================================================================
--  Complete Auto Rubber - Maintenance & Spare Part System
--  MySQL 8.0+ schema  (converted from PostgreSQL/Supabase version)
--  Engine: InnoDB | Charset: utf8mb4 | Currency: THB
--  NOTE: ENUM = inline ; UUID = CHAR(36) DEFAULT (UUID()) ;
--        generated column = AS (...) STORED ; trigger/function = MySQL syntax
-- =====================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS notification_log, spare_part_usage, repair_actions,
  maintenance_requests, stock_movements, pm_schedules, spare_parts,
  machines, app_users, suppliers, problem_categories, departments,
  mc_groups, seq_counters;
DROP FUNCTION IF EXISTS risk_zone;
SET FOREIGN_KEY_CHECKS=1;

-- counters (ใช้รันเลขใบแจ้งซ่อมแทน sequence)
CREATE TABLE seq_counters (
  cname VARCHAR(32) PRIMARY KEY,
  val   INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ reference tables ============
CREATE TABLE mc_groups (
  id   SMALLINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(16) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE departments (
  id   SMALLINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE suppliers (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL UNIQUE,
  contact VARCHAR(128),
  lead_time_days INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (lead_time_days >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE problem_categories (
  id   SMALLINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE app_users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  auth_user_id CHAR(36) UNIQUE,
  full_name VARCHAR(128) NOT NULL,
  role ENUM('operator','technician','supervisor','manager','planner','store','purchasing','admin','maintenance') NOT NULL DEFAULT 'operator',
  email VARCHAR(190) UNIQUE,
  telegram_chat_id VARCHAR(64),
  phone VARCHAR(32),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ machine domain ============
CREATE TABLE machines (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  mc_group_id SMALLINT,
  `rank` ENUM('A','B','C') NOT NULL DEFAULT 'C',
  criticality ENUM('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'LOW',
  department_id SMALLINT,
  location VARCHAR(64),
  maker VARCHAR(64),
  model VARCHAR(64),
  install_date DATE,
  qr_code_url TEXT,
  status ENUM('Running','Stop','Maintenance','Retired') NOT NULL DEFAULT 'Running',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (mc_group_id) REFERENCES mc_groups(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_machines_group ON machines(mc_group_id);
CREATE INDEX idx_machines_status ON machines(status);

-- ============ spare part domain ============
CREATE TABLE spare_parts (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  mc_group_id SMALLINT,
  min_stock INT NOT NULL DEFAULT 0,
  max_stock INT NOT NULL DEFAULT 0,
  safety_stock INT NOT NULL DEFAULT 0,
  rop INT NOT NULL DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  criticality_score SMALLINT NOT NULL DEFAULT 3,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  supplier_id INT,
  location VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (mc_group_id) REFERENCES mc_groups(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CHECK (criticality_score IN (3,6,9)),
  CHECK (min_stock>=0 AND max_stock>=0 AND safety_stock>=0 AND rop>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_parts_group ON spare_parts(mc_group_id);

CREATE TABLE stock_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  part_id CHAR(36) NOT NULL,
  type ENUM('IN','OUT','ADJUST') NOT NULL,
  qty INT NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  ref_request_id CHAR(36),
  note VARCHAR(190),
  moved_by CHAR(36),
  moved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (part_id) REFERENCES spare_parts(id),
  FOREIGN KEY (moved_by) REFERENCES app_users(id),
  CHECK (qty>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_moves_part ON stock_movements(part_id);
CREATE INDEX idx_moves_time ON stock_movements(moved_at);

CREATE TABLE purchase_orders (
  id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  po_no VARCHAR(24) NOT NULL UNIQUE,
  supplier_id INT,
  expected_date DATE,
  note VARCHAR(255),
  total_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES app_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE purchase_order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  po_id CHAR(36) NOT NULL,
  part_id CHAR(36) NOT NULL,
  qty INT NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (part_id) REFERENCES spare_parts(id),
  CHECK (qty > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============ maintenance request domain ============
CREATE TABLE maintenance_requests (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  request_no VARCHAR(32) UNIQUE,
  machine_id CHAR(36) NOT NULL,
  problem_description TEXT NOT NULL,
  priority ENUM('Critical','High','Medium','Low') NOT NULL DEFAULT 'Medium',
  reporter_id CHAR(36),
  department_id SMALLINT,
  status ENUM('New','Waiting','In Progress','Completed','Cancelled','Returned','Resubmitted') NOT NULL DEFAULT 'New',
  review_round INT NOT NULL DEFAULT 0,
  accepted_by_name VARCHAR(190),
  accepted_at DATETIME NULL,
  breakdown_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finish_repair DATETIME NULL,
  downtime_hours DECIMAL(10,2)
     AS (CASE WHEN finish_repair IS NOT NULL
              THEN ROUND(TIMESTAMPDIFF(SECOND, breakdown_start, finish_repair)/3600, 2)
              ELSE NULL END) STORED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (reporter_id) REFERENCES app_users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_req_machine ON maintenance_requests(machine_id);
CREATE INDEX idx_req_status ON maintenance_requests(status);

CREATE TABLE IF NOT EXISTS prod_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  round INT NOT NULL,
  decision ENUM('Approved','Rejected') NOT NULL,
  reason TEXT,
  decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE repair_actions (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  request_id CHAR(36) NOT NULL UNIQUE,
  technician_id CHAR(36),
  problem_category_id SMALLINT,
  root_cause TEXT,
  corrective_action TEXT,
  repair_hours DECIMAL(10,2),
  verification_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  verified_by CHAR(36),
  repaired_at DATETIME,
  PRIMARY KEY (id),
  FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES app_users(id),
  FOREIGN KEY (problem_category_id) REFERENCES problem_categories(id),
  FOREIGN KEY (verified_by) REFERENCES app_users(id),
  CHECK (repair_hours >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE spare_part_usage (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  request_id CHAR(36) NOT NULL,
  part_id CHAR(36) NOT NULL,
  qty_used INT NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(14,2) AS (qty_used * unit_cost) STORED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES spare_parts(id),
  CHECK (qty_used > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_usage_req ON spare_part_usage(request_id);
CREATE INDEX idx_usage_part ON spare_part_usage(part_id);

CREATE TABLE pm_schedules (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  machine_id CHAR(36) NOT NULL,
  checklist TEXT NOT NULL,
  frequency ENUM('Daily','Weekly','Monthly','Quarterly','Yearly') NOT NULL,
  last_pm_date DATE,
  next_pm_date DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_pm_machine ON pm_schedules(machine_id);
CREATE INDEX idx_pm_next ON pm_schedules(next_pm_date);

CREATE TABLE notification_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  channel ENUM('telegram','email') NOT NULL,
  recipient VARCHAR(190) NOT NULL,
  subject VARCHAR(190),
  message TEXT NOT NULL,
  status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
  related_request_id CHAR(36),
  related_part_id CHAR(36),
  error TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  FOREIGN KEY (related_request_id) REFERENCES maintenance_requests(id),
  FOREIGN KEY (related_part_id) REFERENCES spare_parts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_notif_status ON notification_log(status);

-- ============ function + triggers ============
DELIMITER $$

CREATE FUNCTION risk_zone(p_rank VARCHAR(1), p_score INT)
RETURNS VARCHAR(16) DETERMINISTIC
BEGIN
  RETURN CASE WHEN p_rank='A' THEN 'HIGH RISK'
              WHEN p_rank='B' THEN 'MEDIUM RISK'
              ELSE 'LOW RISK' END;
END$$

-- รันเลขใบแจ้งซ่อม REQ-YYYY-NNN
CREATE TRIGGER trg_request_no BEFORE INSERT ON maintenance_requests
FOR EACH ROW
BEGIN
  DECLARE v_yr CHAR(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  DECLARE v_key VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  DECLARE v_seq INT;
  IF NEW.request_no IS NULL THEN
    SET v_yr = DATE_FORMAT(COALESCE(NEW.breakdown_start, NOW()), '%Y');
    SET v_key = CONCAT(_utf8mb4'REQ-' COLLATE utf8mb4_0900_ai_ci, v_yr);
    INSERT INTO seq_counters(cname, val) VALUES (v_key, 1)
      ON DUPLICATE KEY UPDATE val = val + 1;
    SELECT val INTO v_seq
      FROM seq_counters
      WHERE cname COLLATE utf8mb4_0900_ai_ci = v_key;
    SET NEW.request_no = CONCAT(
      _utf8mb4'REQ-' COLLATE utf8mb4_0900_ai_ci,
      v_yr,
      _utf8mb4'-' COLLATE utf8mb4_0900_ai_ci,
      LPAD(v_seq, 3, _utf8mb4'0' COLLATE utf8mb4_0900_ai_ci)
    );
  END IF;
END$$

-- แจ้งเตือนเมื่อมีใบแจ้งซ่อมใหม่ (Telegram ทีมช่าง + escalate email Rank A)
CREATE TRIGGER trg_notify_request AFTER INSERT ON maintenance_requests
FOR EACH ROW
BEGIN
  DECLARE v_code VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  DECLARE v_name VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  DECLARE v_rank VARCHAR(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  DECLARE v_msg TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  IF @mt_seed IS NULL THEN
    SELECT code, name, `rank`
      INTO v_code, v_name, v_rank
      FROM machines
      WHERE id COLLATE utf8mb4_0900_ai_ci = NEW.machine_id COLLATE utf8mb4_0900_ai_ci;
    SET v_msg = CONCAT('BREAKDOWN! ', COALESCE(NEW.request_no,'(new)'),
                       ' | MC: ', v_code, ' - ', v_name,
                       ' | ', NEW.problem_description,
                       ' | Priority: ', NEW.priority,
                       ' | Risk: ', risk_zone(v_rank, 6));
    INSERT INTO notification_log(channel, recipient, subject, message, related_request_id)
      VALUES ('telegram', COALESCE(@telegram_team_chat, 'TEAM_CHAT'), 'New Breakdown', v_msg, NEW.id);
    IF v_rank COLLATE utf8mb4_0900_ai_ci = _utf8mb4'A' COLLATE utf8mb4_0900_ai_ci THEN
      INSERT INTO notification_log(channel, recipient, subject, message, related_request_id)
        SELECT 'email', email, CONCAT('CRITICAL STOP: ', v_code), v_msg, NEW.id
        FROM app_users
        WHERE role COLLATE utf8mb4_0900_ai_ci = _utf8mb4'manager' COLLATE utf8mb4_0900_ai_ci
          AND email IS NOT NULL;
    END IF;
  END IF;
END$$

-- ตัดสต็อกอัตโนมัติเมื่อบันทึกการใช้อะไหล่
CREATE TRIGGER trg_apply_usage AFTER INSERT ON spare_part_usage
FOR EACH ROW
BEGIN
  IF @mt_seed IS NULL THEN
    INSERT INTO stock_movements(part_id, type, qty, unit_cost, ref_request_id, note)
      VALUES (NEW.part_id, 'OUT', NEW.qty_used, NEW.unit_cost, NEW.request_id, 'Auto: spare_part_usage');
  END IF;
END$$

-- ปรับ current_stock จากการเคลื่อนไหวสต็อก
CREATE TRIGGER trg_recalc_stock AFTER INSERT ON stock_movements
FOR EACH ROW
BEGIN
  IF @mt_seed IS NULL THEN
    UPDATE spare_parts
      SET current_stock = current_stock +
          (CASE WHEN NEW.type='IN' THEN NEW.qty
                WHEN NEW.type='OUT' THEN -NEW.qty
                ELSE NEW.qty END)
      WHERE id = NEW.part_id;
  END IF;
END$$

-- แจ้งเตือนเมื่อสต็อกต่ำกว่า ROP
CREATE TRIGGER trg_notify_low_stock AFTER UPDATE ON spare_parts
FOR EACH ROW
BEGIN
  IF @mt_seed IS NULL AND NEW.current_stock < NEW.rop AND OLD.current_stock <> NEW.current_stock THEN
    INSERT INTO notification_log(channel, recipient, subject, message, related_part_id)
      SELECT 'email', email, CONCAT('STOCK ALERT: ', NEW.code),
             CONCAT('Part ', NEW.code, ' (', NEW.name, ') stock=', NEW.current_stock,
                    ' below ROP(', NEW.rop, ')'), NEW.id
      FROM app_users WHERE role IN ('purchasing','store') AND email IS NOT NULL;
  END IF;
END$$

DELIMITER ;

-- ============ KPI views ============
CREATE OR REPLACE VIEW v_spare_status AS
SELECT p.id, p.code, p.name, g.name AS mc_group,
       p.current_stock, p.rop, p.safety_stock, p.criticality_score,
       CASE WHEN p.current_stock = 0 THEN 'OUT_OF_STOCK'
            WHEN p.current_stock < p.rop THEN 'BELOW_ROP'
            ELSE 'NORMAL' END AS stock_status,
       p.current_stock * p.unit_cost AS stock_value
FROM spare_parts p LEFT JOIN mc_groups g ON g.id = p.mc_group_id;

CREATE OR REPLACE VIEW v_pm_status AS
SELECT pm.*, m.code AS machine_code,
       CASE WHEN pm.completed THEN 'Completed'
            WHEN pm.next_pm_date < CURDATE() THEN 'Overdue'
            ELSE 'Scheduled' END AS pm_state
FROM pm_schedules pm JOIN machines m ON m.id = pm.machine_id;

CREATE OR REPLACE VIEW v_kpi_pm_compliance AS
SELECT SUM(completed) AS completed_pm, COUNT(*) AS total_pm,
       ROUND(100.0 * SUM(completed) / NULLIF(COUNT(*),0), 2) AS compliance_pct
FROM pm_schedules;

CREATE OR REPLACE VIEW v_kpi_maintenance AS
SELECT COUNT(*) AS breakdown_count,
       ROUND(AVG(ra.repair_hours), 2) AS mttr_hours,
       ROUND(SUM(r.downtime_hours), 2) AS total_downtime_hours
FROM maintenance_requests r
LEFT JOIN repair_actions ra ON ra.request_id = r.id
WHERE r.created_at >= NOW() - INTERVAL 30 DAY;

CREATE OR REPLACE VIEW v_repair_cost AS
SELECT r.request_no, m.code AS machine_code, COALESCE(SUM(u.total_cost),0) AS parts_cost
FROM maintenance_requests r
JOIN machines m ON m.id = r.machine_id
LEFT JOIN spare_part_usage u ON u.request_id = r.id
GROUP BY r.request_no, m.code;

CREATE OR REPLACE VIEW v_machine_risk AS
SELECT m.code, m.name, g.name AS mc_group, m.`rank`, m.criticality, m.status,
       risk_zone(m.`rank`, CASE m.criticality WHEN 'HIGH' THEN 9 WHEN 'MEDIUM' THEN 6 ELSE 3 END) AS risk_zone
FROM machines m LEFT JOIN mc_groups g ON g.id = m.mc_group_id;
