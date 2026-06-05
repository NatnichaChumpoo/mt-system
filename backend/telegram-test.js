// telegram-test.js — ทดสอบ Telegram แบบ standalone (ไม่ต้องมี DB / API)
// ใช้แค่ TELEGRAM_BOT_TOKEN
//
//   1) หา chat id:        node telegram-test.js whoami
//   2) ทดสอบเต็ม (ส่ง+กดปุ่ม): node telegram-test.js demo <chatId>
//
// (ต้อง Node 18+ ; อ่าน .env อัตโนมัติถ้ามี)
try { await import("dotenv/config"); } catch {}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.argv[3];
const API = `https://api.telegram.org/bot${TOKEN}`;
const mode = process.argv[2] || "whoami";

async function tg(method, payload) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(method + ": " + JSON.stringify(j));
  return j.result;
}

// โหมด whoami: พิมพ์ chat id / ข้อความ / callback ที่เข้ามา
async function whoami() {
  console.log("ส่งข้อความหาบอท หรือพิมพ์อะไรก็ได้ในกลุ่มที่มีบอท แล้วดู chat id ด้านล่าง (Ctrl+C เพื่อหยุด)\n");
  let offset = 0;
  while (true) {
    const ups = await tg("getUpdates", { timeout: 30, offset });
    for (const up of ups) {
      offset = up.update_id + 1;
      const m = up.message || up.channel_post;
      if (m) console.log("chat id:", m.chat.id, "| type:", m.chat.type, "| from:", (m.from && m.from.first_name) || "-", "| text:", m.text || "");
      if (up.callback_query) console.log("callback:", up.callback_query.data, "| from:", up.callback_query.from.first_name);
    }
  }
}

// โหมด demo: ส่งข้อความมีปุ่ม "รับงาน" แล้วรอกดปุ่ม -> ตอบกลับ + แก้ข้อความ
async function demo(chatId) {
  if (!chatId) { console.error("ใส่ chatId ด้วย: node telegram-test.js demo <chatId>"); process.exit(1); }
  const text =
    "🚨 BREAKDOWN! REQ-2026-TEST\n" +
    "เครื่อง: MC-001 - Compression Machine A1\n" +
    "อาการ: Heater element broken\n" +
    "ความสำคัญ: High | ความเสี่ยง: HIGH RISK";
  await tg("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: { inline_keyboard: [[{ text: "✅ รับงาน", callback_data: "accept:REQ-2026-TEST" }]] },
  });
  console.log("ส่งข้อความทดสอบแล้ว — ไปกดปุ่ม '✅ รับงาน' ใน Telegram (Ctrl+C เพื่อหยุด)\n");

  let offset = 0;
  while (true) {
    const ups = await tg("getUpdates", { timeout: 30, offset });
    for (const up of ups) {
      offset = up.update_id + 1;
      const cb = up.callback_query;
      if (cb && cb.data && cb.data.startsWith("accept:")) {
        const who = cb.from.first_name || cb.from.username || "ช่าง";
        await tg("answerCallbackQuery", { callback_query_id: cb.id, text: "รับงานแล้ว ✅" });
        await tg("editMessageText", {
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          text: cb.message.text + `\n\n✅ รับงานแล้วโดย ${who} — สถานะ: กำลังซ่อม`,
        });
        console.log(`✅ ${who} กดรับงาน ${cb.data.split(":")[1]} แล้ว — (ของจริงตรงนี้จะ UPDATE สถานะใน DB)`);
      }
    }
  }
}

if (!TOKEN) { console.error("ต้องตั้ง TELEGRAM_BOT_TOKEN (ใน .env หรือ env) ก่อน"); process.exit(1); }
if (mode === "whoami") await whoami();
else if (mode === "demo") await demo(process.argv[3]);
else { console.error("mode ไม่ถูกต้อง: ใช้ whoami หรือ demo"); process.exit(1); }
