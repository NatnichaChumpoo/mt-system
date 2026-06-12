// telegram-worker.js
// 1) ส่งข้อความค้างใน notification_log (channel=telegram, status=pending) เข้า Telegram พร้อมปุ่ม "รับงาน"
// 2) long-poll รับ callback เมื่อช่างกด "รับงาน" -> เปลี่ยนสถานะใบแจ้งซ่อมเป็น 'In Progress'
// รัน: node telegram-worker.js   (ต้องตั้ง TELEGRAM_BOT_TOKEN, TELEGRAM_TEAM_CHAT ใน .env)
import dotenv from "dotenv";
import { getSafeDbConfig, q, verifyDbConnectionOnce } from "./db.js";
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const SEND_MS = Number(process.env.WORKER_SEND_MS || 5000);

// ---------- pure helpers (มี selftest) ----------
export function resolveChatId(recipient, chatMap) {
  return recipient && Object.prototype.hasOwnProperty.call(chatMap || {}, recipient)
    ? chatMap[recipient]
    : recipient;
}
export function parseCallback(data) {
  if (!data) return null;
  const i = data.indexOf(":");
  if (i < 0) return null;
  const action = data.slice(0, i);
  const id = data.slice(i + 1);
  if (action === "accept" && id) return { action, id };
  return null;
}
export function resolveAcceptName(from) {
  if (!from) return "Technician";
  const full = [from.first_name, from.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (from.username) return "@" + from.username;
  return "Technician";
}
export function buildSendBody(row, chatId) {
  const body = { chat_id: chatId, text: row.message, parse_mode: "HTML" };
  if (row.related_request_id) {
    body.reply_markup = {
      inline_keyboard: [[
        { text: "✅ รับงาน", callback_data: "accept:" + row.related_request_id },
      ]],
    };
  }
  return body;
}

async function tg(method, payload) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(method + ": " + JSON.stringify(j));
  return j.result;
}

// ---------- (1) ส่งข้อความค้าง ----------
const CHAT_MAP = {
  TEAM_CHAT: process.env.TELEGRAM_TEAM_CHAT,
  STORE_CHAT: process.env.TELEGRAM_STORE_CHAT,
};

async function sendPending() {
  const rows = await q(
    `SELECT id, recipient, subject, message, related_request_id
     FROM notification_log
     WHERE channel='telegram' AND status='pending'
     ORDER BY created_at LIMIT 20`
  );
  for (const row of rows) {
    const chatId = resolveChatId(row.recipient, CHAT_MAP);
    try {
      if (!chatId) throw new Error(`no chat id for recipient "${row.recipient}" (set TELEGRAM_TEAM_CHAT / TELEGRAM_STORE_CHAT)`);
      await tg("sendMessage", buildSendBody(row, chatId));
      await q(`UPDATE notification_log SET status='sent', sent_at=NOW() WHERE id=?`, [row.id]);
      console.log("[send] ok id", row.id, "->", chatId);
    } catch (e) {
      await q(`UPDATE notification_log SET status='failed', error=? WHERE id=?`, [String(e.message || e), row.id]);
      console.error("[send] fail id", row.id, e.message);
    }
  }
}

// ---------- (2) ช่างกดรับงาน ----------
async function handleAccept(cb) {
  const parsed = parseCallback(cb.data);
  if (!parsed) return;
  const reqId = parsed.id;
  const who = resolveAcceptName(cb.from);

  // เปลี่ยนสถานะเฉพาะงานที่ยังไม่ถูกรับ (กันกดซ้ำ/ชนกัน)
  const result = await q(
    `UPDATE maintenance_requests
     SET status='In Progress', accepted_by_name=?, accepted_at=NOW()
     WHERE id=? AND status IN ('New','Waiting')`,
    [who, reqId]
  );
  const rows = await q(`SELECT request_no, status FROM maintenance_requests WHERE id=?`, [reqId]);
  const reqRow = rows[0];
  const reqNo = reqRow ? reqRow.request_no : reqId;

  if (result.affectedRows > 0) {
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text: `รับงาน ${reqNo} แล้ว ✅` });
    if (cb.message) {
      await tg("editMessageText", {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: (cb.message.text || "") + `\n\n✅ รับงานแล้วโดย ${who} — สถานะ: กำลังซ่อม`,
        parse_mode: "HTML",
      });
    }
    console.log("[accept]", reqNo, "->", who);
  } else {
    await tg("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: reqRow ? `งาน ${reqNo} ถูกรับ/ปิดไปแล้ว (${reqRow.status})` : "ไม่พบงานนี้",
      show_alert: true,
    });
  }
}

// ---------- long-poll updates ----------
let offset = 0;
async function pollUpdates() {
  try {
    const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
    const j = await res.json();
    if (j.ok) {
      for (const up of j.result) {
        offset = up.update_id + 1;
        if (up.callback_query) {
          try { await handleAccept(up.callback_query); }
          catch (e) { console.error("[accept] err", e.message); }
        }
      }
    }
  } catch (e) {
    console.error("[poll] err", e.message);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

async function main() {
  if (!TOKEN) { console.error("ต้องตั้ง TELEGRAM_BOT_TOKEN ใน .env"); process.exit(1); }
  console.log("[worker] DB config", getSafeDbConfig());
  try {
    await verifyDbConnectionOnce();
  } catch (e) {
    console.error("[worker] database connection failed before start");
    console.error("[worker] using DB config", getSafeDbConfig());
    console.error("[worker] mysql error:", e.message);
    process.exit(1);
  }
  console.log("[worker] started: send every", SEND_MS, "ms + long-poll callbacks");
  setInterval(() => sendPending().catch((e) => console.error(e)), SEND_MS);
  // eslint-disable-next-line no-constant-condition
  while (true) { await pollUpdates(); }
}

// ---------- selftest (ไม่ใช้เน็ต/DB) ----------
if (process.argv.includes("--selftest")) {
  const a = resolveChatId("TEAM_CHAT", { TEAM_CHAT: "-100123", STORE_CHAT: "-100456" }) === "-100123";
  const b = resolveChatId("STORE_CHAT", { TEAM_CHAT: "-100123", STORE_CHAT: "-100456" }) === "-100456";
  const b2 = resolveChatId("-555", { TEAM_CHAT: "-100123" }) === "-555";
  const c = JSON.stringify(parseCallback("accept:abc-123-xyz")) === JSON.stringify({ action: "accept", id: "abc-123-xyz" });
  const d = parseCallback("nope") === null;
  const nameA = resolveAcceptName({ first_name: "Somchai", last_name: "K." }) === "Somchai K.";
  const nameB = resolveAcceptName({ username: "tech_a" }) === "@tech_a";
  const body = buildSendBody({ message: "hi", related_request_id: "R-1" }, "-100");
  const e = body.reply_markup.inline_keyboard[0][0].callback_data === "accept:R-1";
  const f = !buildSendBody({ message: "x" }, "-100").reply_markup; // ไม่มีปุ่มถ้าไม่มี request
  console.log("selftest:", { resolveTeam: a, resolveStore: b, resolveDirect: b2, parse: c, parseBad: d, nameFull: nameA, nameUser: nameB, button: e, noButton: f });
  process.exit(a && b && b2 && c && d && nameA && nameB && e && f ? 0 : 1);
}

main();
