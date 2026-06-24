/* ============================================================
   MT_System — Field / mobile screens
   Login, Machine(post-QR), Report form, Technician queue,
   Repair form, mobile request list & detail
   ============================================================ */
const Dm = window.DATA;

/* ---------------- 5.1 Login ---------------- */
const REG_ROLES = [
  ["operator","Operator — พนักงาน/ผู้ปฏิบัติงาน"],
  ["maintenance","Maintenance — ช่างซ่อมบำรุง (MT)"],
  ["production","Production — ฝ่ายผลิต (PD)"],
  ["manager","Manager — ผู้จัดการ"],
  ["store","Store Keeper — คลังอะไหล่"],
  ["admin","Admin — ผู้ดูแลระบบ"],
];

/* role ที่ใช้ Telegram + ลิงก์เชิญเข้ากลุ่ม (ใส่ลิงก์จริงตรงนี้) */
const TG_GROUP_LINKS = {
  maintenance: "https://t.me/+6U-BaEf2A6IyN2Q1", // กลุ่ม CAR MT System (ทีมช่าง MT)
  store: "https://t.me/+r5x_H0mDVmw2ZmNl",       // กลุ่ม Spare Part Alert (คลังอะไหล่)
};
const TG_GROUP_LABEL = { maintenance: "กลุ่มทีมช่าง (MT)", store: "กลุ่มคลังอะไหล่ (Store)" };
const roleUsesTelegram = (r) => r === "maintenance" || r === "store";

