# Bridge Setup — ต่อ prototype เข้ากับ Supabase

ทำให้ UI prototype เดิมดึงข้อมูล "สด" จาก Supabase แทนข้อมูล hard-code ใน `data.js`
โดยไม่ต้องแก้หน้าจอ (ไฟล์ `.jsx` ทั้งหมดเหมือนเดิม)

## ไฟล์ที่เพิ่ม/แก้

| ไฟล์ | หน้าที่ |
|---|---|
| `supabase/schema.sql` | สร้างตาราง/trigger/view ทั้งหมด |
| `supabase/seed.sql` | ใส่ข้อมูลสมมุติ (สร้างจาก data.js เดิม) |
| `supabase/gen_seed.mjs` | tool สร้าง seed.sql ใหม่จาก data.js (ถ้าแก้ข้อมูล) |
| `supabase-config.js` | ใส่ URL + anon key ของโปรเจกต์ |
| `supabase-bridge.js` | ดึงข้อมูลจาก Supabase → ประกอบเป็น `window.DATA` |
| `MT System (Supabase).html` | หน้าเว็บเวอร์ชันต่อ Supabase |
| `app.jsx` | แก้บรรทัด mount ให้รอข้อมูลโหลด (รองรับทั้ง 2 โหมด) |

> เวอร์ชันเดิม `MT System.html` (ใช้ `data.js`) ยังเปิดได้ปกติ ไม่กระทบ

## ขั้นตอน

### 1. สร้างโปรเจกต์ Supabase
ไปที่ supabase.com → New Project (free tier) → รอ provision เสร็จ

### 2. รัน schema + seed
เปิด **SQL Editor** ในโปรเจกต์ Supabase แล้วรันตามลำดับ:
1. วางเนื้อหา `supabase/schema.sql` → Run
2. วางเนื้อหา `supabase/seed.sql` → Run

### 3. ใส่ค่า config
เปิด `supabase-config.js` แก้ 2 บรรทัด (เอาจาก Project Settings → API):
```js
window.SUPABASE_URL = "https://xxxx.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGci...";
```

### 4. เปิดเว็บ
ต้องเสิร์ฟผ่าน local server (เปิดไฟล์ตรง ๆ จะติด CORS):
```bash
cd mt-system
python -m http.server 8000
```
แล้วเปิด `http://localhost:8000/MT System (Supabase).html`

ถ้าขึ้น "กำลังโหลด…" แล้วเข้าหน้า login = เชื่อมสำเร็จ ลองสลับ role ดูข้อมูลสดได้เลย

## อะไร live / อะไรยังเป็นค่านำเสนอ

**Live จาก DB:** เครื่องจักร, ใบแจ้งซ่อม, บันทึกซ่อม, อะไหล่ที่ใช้, Master Data อะไหล่ (สถานะสต็อกคำนวณสด), รายการสั่งซื้อ (ต่ำกว่า ROP), Stock In/Out, แผน PM (overdue คำนวณสด), users

**ยังเป็นค่านำเสนอ (static ใน bridge):** KPI cards (MTBF/MTTR…), Pareto, MC Group summary, downtime trend — ทำเป็น SQL view เพิ่มทีหลังได้ (มี `v_kpi_*` ใน schema เป็นจุดเริ่ม)

## เขียนข้อมูลจริง (write)

`supabase-bridge.js` มี helper พร้อมใช้:
- `DATA.createRequest({machineCode, problem, priority, reporterName})` → สร้างใบแจ้งซ่อม (DB รันเลข REQ + ยิง Telegram ให้เอง) คืนค่าเลขใบแจ้ง
- `DATA.saveRepair(requestNo, repair, parts[])` → บันทึกซ่อม + อะไหล่ (DB ตัดสต็อกอัตโนมัติ)
- `DATA.refresh()` → โหลดข้อมูลใหม่

ขั้นต่อไป: แก้ handler ของ `ReportForm` / `RepairForm` ให้เรียก helper เหล่านี้แทนการแสดง toast เฉย ๆ แล้ว `await DATA.refresh()`

## หมายเหตุ
- ตอนนี้ยังไม่เปิด RLS (อ่าน/เขียนด้วย anon key ได้หมด) เหมาะกับ demo — ก่อนใช้จริงต้องเปิด RLS + ผูก Supabase Auth ตาม role
- การยิง Telegram จริงต้อง deploy Edge Function (`telegram_notify.ts`) + ตั้ง pg_cron ตาม `notification_plan.md`
