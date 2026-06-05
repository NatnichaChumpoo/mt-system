# Backend — Express + MySQL (REST API)

ตัวกลางระหว่างเว็บ (prototype) กับฐานข้อมูล MySQL แทนที่ Supabase

## ต้องมีก่อน
- Node.js 18+ (มี `crypto.randomUUID`, `fetch`)
- MySQL 8.0.13+ ที่รัน `mysql/schema_mysql.sql` + `mysql/seed_mysql.sql` แล้ว

## ติดตั้ง & รัน
```bash
cd backend
npm install
cp .env.example .env      # แก้รหัส MySQL ใน .env
npm start                 # http://localhost:3001
```
ทดสอบ: เปิด `http://localhost:3001/api/health` ต้องได้ `{"ok":true}`
และ `http://localhost:3001/api/bootstrap` ต้องได้ JSON ข้อมูลทั้งหมด

## Endpoints
| Method | Path | หน้าที่ |
|---|---|---|
| GET | `/api/health` | เช็คว่า server ทำงาน |
| GET | `/api/bootstrap` | ดึงข้อมูลทั้งหมดในรูปทรง `window.DATA` (bridge ใช้ตัวนี้) |
| POST | `/api/requests` | แจ้งซ่อมใหม่ (DB รันเลข REQ + ยิง Telegram) → คืน `request_no` |
| POST | `/api/repairs` | บันทึกซ่อม + อะไหล่ (DB ตัดสต็อกอัตโนมัติ, ใช้ transaction) |

## ต่อกับเว็บ
1. รัน backend (`npm start`)
2. ที่โฟลเดอร์ `mt-system` แก้ `api-config.js` ให้ `API_BASE` ตรงกับ URL backend
3. เสิร์ฟ frontend แล้วเปิด **`MT System (API).html`**
   ```bash
   cd ..            # เข้า mt-system
   python -m http.server 8000
   # เปิด http://localhost:8000/MT System (API).html
   ```

## หมายเหตุ
- เปิด CORS ไว้แบบกว้าง (ทุก origin) เพื่อ dev — production ควรจำกัด origin
- ยังไม่มี Auth/JWT — ขั้นต่อไปควรเพิ่ม login + middleware ตรวจ role
- ตั้ง `TELEGRAM_TEAM_CHAT` ใน `.env` เพื่อให้ trigger แจ้งเตือนใช้ chat id จริง
- การยิง Telegram จริงยังต้องมี worker อ่านตาราง `notification_log` (status='pending') แล้วส่ง (ดู telegram_notify.ts เป็นแนวทาง / หรือทำเป็น cron ใน backend นี้)

## โครงสร้าง
```
backend/
  server.js        Express app + endpoints + mappers
  db.js            MySQL connection pool (mysql2)
  package.json
  .env.example
```

---

## Telegram Worker (แจ้งเตือน + รับงาน)

ไฟล์ `telegram-worker.js` เป็น process แยก ทำ 2 อย่าง:
1. **ส่งแจ้งเตือน** — อ่าน `notification_log` แถวที่ `channel='telegram' AND status='pending'` ส่งเข้า Telegram พร้อมปุ่ม **✅ รับงาน** แล้วมาร์คเป็น `sent`
2. **รับงาน** — long-poll `getUpdates` รอช่างกดปุ่ม → เปลี่ยนสถานะใบแจ้งซ่อมเป็น **In Progress (กำลังซ่อม)** กันกดซ้ำด้วย `WHERE status IN ('New','Waiting')` แล้วแก้ข้อความใน Telegram เป็น "รับงานแล้วโดย ..."

### ตั้งค่า + รัน
```bash
# .env ต้องมี
TELEGRAM_BOT_TOKEN=123456:ABC...     # จาก @BotFather
TELEGRAM_TEAM_CHAT=-1001234567890    # chat id กลุ่มทีมช่าง
# รัน (แยก terminal จาก server)
npm run worker
```
ทดสอบ logic ล้วน ๆ โดยไม่ต้องมี token/DB: `npm run worker:selftest`

### Flow ครบวงจร
```
[Operator กดแจ้งซ่อมในเว็บ]
      | POST /api/requests
      v
[DB] INSERT maintenance_requests
      | trigger trg_request_no  -> รันเลข REQ
      | trigger trg_notify_request -> เขียน notification_log (pending) + ปุ่มรับงาน
      v
[worker] อ่าน pending -> ส่ง Telegram เข้ากลุ่มทีมช่าง (มีปุ่ม ✅ รับงาน)
      v
[ช่างกด ✅ รับงาน ใน Telegram]
      | getUpdates callback accept:<request_id>
      v
[worker] UPDATE status='In Progress'
      v
[เว็บ] api-bridge poll ทุก 8 วิ เห็นสถานะเปลี่ยน -> dispatch mt-data-refresh
      -> หน้าจอแสดง "กำลังซ่อม" อัตโนมัติ (ไม่ต้อง refresh เอง)
```

### ต้องเปิดอะไรบ้างตอนใช้งานจริง (3 process)
1. MySQL (มี schema + seed)
2. `npm start`  (API :3001)
3. `npm run worker`  (Telegram)
4. เสิร์ฟ frontend แล้วเปิด `MT System (API).html`

> หมายเหตุ: chat ปลายทางของทีมช่างมาจาก `TELEGRAM_TEAM_CHAT` ใน worker (.env)
> การยืนยันตัวช่างที่กดรับ ตอนนี้ใช้ชื่อจาก Telegram โปรไฟล์ — ถ้าต้องผูกกับ user จริง
> ให้เก็บ telegram chat id ลง `app_users.telegram_chat_id` แล้ว map เพิ่มใน handleAccept
