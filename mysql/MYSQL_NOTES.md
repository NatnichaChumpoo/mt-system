# เวอร์ชัน MySQL — บันทึกการแปลงจาก PostgreSQL

ไฟล์ในโฟลเดอร์ `mysql/`:
- `schema_mysql.sql` — โครงสร้างทั้งหมด (ตาราง + trigger + function + view)
- `seed_mysql.sql` — ข้อมูลสมมุติ (สร้างจาก data.js)
- `gen_seed_mysql.mjs` — tool สร้าง seed ใหม่ถ้าข้อมูลเปลี่ยน

## วิธีรัน (MySQL 8.0+)
```bash
mysql -u root -p
CREATE DATABASE car_mt CHARACTER SET utf8mb4;
USE car_mt;
SOURCE /path/to/mysql/schema_mysql.sql;
SOURCE /path/to/mysql/seed_mysql.sql;
```
ต้องเป็น **MySQL 8.0.13 ขึ้นไป** (ใช้ DEFAULT (UUID()), generated column, CHECK constraint)

## สิ่งที่เปลี่ยนจาก PostgreSQL

| PostgreSQL | MySQL 8 |
|---|---|
| `CREATE TYPE ... AS ENUM` | `ENUM(...)` inline ในคอลัมน์ |
| `gen_random_uuid()` | `CHAR(36) DEFAULT (UUID())` |
| `serial` / `bigserial` | `AUTO_INCREMENT` |
| `timestamptz` | `DATETIME` |
| `numeric` | `DECIMAL` |
| `generated always as (...) stored` | `AS (...) STORED` (downtime ใช้ TIMESTAMPDIFF) |
| `sequence` รันเลข REQ | ตาราง `seq_counters` + trigger |
| trigger plpgsql | trigger MySQL (DELIMITER $$) |
| `current_setting('app...')` | user variable `@telegram_team_chat` |
| ปิด trigger ตอน seed (`DISABLE TRIGGER`) | user variable `@mt_seed` (trigger เช็คก่อนทำงาน) |
| `count(*) filter (where ...)` | `SUM(cond)` |

ตรรกะเหมือนเดิมทุกอย่าง: รันเลขใบแจ้งซ่อมอัตโนมัติ, ตัดสต็อกเมื่อเบิกอะไหล่,
อัปเดต current_stock, แจ้งเตือนใบแจ้งใหม่ (Telegram + escalate email Rank A), แจ้งเตือนต่ำกว่า ROP

## ตั้งค่า chat กลุ่มทีมช่าง (ก่อนใช้จริง)
```sql
SET @telegram_team_chat = '-1001234567890';
```
ตั้งใน session ของ backend ที่เขียนข้อมูล หรือฝังใน connection init

## ข้อควรรู้ (ผลจากการทิ้ง Supabase)
- ไม่มี auto-API แล้ว → **ต้องเขียน backend เอง** (เช่น Node/Express หรือ PHP) เป็นตัวกลางระหว่างเว็บกับ MySQL
- `supabase-bridge.js` เดิมจะใช้กับ MySQL ตรง ๆ ไม่ได้ ต้องเปลี่ยนให้เรียก REST API ของ backend แทน
- ไม่มี Realtime/Auth ในตัว → ทำเองหรือใช้ library เสริม

## การทดสอบ
- DDL + seed ผ่านการ validate ด้วย SQL parser (dialect=mysql) ครบ
- ตรรกะ (trigger/generated/view) ตรงกับเวอร์ชัน PostgreSQL ซึ่งรันจริงผ่านแล้ว
- แนะนำรัน schema+seed บน MySQL 8 ของจริงอีกครั้งเพื่อยืนยันในสภาพแวดล้อมเป้าหมาย