function LoginScreen({ ctx }) {
  const scannedMC = ctx.pendingMC ? Dm.machineByCode(ctx.pendingMC) : null;
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [regRole, setRegRole] = useState("operator");
  const [regTelegram, setRegTelegram] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth <= 860);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth <= 860);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const switchMode = (m) => { setMode(m); setErr(""); setPw2(""); };
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (mode === "register") {
      if (!user.trim()) { setErr("กรุณากรอกชื่อผู้ใช้ (Username)"); return; }
      if (pw.length < 4) { setErr("รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร"); return; }
      if (pw !== pw2) { setErr("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
      const tg = roleUsesTelegram(regRole) ? regTelegram.trim() : "";
      setLoading(true);
      try {
        const u = await Dm.register({ fullName: user.trim(), username: user.trim(), password: pw, role: regRole, telegramId: tg });
        try { localStorage.setItem("mt_operator_name", u.name); } catch {}
        // เด้งเปิดลิงก์กลุ่ม Telegram ตาม role (ถ้ามี + กรอก telegram แล้ว)
        const link = TG_GROUP_LINKS[regRole];
        if (tg && link) { try { window.open(link, "_blank"); } catch {} }
        ctx.login(u);
      } catch (ex) {
        setErr(ex.message || "สมัครสมาชิกไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!user.trim() || !pw) { setErr("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"); return; }
    setLoading(true);
    try {
      const u = await Dm.login(user.trim(), pw);
      try { localStorage.setItem("mt_operator_name", u.name); } catch {}
      ctx.login(u);
    } catch (ex) {
      setErr(ex.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      {/* left brand panel — light cream (hidden on phones) */}
      {!narrow &&
      <div style={{ flex: "1 1 0", minWidth: 0, background: "linear-gradient(155deg,#ffffff 0%,#f6efe3 55%,#efe5d4 100%)", color: "var(--ink)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 1, backgroundImage: "radial-gradient(700px 380px at 80% 6%, rgba(154,123,79,.16), transparent 62%)" }}></div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 13 }}>
          <span style={{ width: 48, height: 48, borderRadius: 13, background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="wrench" size={24} /></span>
          <div><div style={{ fontFamily: "var(--display)", fontSize: 21, fontWeight: 600 }}>Maintenance System</div><div className="tiny" style={{ color: "var(--ink-3)", letterSpacing: ".05em" }}>Machine Maintenance Console</div></div>
        </div>
        <div style={{ position: "relative", maxWidth: 440 }}>
          <div style={{ width: 46, height: 2, background: "var(--accent)", marginBottom: 24 }}></div>
          <div style={{ fontFamily: "var(--display)", fontSize: 38, fontWeight: 600, lineHeight: 1.22, letterSpacing: "-.01em" }}>
            ระบบแจ้งซ่อมเครื่องจักร<br />และคุมสต็อกอะไหล่
          </div>
          <div style={{ fontSize: 15.5, color: "var(--ink-2)", marginTop: 18, lineHeight: 1.6 }}>
            ตั้งแต่สแกน QR หน้าเครื่อง · แจ้งซ่อม · บริหารคิวงานช่าง · ตัดสต็อกอัตโนมัติ จนถึง Dashboard KPI สำหรับผู้บริหาร
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", gap: 30 }}>
          {[["MTBF", "420 ชม."], ["MTTR", "1.38 ชม."], ["PM", "80%"]].map(([k, v]) =>
          <div key={k}><div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 600 }}>{v}</div><div className="tiny" style={{ color: "var(--ink-3)", letterSpacing: ".06em", marginTop: 2 }}>{k}</div></div>
          )}
        </div>
      </div>
      }
      {/* right form */}
      <div style={{ flex: narrow ? "1 1 0" : "0 0 clamp(380px, 38%, 560px)", display: "flex", alignItems: "center", justifyContent: "center", padding: narrow ? "32px 20px" : "40px 48px", background: "var(--surface)" }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
          {narrow &&
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 26 }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="wrench" size={21} /></span>
            <div><div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, lineHeight: 1.1 }}>Maintenance System</div><div className="tiny" style={{ color: "var(--ink-3)", letterSpacing: ".04em" }}>Machine Maintenance Console</div></div>
          </div>
          }
          <div style={{ marginBottom: 30 }}>
            <div className="h-lg">{mode === "register" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</div>
            <div className="muted small" style={{ marginTop: 4 }}>
              {mode === "register" ? "สร้างบัญชีใหม่ — กรอกข้อมูลและตั้งรหัสผ่าน" : "ยินดีต้อนรับ — กรุณาเข้าสู่ระบบเพื่อใช้งาน"}
            </div>
          </div>
          <div className="field">
            <label>ชื่อผู้ใช้ (Username)</label>
            <input className="input" value={user} onChange={(e) => setUser(e.target.value)} autoCapitalize="none" autoCorrect="off" />
          </div>
          <div className="field">
            <label>{mode === "register" ? "ตั้งรหัสผ่าน (Password)" : "รหัสผ่าน (Password)"}</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </div>
          {mode === "register" &&
          <div className="field">
            <label>ยืนยันรหัสผ่าน (กรอกอีกครั้ง)</label>
            <input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" />
          </div>}
          {mode === "register" &&
          <div className="field">
            <label>บทบาท (Role)</label>
            <select className="select" value={regRole} onChange={(e) => setRegRole(e.target.value)}>
              {REG_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>}
          {mode === "register" && roleUsesTelegram(regRole) &&
          <div className="field">
            <label>Telegram (เบอร์โทร / @username)</label>
            <input className="input" value={regTelegram} onChange={(e) => setRegTelegram(e.target.value)} placeholder="เช่น @somchai หรือ 08x-xxx-xxxx" autoCapitalize="none" autoCorrect="off" />
            <div className="hint">สำหรับ {TG_GROUP_LABEL[regRole]} — สมัครเสร็จจะพาเข้ากลุ่ม Telegram ให้</div>
          </div>}
          {err &&
          <div style={{ background:"#fff1f2", border:"1px solid #fca5a5", color:"#9f1239", borderRadius:9, padding:"10px 12px", marginBottom:12, fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
            <Icon name="alert" size={15} style={{ flex:"none" }} /> {err}
          </div>}
          {scannedMC &&
          <div style={{ background:"var(--accent-bg)", border:"1px solid var(--accent)", borderRadius:10, padding:"12px 14px", marginBottom:12, display:"flex", gap:10, alignItems:"flex-start" }}>
            <Icon name="qr" size={18} style={{ color:"var(--accent)", flex:"none", marginTop:1 }} />
            <div>
              <div style={{ fontWeight:700, fontSize:13 }}>สแกน QR เครื่องจักร</div>
              <div style={{ fontWeight:600, fontSize:15, margin:"2px 0" }}>{scannedMC.code} — {scannedMC.name}</div>
              <div style={{ fontSize:12, color:"var(--ink-3)" }}>หลังเข้าสู่ระบบจะเด้งไปหน้าแจ้งซ่อมทันที</div>
            </div>
          </div>}
          <button className="btn btn-primary btn-lg btn-block" type="submit" style={{ marginTop: 8 }} disabled={loading}>
            {loading
              ? (mode === "register" ? "กำลังสมัคร…" : "กำลังเข้าสู่ระบบ…")
              : (mode === "register"
                  ? <><Icon name="user" size={17}/> สมัครสมาชิก</>
                  : (scannedMC ? <><Icon name="wrench" size={17}/> เข้าสู่ระบบและแจ้งซ่อม</> : <>เข้าสู่ระบบ <Icon name="chevR" size={17}/></>))}
          </button>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13.5, color: "var(--ink-2)" }}>
            {mode === "register" ? "มีบัญชีอยู่แล้ว? " : "ยังไม่มีบัญชี? "}
            <a onClick={() => switchMode(mode === "register" ? "login" : "register")}
               style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>
              {mode === "register" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </a>
          </div>
          <div className="tiny muted-2" style={{ textAlign: "center", marginTop: 18, letterSpacing: ".04em" }}>v1.0 · Industrial Maintenance System</div>
        </form>
      </div>
    </div>);

}

/* ---------------- 5.2 Machine (after QR scan) ---------------- */
function MachineScreen({ ctx }) {
  const mc = Dm.machineByCode(ctx.params.mc || Dm.scannedMachine);
  if (!mc) return (
    <div className="card card-pad" style={{ textAlign: "center", padding: 40 }}>
      <Icon name="alert" size={28} style={{ color: "var(--red)" }} />
      <div className="h-sm" style={{ marginTop: 10 }}>ไม่พบข้อมูลเครื่องจักร</div>
      <div className="muted small" style={{ marginTop: 4 }}>รหัส: {ctx.params.mc || Dm.scannedMachine}</div>
      {ctx.guest && <button className="btn" style={{ marginTop: 16 }} onClick={ctx.exitGuest}><Icon name="user" size={15} /> เข้าสู่ระบบ</button>}
    </div>
  );
  const running = mc.status === "Running";
  return (
    <div className="stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", padding: "22px 22px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(360px 180px at 92% 0%, rgba(154,123,79,.12), transparent 62%)" }}></div>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--accent)" }}></div>
          <div className="row between" style={{ position: "relative" }}>
            <span className="badge b-gray"><Icon name="qr" size={13} /> สแกนสำเร็จ</span>
            <span className={"badge " + (running ? "b-green" : "b-red")}><span className="dot"></span>{running ? "Running" : "Stop"}</span>
          </div>
          <div className="mono" style={{ fontSize: 28, fontWeight: 600, marginTop: 16, position: "relative", color: "var(--ink)" }}>{mc.code}</div>
          <div style={{ fontSize: 16, fontWeight: 600, position: "relative", color: "var(--ink-2)" }}>{mc.name}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 13, flexWrap: "wrap", position: "relative" }}>
            <RankPill rank={mc.rank} />
            <span className="chip">{mc.group}</span>
            <span className="chip">Criticality {mc.crit}</span>
          </div>
        </div>
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 18 }}>
          {[["แผนก", mc.dept], ["ตำแหน่ง", mc.zone], ["ผู้ผลิต", mc.maker], ["รุ่น", mc.model], ["ติดตั้ง", mc.install], ["กลุ่มเครื่อง", mc.group]].map(([k, v]) =>
          <div key={k}><div className="tiny muted-2">{k}</div><div className="small" style={{ fontWeight: 600 }}>{v}</div></div>
          )}
        </div>
      </div>

      {/* actions */}
      <button className="btn btn-danger btn-xl btn-block" onClick={() => ctx.go("m_report", { mc: mc.code })}>
        <Icon name="wrench" size={20} /> แจ้งซ่อมเครื่องนี้
      </button>
      <button className="btn btn-block" onClick={() => ctx.go("m_checkin", { mc: mc.code })}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)", fontWeight: 600 }}>
        <Icon name="checkCircle" size={18} /> เช็คความพร้อมประจำวัน
      </button>
    </div>);

}

/* ---------------- Recent repair history (own tab) ---------------- */
function RecentHistory({ ctx }) {
  const rows = [...Dm.requests].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (
    <div className="panel">
      <div className="panel-head" style={{ padding: "14px 18px" }}>
        <div className="h-sm">ประวัติการแจ้งซ่อมล่าสุด</div>
        <span className="chip">{rows.length} รายการ</span>
      </div>
      <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {rows.length === 0 && <div className="empty">ยังไม่มีประวัติการแจ้งซ่อม</div>}
        {rows.map((r) =>
        <button key={r.no} className="card card-pad" style={{ textAlign: "left", cursor: "pointer", padding: 14 }}
        onClick={() => ctx.go("m_detail", { reqNo: r.no })}>
            <div className="row between">
              <span className="mono small" style={{ fontWeight: 600 }}>{r.no}</span>
              <JobBadge status={r.status} />
            </div>
            <div className="row gap-sm" style={{ margin: "6px 0" }}><span className="mono tiny" style={{ fontWeight: 600 }}>{r.mc}</span><span className="tiny muted">{r.mcName}</span></div>
            <div className="small" style={{ margin: "0 0 8px", color: "var(--ink)" }}>{r.problem}</div>
            <div className="row between">
              <PriorityTag p={r.priority} />
              <span className="tiny muted-2 mono">{r.date}</span>
            </div>
          </button>
        )}
      </div>
    </div>);

}

/* ---------------- Low spare-part report (from machine) ---------------- */
function LowPartForm({ ctx }) {
  const mc = Dm.machineByCode(ctx.params.mc || Dm.scannedMachine);
  const [code, setCode] = useState("");
  const [remain, setRemain] = useState("");
  const [urgency, setUrgency] = useState("ด่วน");
  if (!mc) return (
    <div className="card card-pad" style={{ textAlign: "center", padding: 40 }}>
      <div className="h-sm">ไม่พบข้อมูลเครื่องจักร</div>
      <div className="muted small" style={{ marginTop: 4 }}>รหัส: {ctx.params.mc || Dm.scannedMachine}</div>
    </div>
  );
  const part = Dm.partByCode(code);
  const lowParts = Dm.parts.filter(p => p.status !== "normal").sort((a,b)=>a.cur-b.cur).slice(0, 6);
  const urgencies = [["ปกติ","low"],["ด่วน","high"],["ด่วนมาก","critical"]];
  const submit = () => {
    if (!code) { ctx.toast("กรุณาเลือกอะไหล่ที่ใกล้หมด", "error"); return; }
    ctx.toast("ส่งแจ้งอะไหล่ใกล้หมดแล้ว · ระบบแจ้งเจ้าหน้าที่คลังให้ตรวจสอบและเตรียมสั่งซื้อ", "mail");
    ctx.go("m_machine", { mc: mc.code });
  };
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 360px", gap: 18, alignItems: "start" }}>
      <div className="stack">
        <div className="card card-pad" style={{ background: "var(--surface-2)", padding: 14 }}>
          <div className="tiny muted-2">เครื่องจักร (เติมอัตโนมัติจาก QR)</div>
          <div className="row between" style={{ marginTop: 4 }}>
            <div><span className="mono" style={{ fontWeight: 600, fontSize: 16 }}>{mc.code}</span> <span className="small">{mc.name}</span></div>
            <RankPill rank={mc.rank} />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>เลือกจากอะไหล่ที่ระบบพบว่าใกล้หมด <span className="muted-2 tiny">(แตะเพื่อเลือก)</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 2 }}>
            {lowParts.map(p => (
              <button key={p.code} onClick={() => { setCode(p.code); setRemain(String(p.cur)); }}
                className="card card-pad" style={{ textAlign: "left", cursor: "pointer", padding: 12,
                  borderColor: code === p.code ? "var(--accent)" : "var(--border)", borderWidth: code === p.code ? 1.5 : 1 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span className="mono small" style={{ fontWeight: 600 }}>{p.code}</span>
                  <StockBadge status={p.status} />
                </div>
                <div className="tiny" style={{ fontWeight: 600, lineHeight: 1.35, minHeight: 32 }}>{p.name}</div>
                <div className="tiny muted-2 mono" style={{ marginTop: 5 }}>คงคลัง {p.cur} · ROP {p.rop}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>หรือเลือกอะไหล่จากรายการทั้งหมด <span className="req">*</span></label>
          <select className="select" value={code} onChange={e => { setCode(e.target.value); const p = Dm.partByCode(e.target.value); setRemain(p ? String(p.cur) : ""); }}>
            <option value="">เลือกอะไหล่...</option>
            {Dm.parts.map(p => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>จำนวนคงเหลือที่หน้างาน</label>
            <input className="input" type="number" min="0" value={remain} onChange={e => setRemain(e.target.value)} placeholder="ประมาณ" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>ผู้แจ้ง</label>
            <input className="input" defaultValue={ctx.guest ? "" : (Dm.roleUser?.[ctx.role]?.name || "")} placeholder="ระบุชื่อผู้แจ้ง" />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>ความเร่งด่วน</label>
          <div className="seg">
            {urgencies.map(([u, k]) => (
              <div key={u} className={"seg-opt" + (urgency === u ? " on-" + k : "")} onClick={() => setUrgency(u)}>{u}</div>
            ))}
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>หมายเหตุ</label>
          <textarea className="textarea" style={{ minHeight: 70 }} placeholder="เช่น เหลือไม่พอสำหรับงานซ่อมรอบหน้า / พบว่าใกล้หมดระหว่างตรวจเครื่อง" />
        </div>
      </div>

      <div className="stack">
        {part ? (
          <div className="panel" style={{ borderColor: part.status === "critical" ? "var(--red)" : "var(--amber)" }}>
            <div className="panel-head" style={{ padding: "12px 16px", background: part.status === "critical" ? "var(--red-bg)" : "var(--amber-bg)" }}>
              <div className="h-sm">สถานะคลังปัจจุบัน</div>
              <StockBadge status={part.status} />
            </div>
            <div className="panel-body stack" style={{ padding: 16 }}>
              <div><div className="mono small" style={{ fontWeight: 600 }}>{part.code}</div><div className="small muted">{part.name}</div></div>
              <div className="divider"></div>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="tiny muted-2">คงคลัง</div><div className="mono" style={{ fontWeight: 700, fontSize: 20, color: part.status === "critical" ? "var(--red-ink)" : "var(--amber-ink)" }}>{part.cur}</div></div>
                <div><div className="tiny muted-2">จุดสั่งซื้อ (ROP)</div><div className="mono" style={{ fontWeight: 700, fontSize: 20 }}>{part.rop}</div></div>
                <div><div className="tiny muted-2">Safety Stock</div><div className="mono small" style={{ fontWeight: 600 }}>{part.safety}</div></div>
                <div><div className="tiny muted-2">Lead Time</div><div className="mono small" style={{ fontWeight: 600 }}>{part.leadTime} วัน</div></div>
              </div>
              {part.cur <= part.rop && <WarnInline />}
            </div>
          </div>
        ) : (
          <div className="card card-pad muted small" style={{ background: "var(--surface-2)", textAlign: "center", padding: 24 }}>
            เลือกอะไหล่เพื่อดูสถานะคลังปัจจุบัน
          </div>
        )}

        <div className="card card-pad" style={{ background: "var(--blue-bg)", border: "1px solid #cdd9e3", display: "flex", gap: 10 }}>
          <span style={{ color: "var(--blue)" }}><Icon name="mail" size={18} /></span>
          <div className="small" style={{ color: "var(--blue-ink)" }}>เมื่อส่ง ระบบจะแจ้ง <b>เจ้าหน้าที่คลัง</b> ให้ตรวจสอบยอดจริง และเพิ่มเข้า <b>รายการต้องสั่งซื้อ</b> หากต่ำกว่า ROP</div>
        </div>

        <button className="btn btn-lg btn-block" style={{ background: "var(--amber)", color: "#fff", borderColor: "var(--amber)" }} onClick={submit}>
          <Icon name="box" size={18} /> ส่งแจ้งอะไหล่ใกล้หมด
        </button>
      </div>
    </div>
  );
}
function WarnInline() {
  return (
    <div className="row gap-sm" style={{ background: "var(--amber-bg)", border: "1px solid #e9dabb", borderRadius: 9, padding: "9px 11px" }}>
      <span style={{ color: "var(--amber)" }}><Icon name="alert" size={15} /></span>
      <span className="tiny" style={{ color: "var(--amber-ink)", fontWeight: 600 }}>ต่ำกว่าหรือเท่าจุดสั่งซื้อแล้ว — ควรเร่งสั่งซื้อ</span>
    </div>
  );
}

/* ---------------- 5.3 Report repair form ---------------- */
function ReportForm({ ctx }) {
  const mc = Dm.machineByCode(ctx.params.mc || Dm.scannedMachine);
  const type = "งานซ่อม";
  const [sev, setSev] = useState("High");
  const [desc, setDesc] = useState("");
  const [reporter, setReporter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState([]); // [{ id, file, url }]
  const fileRef = useRef(null);
  const sevs = [["Low", "Low"], ["Medium", "Medium"], ["High", "High"], ["Critical", "Critical"]];
  const MAX_PHOTOS = 6;

  // ปล่อย object URL ทิ้งตอนออกจากหน้า (กัน memory leak)
  const photosRef = useRef(photos); photosRef.current = photos;
  useEffect(() => () => { photosRef.current.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch {} }); }, []);

  const onPickPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { ctx.toast("แนบรูปได้สูงสุด " + MAX_PHOTOS + " รูป", "error"); return; }
    const add = files.slice(0, room).map((f) => ({
      id: (crypto?.randomUUID?.() || String(Date.now()) + Math.random()),
      file: f, url: URL.createObjectURL(f),
    }));
    setPhotos((prev) => [...prev, ...add]);
  };
  const removePhoto = (id) => setPhotos((prev) => {
    const t = prev.find((p) => p.id === id);
    if (t) { try { URL.revokeObjectURL(t.url); } catch {} }
    return prev.filter((p) => p.id !== id);
  });

  if (!mc) return (
    <div className="card card-pad" style={{ textAlign: "center", padding: 40 }}>
      <div className="h-sm">ไม่พบข้อมูลเครื่องจักร</div>
      <div className="muted small" style={{ marginTop: 4 }}>รหัส: {ctx.params.mc || Dm.scannedMachine}</div>
    </div>
  );

  const submit = async () => {
    if (submitting) return;
    if (!desc.trim()) { ctx.toast("กรุณากรอกอาการเสีย", "error"); return; }
    if (typeof window.DATA?.createRequest === "function") {
      setSubmitting(true);
      try {
        const result = await window.DATA.createRequest({ machineCode: mc.code, problem: desc.trim(), priority: sev, reporterName: reporter.trim() || null, type });
        if (photos.length && typeof window.DATA.uploadRequestPhotos === "function") {
          try { await window.DATA.uploadRequestPhotos(result, photos.map((p) => p.file)); }
          catch (e) { console.error("[photo-upload] error", e); ctx.toast("บันทึกใบแจ้งแล้ว แต่อัปโหลดรูปไม่สำเร็จ", "error"); }
        }
        if (typeof Dm.refresh === "function") { await Dm.refresh(); window.dispatchEvent(new Event("mt-data-refresh")); }
        ctx.toast("ส่งใบแจ้งซ่อมแล้ว · " + result, "mail");
        ctx.guest ? ctx.go("m_machine", { mc: mc.code }) : ctx.go("m_requests");
      } catch (err) {
        console.error("[report-submit] error", err);
        ctx.toast("ส่งใบแจ้งซ่อมไม่สำเร็จ", "error");
      } finally { setSubmitting(false); }
    } else {
      ctx.toast("ส่งใบแจ้งซ่อมแล้ว · ระบบส่งอีเมลแจ้งทีมช่างและหัวหน้างาน", "mail");
      ctx.guest ? ctx.go("m_machine", { mc: mc.code }) : ctx.go("m_requests");
    }
  };
  return (
    <div>
      <div className="card card-pad" style={{ marginBottom: 14, background: "var(--surface-2)" }}>
        <div className="tiny muted-2">เครื่องจักร (เติมอัตโนมัติจาก QR)</div>
        <div className="row between" style={{ marginTop: 4 }}>
          <div><span className="mono" style={{ fontWeight: 600, fontSize: 16 }}>{mc.code}</span> <span className="small">{mc.name}</span></div>
          <RankPill rank={mc.rank} />
        </div>
      </div>

      <div className="field">
        <label>อาการเสีย <span className="req">*</span></label>
        <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)}
        placeholder="อธิบายอาการที่พบ เช่น Heater element broken, temperature dropped" />
      </div>

      <div className="field">
        <label>ความรุนแรง</label>
        <div className="seg">
          {sevs.map(([v, l]) =>
          <div key={v} className={"seg-opt" + (sev === v ? " on-" + v.toLowerCase() : "")} onClick={() => setSev(v)}>{l}</div>
          )}
        </div>
      </div>

      <div className="field">
        <label>แนบรูปถ่าย {photos.length > 0 && <span className="muted-2">({photos.length}/{MAX_PHOTOS})</span>}</label>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple
          onChange={onPickPhotos} style={{ display: "none" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {photos.map((p) =>
          <div key={p.id} style={{ position: "relative", width: 84, height: 84, borderRadius: 11, overflow: "hidden", border: "1px solid var(--border)" }}>
            <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div onClick={() => removePhoto(p.id)} title="ลบรูป"
              style={{ position: "absolute", top: 3, right: 3, width: 22, height: 22, borderRadius: "50%", background: "rgba(17,17,17,.72)",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon name="x" size={13} />
            </div>
          </div>
          )}
          {photos.length < MAX_PHOTOS &&
          <div onClick={() => fileRef.current && fileRef.current.click()}
            style={{ width: 84, height: 84, borderRadius: 11, border: "1.5px dashed var(--border-2)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "var(--ink-3)", gap: 4, cursor: "pointer" }}>
            <Icon name="camera" size={22} /><span className="tiny">ถ่ายรูป</span>
          </div>}
          {photos.length === 0 &&
          <div className="hint" style={{ alignSelf: "center", flex: 1, minWidth: 140 }}>แนบรูปหน้างานเพื่อช่วยให้ช่างประเมินได้เร็วขึ้น</div>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
        <div className="field">
          <label>ผู้แจ้ง</label>
          <input className="input" value={reporter} onChange={(e) => setReporter(e.target.value)} placeholder="ระบุชื่อผู้แจ้ง" />
        </div>
        <div className="field">
          <label>แผนก</label>
          <input className="input" placeholder="ระบุแผนก" />
        </div>
      </div>

      <div className="card card-pad" style={{ background: "var(--blue-bg)", border: "1px solid #c7dbf6", display: "flex", gap: 10, marginBottom: 14 }}>
        <span style={{ color: "var(--blue)" }}><Icon name="mail" size={18} /></span>
        <div className="small" style={{ color: "var(--blue-ink)" }}>เมื่อส่ง ระบบจะส่งแจ้งทีม MT ผ่านทาง TELEGRAM โดยอัตโนมัติ</div>
      </div>

      <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
        <Icon name="check" size={18} /> {submitting ? "กำลังส่ง..." : "ส่งใบแจ้งซ่อม"}
      </button>
    </div>);

}

/* ---------------- 5.6 Technician queue ---------------- */
const PRI_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
function TechQueue({ ctx }) {
  const [tab, setTab] = useState("open");
  const open = Dm.requests.filter((r) => r.status === "Waiting" || r.status === "In Progress");
  const returned = Dm.requests.filter((r) => r.status === "Returned");
  const done = Dm.requests.filter((r) => r.status === "Completed" || r.status === "Resubmitted");
  const list = (tab === "open" ? open : tab === "returned" ? returned : done).slice().sort((a, b) => PRI_ORDER[a.priority] - PRI_ORDER[b.priority]);
  return (
    <div>
      <div className="seg" style={{ marginBottom: 14 }}>
        <div className={"seg-opt" + (tab === "open" ? " on-medium" : "")} onClick={() => setTab("open")}>รอ/กำลังทำ ({open.length})</div>
        <div className={"seg-opt" + (tab === "returned" ? " on-critical" : "")} onClick={() => setTab("returned")} style={{ position: "relative" }}>
          ส่งกลับซ่อม
          {returned.length > 0
            ? <span style={{ marginLeft: 6, background: tab === "returned" ? "#fff" : "var(--red)", color: tab === "returned" ? "var(--red)" : "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{returned.length}</span>
            : <span style={{ marginLeft: 6, opacity: 0.5 }}>0</span>}
        </div>
        <div className={"seg-opt" + (tab === "done" ? " on-low" : "")} onClick={() => setTab("done")}>เสร็จแล้ว ({done.length})</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))", gap: 14 }}>
        {list.map((r) => {
          const mc = Dm.machineByCode(r.mc);
          const isReturned = r.status === "Returned";
          const hot = isReturned || r.priority === "Critical" || (mc && mc.rank === "A" && r.status !== "Completed" && r.status !== "Resubmitted");
          return (
            <div key={r.no} className="card" style={{ overflow: "hidden",
              borderColor: hot ? "var(--red)" : "var(--border)", borderWidth: hot ? 1.5 : 1 }}>
              {isReturned
                ? <div style={{ background: "var(--red)", color: "#fff", padding: "5px 14px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="x" size={13} /> ฝ่ายผลิตส่งงานคืน{r.reviewRound > 0 ? ` (รอบที่ ${r.reviewRound})` : ""} — กรุณาแก้ไขผลซ่อม
                  </div>
                : hot && <div style={{ background: "var(--red)", color: "#fff", padding: "5px 14px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="alert" size={13} /> งานวิกฤต — ต้องดำเนินการทันที
                  </div>}
              <div className="card-pad">
                <div className="row between">
                  <span className="mono small" style={{ fontWeight: 600 }}>{r.no}</span>
                  <PriorityTag p={r.priority} />
                </div>
                <div className="row" style={{ margin: "8px 0 6px", gap: 7 }}>
                  <span className="mono" style={{ fontWeight: 600 }}>{r.mc}</span>
                  <span className="small muted">{r.mcName}</span>
                  {mc && <RankPill rank={mc.rank} />}
                </div>
                <div className="small" style={{ marginBottom: isReturned && r.prodReason ? 6 : 12 }}>{r.problem}</div>
                {isReturned && r.prodReason && <div className="small" style={{ marginBottom: 12, color: "var(--red)", background: "var(--red-bg,#fff5f5)", borderRadius: 7, padding: "5px 9px" }}>เหตุผล: {r.prodReason}</div>}
                <div className="row between">
                  <span className="tiny muted-2 mono"><Icon name="clock" size={12} /> {r.date}</span>
                  {isReturned ?
                  <button className="btn btn-sm btn-danger" onClick={() => ctx.go("m_repair", { reqNo: r.no })}>แก้ไขผลซ่อม <Icon name="chevR" size={14} /></button> :
                  r.status === "In Progress" ?
                  <button className="btn btn-sm btn-accent" onClick={() => ctx.go("m_repair", { reqNo: r.no })}>บันทึกผลซ่อม <Icon name="chevR" size={14} /></button> :
                  tab === "open" ?
                  <button className="btn btn-sm btn-primary" onClick={() => {ctx.toast("รับงาน " + r.no + " แล้ว");ctx.go("m_repair", { reqNo: r.no });}}>กดรับงาน</button> :
                  <button className="btn btn-sm" onClick={() => ctx.go("m_detail", { reqNo: r.no })}>ดูรายละเอียด</button>}
                </div>
              </div>
            </div>);

        })}
        {list.length === 0 && <div className="empty card">ไม่มีงานในสถานะนี้</div>}
      </div>
    </div>);

}

/* ---------------- 5.7 Repair form (technician) ---------------- */
function RepairForm({ ctx }) {
  const r = Dm.requests.find((x) => x.no === ctx.params.reqNo) || null;
  const existingRep = Dm.repairs[ctx.params.reqNo] || null;
  const [cat, setCat] = useState("Mechanical");
  const [cause, setCause] = useState("เสื่อมสภาพ");
  const [rootInput, setRootInput] = useState(existingRep?.root || "");
  const [actionInput, setActionInput] = useState(existingRep?.action || "");
  const [startTime, setStartTime] = useState("13:15");
  const [endTime, setEndTime] = useState("15:30");
  const [rows, setRows] = useState([{ code: "", qty: 1 }]);
  const [saving, setSaving] = useState(false);
  const cats = ["Electrical", "Mechanical", "Hydraulic", "Pneumatic", "Electronic", "Other"];
  const causes = ["ใช้งานผิดวิธี", "เสื่อมสภาพ", "ติดตั้งเพิ่ม"];
  const parts = Dm.parts;
  const total = rows.reduce((s, row) => {const p = Dm.partByCode(row.code);return s + (p ? p.price * row.qty : 0);}, 0);
  const setRow = (i, patch) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, ...patch } : x));
  const addRow = () => setRows((rs) => [...rs, { code: "", qty: 1 }]);
  const delRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i));

  if (!r) return (
    <div className="card card-pad" style={{ textAlign: "center", padding: 40 }}>
      <div className="h-sm">ไม่พบใบแจ้งซ่อม</div>
      <div className="muted small" style={{ marginTop: 6 }}>กรุณาเลือกงานจากคิวงาน</div>
      <button className="btn btn-sm" style={{ marginTop: 14 }} onClick={() => ctx.go("m_queue")}>กลับคิวงาน</button>
    </div>
  );

  const calcHrs = (s, e) => {
    if (!s || !e) return 0;
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    return Math.max(0, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100);
  };

  const save = async () => {
    if (saving) return;
    if (!rootInput.trim() || !actionInput.trim()) {
      ctx.toast("กรุณากรอกสาเหตุและวิธีแก้ไข", "error");
      return;
    }
    const usedParts = rows.filter((row) => row.code).map((row) => {
      const p = Dm.partByCode(row.code);
      return { code: row.code, qty: row.qty, unit: p?.price };
    });
    const repair = { root: rootInput.trim(), action: actionInput.trim(), hrs: calcHrs(startTime, endTime), verify: "Approved" };
    if (typeof window.DATA?.saveRepair === "function") {
      setSaving(true);
      try {
        await window.DATA.saveRepair(r.no, repair, usedParts);
        if (typeof Dm.refresh === "function") { await Dm.refresh(); window.dispatchEvent(new Event("mt-data-refresh")); }
        ctx.toast("บันทึกผลซ่อมแล้ว · ระบบตัดสต็อกอะไหล่อัตโนมัติ", "mail");
        ctx.go("m_queue");
      } catch (err) {
        console.error("[repair-save] error", err);
        ctx.toast("บันทึกไม่สำเร็จ", "error");
      } finally { setSaving(false); }
    } else {
      ctx.toast("บันทึกผลซ่อมแล้ว · ระบบตัดสต็อกอะไหล่อัตโนมัติ", "mail");
      ctx.go("m_queue");
    }
  };

  return (
    <div>
      {r.status === "Returned" && <div className="card card-pad" style={{ marginBottom: 14, background: "var(--red-bg,#fff5f5)", border: "1.5px solid var(--red)", borderRadius: 11 }}>
        <div className="row gap-sm" style={{ marginBottom: r.prodReason ? 6 : 0 }}><Icon name="x" size={16} style={{ color: "var(--red)", flex: "none" }} /><span className="small" style={{ fontWeight: 700, color: "var(--red)" }}>ฝ่ายผลิตส่งงานคืน — กรุณาแก้ไขและส่งใหม่</span></div>
        {r.prodReason && <div className="small muted" style={{ paddingLeft: 24 }}>เหตุผล: {r.prodReason}</div>}
      </div>}
      <div className="card card-pad" style={{ marginBottom: 14, background: "var(--surface-2)" }}>
        <div className="row between">
          <span className="mono" style={{ fontWeight: 600 }}>{r.no}</span>
          <JobBadge status={r.status} />
        </div>
        <div className="small" style={{ marginTop: 6 }}><span className="mono" style={{ fontWeight: 600 }}>{r.mc}</span> · {r.problem}</div>
      </div>

      <div className="field">
        <label>หมวดปัญหา</label>
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="field"><label>สาเหตุหลัก <span className="req">*</span></label><textarea className="textarea" style={{ minHeight: 70 }} value={rootInput} onChange={(e) => setRootInput(e.target.value)} placeholder="เช่น O-ring seal degraded causing pressure drop" /></div>
      <div className="field"><label>วิธีการแก้ปัญหา <span className="req">*</span></label><textarea className="textarea" style={{ minHeight: 70 }} value={actionInput} onChange={(e) => setActionInput(e.target.value)} placeholder="อธิบายการซ่อมที่ทำ" /></div>

      <div className="field">
        <label>ประเภทสาเหตุ</label>
        <div className="seg">{causes.map((c) => <div key={c} className={"seg-opt" + (cause === c ? " on-medium" : "")} style={{ fontSize: 13 }} onClick={() => setCause(c)}>{c}</div>)}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
        <div className="field"><label>เวลาเริ่ม</label><input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
        <div className="field"><label>เวลาเสร็จ</label><input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-head" style={{ padding: "12px 14px" }}>
          <div className="h-sm">อะไหล่ที่ใช้</div>
          <button className="btn btn-sm" onClick={addRow}><Icon name="plus" size={14} /> เพิ่ม</button>
        </div>
        <div style={{ padding: 12, display: "grid", gap: 10 }}>
          {rows.map((row, i) => {
            const p = Dm.partByCode(row.code);
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 64px 32px", gap: 8, alignItems: "center" }}>
                <select className="select" value={row.code} onChange={(e) => setRow(i, { code: e.target.value })}>
                  <option value="">เลือกอะไหล่...</option>
                  {parts.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
                </select>
                <input className="input" type="number" min="1" value={row.qty} onChange={(e) => setRow(i, { qty: +e.target.value || 1 })} />
                <button className="icon-btn" style={{ width: 32, height: 38 }} onClick={() => delRow(i)}><Icon name="trash" size={15} /></button>
                {p && <div className="tiny muted-2 mono" style={{ gridColumn: "1 / -1", marginTop: -4 }}>คงคลัง {p.cur} · ฿{Dm.fmtNum(p.price)}/หน่วย → ฿{Dm.fmtNum(p.price * row.qty)}</div>}
              </div>);

          })}
        </div>
        <div className="panel-head" style={{ borderTop: "1px solid var(--border)", borderBottom: 0, background: "var(--surface-2)" }}>
          <span className="small muted">ต้นทุนอะไหล่รวม</span>
          <span className="mono" style={{ fontWeight: 700, fontSize: 18 }}>฿{Dm.fmtNum(total)}</span>
        </div>
      </div>

      <div className="card card-pad" style={{ background: "var(--amber-bg)", border: "1px solid #f0dcb4", display: "flex", gap: 10, marginBottom: 14 }}>
        <span style={{ color: "var(--amber)" }}><Icon name="alert" size={18} /></span>
        <div className="small" style={{ color: "var(--amber-ink)" }}>การบันทึกจะตัดสต็อกอะไหล่ออกจากคลังโดยอัตโนมัติ และปิดงานทันที</div>
      </div>

      <button className="btn btn-success btn-lg btn-block" onClick={save} disabled={saving}>
        <Icon name="check" size={18} /> {saving ? "กำลังบันทึก..." : "บันทึกผลการซ่อม"}
      </button>
    </div>);

}

/* ---------------- Mobile request list (operator: my requests / technician: all requests) ---------------- */
function MobileRequests({ ctx }) {
  const [f, setF] = useState("all");
  const [deletingNo, setDeletingNo] = useState(null);
  const [completingNo, setCompletingNo] = useState(null);
  const filters = [["all", "ทั้งหมด"], ["Waiting", "รอ"], ["In Progress", "กำลังซ่อม"], ["Completed", "เสร็จ"]];
  const list = Dm.requests.filter((r) => f === "all" || r.status === f);
  const isTech = ctx.role === "Technician";

  const removeRequest = async (e, requestNo) => {
    e.stopPropagation();
    if (deletingNo) return;
    if (!window.DATA || typeof window.DATA.deleteRequest !== "function") {
      ctx.toast("Delete API is not ready", "error");
      return;
    }
    if (!window.confirm("Delete request " + requestNo + "?")) return;
    setDeletingNo(requestNo);
    try {
      await window.DATA.deleteRequest(requestNo);
      if (typeof Dm.refresh === "function") await Dm.refresh();
      window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast("ลบใบแจ้ง " + requestNo + " แล้ว", "check");
    } catch (error) {
      console.error("[request-delete] API error", error);
      ctx.toast("ลบไม่สำเร็จ", "error");
    } finally {
      setDeletingNo(null);
    }
  };

  const completeRequest = async (e, requestNo) => {
    e.stopPropagation();
    if (completingNo) return;
    if (!window.DATA || typeof window.DATA.completeRequest !== "function") {
      const req = Dm.requests.find((r) => r.no === requestNo);
      if (req) { req.status = "Completed"; req.finish = new Date().toISOString(); }
      window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast("ปิดงาน " + requestNo + " เสร็จสิ้น", "check");
      return;
    }
    setCompletingNo(requestNo);
    try {
      await window.DATA.completeRequest(requestNo);
      if (typeof Dm.refresh === "function") await Dm.refresh();
      window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast("ปิดงาน " + requestNo + " เสร็จสิ้น", "check");
    } catch (error) {
      console.error("[request-complete] API error", error);
      ctx.toast("ปิดงานไม่สำเร็จ", "error");
    } finally {
      setCompletingNo(null);
    }
  };

  return (
    <div>
      <div className="row wrap gap-sm" style={{ marginBottom: 14 }}>
        {filters.map(([v, l]) =>
        <span key={v} className={"chip chip-btn" + (f === v ? " on" : "")} onClick={() => setF(v)}>{l}</span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))", gap: 12 }}>
        {list.map((r) =>
        <div key={r.no} className="card card-pad" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => ctx.go("m_detail", { reqNo: r.no })}>
            <div className="row between" style={{ gap: 8 }}>
              <span className="mono small" style={{ fontWeight: 600 }}>{r.no}</span>
              <div className="row gap-sm" onClick={(e) => e.stopPropagation()}>
                <JobBadge status={r.status} />
                {isTech && r.status === "In Progress" && (
                  <button type="button" className="btn btn-success btn-sm" style={{ padding: "6px 12px", minHeight: 0 }}
                    disabled={completingNo === r.no} onClick={(e) => completeRequest(e, r.no)}>
                    {completingNo === r.no ? "กำลังปิด..." : "เสร็จสิ้น"}
                  </button>
                )}
                <button type="button" className="btn" style={{ padding: "6px 10px", minHeight: 0 }} disabled={deletingNo === r.no} onClick={(e) => removeRequest(e, r.no)}>
                  {deletingNo === r.no ? "กำลังลบ..." : "ลบ"}
                </button>
              </div>
            </div>
            <div className="small" style={{ margin: "7px 0" }}><span className="mono" style={{ fontWeight: 600 }}>{r.mc}</span> · {r.problem}</div>
            <div className="row between"><PriorityTag p={r.priority} /><span className="tiny muted-2 mono">{r.date}</span></div>
          </div>
        )}
      </div>
    </div>);

}

/* ---------------- Mobile request detail (compact) ---------------- */
function MobileDetail({ ctx }) {
  const r = Dm.requests.find((x) => x.no === ctx.params.reqNo) || null;
  if (!r) return (
    <div className="card card-pad" style={{ textAlign: "center", padding: 40 }}>
      <div className="h-sm">ไม่พบใบแจ้งซ่อม</div>
    </div>
  );
  const rep = Dm.repairs[r.no];
  const use = Dm.usage[r.no] || [];
  const total = use.reduce((s, u) => s + u.unit * u.qty, 0);
  const steps = buildTimeline(r, rep);
  // Production approval status — shared, persisted via DATA.prodStatus (localStorage)
  const prodInfo = Dm.prodStatus(r.no);
  return (
    <div>
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="row between"><span className="mono" style={{ fontWeight: 600, fontSize: 17 }}>{r.no}</span><JobBadge status={r.status} /></div>
        <div className="row gap-sm" style={{ margin: "10px 0" }}><span className="mono" style={{ fontWeight: 600 }}>{r.mc}</span><span className="small muted">{r.mcName}</span><PriorityTag p={r.priority} /></div>
        <div className="small" style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>{r.problem}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
          <div><div className="tiny muted-2">ผู้แจ้ง</div><div className="small">{r.reporter}</div></div>
          <div><div className="tiny muted-2">แผนก</div><div className="small">{r.dept}</div></div>
          <div><div className="tiny muted-2">เวลาแจ้ง</div><div className="small mono">{r.date}</div></div>
          <div><div className="tiny muted-2">Downtime</div><div className="small mono">{r.downtime != null ? r.downtime + " ชม." : "—"}</div></div>
        </div>
      </div>
      {r.photos && r.photos.length > 0 &&
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="h-sm" style={{ marginBottom: 10 }}>รูปหน้างาน ({r.photos.length})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {r.photos.map((p, i) => {
            const url = /^https?:/.test(p) ? p : (window.API_BASE || "") + p;
            return (
            <a key={i} href={url} target="_blank" rel="noreferrer"
              style={{ width: 90, height: 90, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", display: "block" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </a>);
          })}
        </div>
      </div>}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="h-sm" style={{ marginBottom: 14 }}>สถานะการดำเนินงาน</div>
        <Timeline steps={steps} />
        {(r.status === "Completed" || r.status === "Resubmitted") &&
        <div style={{ marginTop: 4, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: prodInfo.dot, color: "#fff" }}>
              {prodInfo.icon ? <Icon name={prodInfo.icon} size={12} /> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }}></span>}
            </span>
            <div>
              <div className="tl-title">สถานะการอนุมัติ (ฝ่ายผลิต)</div>
              <span className={"badge " + prodInfo.cls} style={{ marginTop: 5 }}><span className="dot"></span>{prodInfo.th}</span>
              {prodInfo.reason && <div className="small muted" style={{ marginTop: 6 }}>หมายเหตุ: {prodInfo.reason}</div>}
            </div>
          </div>
        }
      </div>
      {rep &&
      <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div className="h-sm" style={{ marginBottom: 10 }}>ผลการซ่อม</div>
          <div className="stack small">
            <div><span className="muted-2">ช่าง: </span>{rep.tech}</div>
            <div><span className="muted-2">หมวดปัญหา: </span>{rep.cat}</div>
            <div><span className="muted-2">สาเหตุราก: </span>{rep.root}</div>
            <div><span className="muted-2">วิธีแก้: </span>{rep.action}</div>
          </div>
        </div>
      }
      {use.length > 0 &&
      <div className="panel">
          <div className="panel-head" style={{ padding: "12px 14px" }}><div className="h-sm">อะไหล่ที่ใช้</div><span className="mono" style={{ fontWeight: 700 }}>฿{Dm.fmtNum(total)}</span></div>
          <div style={{ padding: 12, display: "grid", gap: 8 }}>
            {use.map((u, i) =>
          <div key={i} className="row between small"><span><span className="mono" style={{ fontWeight: 600 }}>{u.code}</span> {u.name} ×{u.qty}</span><span className="mono">฿{Dm.fmtNum(u.unit * u.qty)}</span></div>
          )}
          </div>
        </div>
      }
    </div>);

}

/* timeline builder shared */
function buildTimeline(r, rep) {
  const steps = [
  { title: "แจ้งซ่อม", desc: r.reporter, time: r.date, state: "done" }];

  const accepted = r.status !== "Waiting";
  steps.push({ title: "รับงาน", desc: r.acceptedBy || (rep ? rep.tech : "—"), time: accepted ? (r.acceptedAt || r.start) : "", state: accepted ? "done" : "" });
  const repairing = r.status === "In Progress";
  const repaired = r.status === "Completed" || r.status === "Returned" || r.status === "Resubmitted";
  steps.push({ title: "ซ่อม", desc: rep ? rep.action : "", time: r.finish || "", state: repaired ? "done" : repairing ? "active" : "" });
  if (r.status === "Returned") {
    steps.push({ title: "ส่งกลับซ่อม", desc: r.prodReason || "ฝ่ายผลิตส่งงานคืน", time: "", state: "warn" });
  }
  return steps;
}

Object.assign(window, { LoginScreen, MachineScreen, RecentHistory, LowPartForm, ReportForm, TechQueue, RepairForm, MobileRequests, MobileDetail, buildTimeline });
