/* ============================================================
   MT_System — Field / mobile screens
   Login, Machine(post-QR), Report form, Technician queue,
   Repair form, mobile request list & detail
   ============================================================ */
const Dm = window.DATA;

/* ---------------- 5.1 Login ---------------- */
function LoginScreen({ ctx }) {
  const [role, setRole] = useState("Operator");
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const roles = ["Operator", "Technician", "Supervisor", "Store Keeper", "Manager", "Admin"];
  const homeFor = {
    "Operator": "m_machine", "Technician": "m_queue", "Supervisor": "d_verify",
    "Store Keeper": "d_master", "Manager": "d_dashboard", "Admin": "d_admin"
  };
  const submit = (e) => {e.preventDefault();ctx.login(role, homeFor[role]);};
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>
      {/* left brand panel — light cream */}
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
      {/* right form */}
      <div style={{ flex: "0 0 clamp(380px, 38%, 560px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", background: "var(--surface)" }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 30 }}>
            <div className="h-lg">เข้าสู่ระบบ</div>
            <div className="muted small" style={{ marginTop: 4 }}>ยินดีต้อนรับ — กรุณาเข้าสู่ระบบเพื่อใช้งาน</div>
          </div>
          <div className="field">
            <label>ชื่อผู้ใช้ (Username)</label>
            <input className="input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="เช่น somchai" />
          </div>
          <div className="field">
            <label>รหัสผ่าน (Password)</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field">
            <label>เข้าสู่ระบบในบทบาท (Role)</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r} — {Dm.roleLabelTH[r]}</option>)}
            </select>
            <div className="hint">ตัวอย่าง prototype — เลือกบทบาทเพื่อดูเมนูและสิทธิ์ที่ต่างกัน</div>
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" style={{ marginTop: 8 }}>
            เข้าสู่ระบบ <Icon name="chevR" size={17} />
          </button>
          <div className="tiny muted-2" style={{ textAlign: "center", marginTop: 22, letterSpacing: ".04em" }}>v1.0 · Industrial Maintenance System</div>
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
    </div>
  );
  const hist = Dm.requestsForMachine(mc.code);
  const running = mc.status === "Running";
  return (
    <div className="grid" style={{ gridTemplateColumns: "1.15fr .85fr", alignItems: "start" }}>
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
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {[["แผนก", mc.dept], ["ตำแหน่ง", mc.zone], ["ผู้ผลิต", mc.maker], ["รุ่น", mc.model], ["ติดตั้ง", mc.install], ["กลุ่มเครื่อง", mc.group]].map(([k, v]) =>
          <div key={k}><div className="tiny muted-2">{k}</div><div className="small" style={{ fontWeight: 600 }}>{v}</div></div>
          )}
        </div>
      </div>

      <div className="stack">
        <div style={{ display: "grid", gap: 11 }}>
          <button className="btn btn-danger btn-xl btn-block" onClick={() => ctx.go("m_report", { mc: mc.code })}>
            <Icon name="wrench" size={20} /> แจ้งซ่อมเครื่องนี้
          </button>
          <button className="btn btn-xl btn-block" style={{ borderColor: "var(--amber)", color: "var(--amber-ink)", background: "var(--amber-bg)" }}
          onClick={() => ctx.go("m_lowpart", { mc: mc.code })}>
            <Icon name="box" size={20} /> แจ้งอะไหล่ใกล้หมด
          </button>
        </div>

        <div className="panel">
          <div className="panel-head" style={{ padding: "14px 18px" }}>
            <div className="h-sm">ประวัติการแจ้งซ่อมล่าสุด</div>
            <span className="chip">{hist.length} รายการ</span>
          </div>
          <div style={{ padding: 14, display: "grid", gap: 10 }}>
            {hist.length === 0 && <div className="empty">ยังไม่มีประวัติการแจ้งซ่อม</div>}
            {hist.map((r) =>
            <button key={r.no} className="card card-pad" style={{ textAlign: "left", cursor: "pointer", padding: 14 }}
            onClick={() => ctx.go("m_detail", { reqNo: r.no })}>
                <div className="row between">
                  <span className="mono small" style={{ fontWeight: 600 }}>{r.no}</span>
              <JobBadge status={r.status} />
            </div>
            <div className="small" style={{ margin: "7px 0", color: "var(--ink)" }}>{r.problem}</div>
            <div className="row between">
              <PriorityTag p={r.priority} />
              <span className="tiny muted-2 mono">{r.date}</span>
            </div>
          </button>
            )}
          </div>
        </div>
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
            <input className="input" defaultValue="Somchai K." />
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
  const [type, setType] = useState("งานซ่อม");
  const [sev, setSev] = useState("High");
  const [desc, setDesc] = useState("");
  const [reporter, setReporter] = useState("Somchai K.");
  const [submitting, setSubmitting] = useState(false);
  const sevs = [["Low", "Low"], ["Medium", "Medium"], ["High", "High"], ["Critical", "Critical"]];

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
        if (typeof Dm.refresh === "function") { await Dm.refresh(); window.dispatchEvent(new Event("mt-data-refresh")); }
        ctx.toast("ส่งใบแจ้งซ่อมแล้ว · " + result, "mail");
        ctx.go("m_requests");
      } catch (err) {
        console.error("[report-submit] error", err);
        ctx.toast("ส่งใบแจ้งซ่อมไม่สำเร็จ", "error");
      } finally { setSubmitting(false); }
    } else {
      ctx.toast("ส่งใบแจ้งซ่อมแล้ว · ระบบส่งอีเมลแจ้งทีมช่างและหัวหน้างาน", "mail");
      ctx.go("m_requests");
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
        <label>ประเภทงาน</label>
        <div className="seg" style={{ gridAutoColumns: "1fr 1fr" }}>
          {["งานซ่อม", "งานสร้าง"].map((t) =>
          <div key={t} className={"seg-opt" + (type === t ? " on-medium" : "")} onClick={() => setType(t)}>{t}</div>
          )}
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
        <label>แนบรูปถ่าย</label>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 84, height: 84, borderRadius: 11, border: "1.5px dashed var(--border-2)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", color: "var(--ink-3)", gap: 4, cursor: "pointer" }}
          onClick={() => ctx.toast("เปิดกล้อง (prototype)")}>
            <Icon name="camera" size={22} /><span className="tiny">ถ่ายรูป</span>
          </div>
          <div className="hint" style={{ alignSelf: "center" }}>แนบรูปหน้างานเพื่อช่วยให้ช่างประเมินได้เร็วขึ้น</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
        <div className="field">
          <label>ผู้แจ้ง</label>
          <input className="input" value={reporter} onChange={(e) => setReporter(e.target.value)} />
        </div>
        <div className="field">
          <label>แผนก</label>
          <input className="input" defaultValue={mc.dept} />
        </div>
      </div>

      <div className="card card-pad" style={{ background: "var(--blue-bg)", border: "1px solid #c7dbf6", display: "flex", gap: 10, marginBottom: 14 }}>
        <span style={{ color: "var(--blue)" }}><Icon name="mail" size={18} /></span>
        <div className="small" style={{ color: "var(--blue-ink)" }}>เมื่อส่ง ระบบจะส่งอีเมล/LINE แจ้งทีมช่างและหัวหน้างาน MT โดยอัตโนมัติ</div>
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
  const done = Dm.requests.filter((r) => r.status === "Completed");
  const list = (tab === "open" ? open : done).slice().sort((a, b) => PRI_ORDER[a.priority] - PRI_ORDER[b.priority]);
  return (
    <div>
      <div className="seg" style={{ marginBottom: 14 }}>
        <div className={"seg-opt" + (tab === "open" ? " on-medium" : "")} onClick={() => setTab("open")}>รอ/กำลังทำ ({open.length})</div>
        <div className={"seg-opt" + (tab === "done" ? " on-low" : "")} onClick={() => setTab("done")}>เสร็จแล้ว ({done.length})</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))", gap: 14 }}>
        {list.map((r) => {
          const mc = Dm.machineByCode(r.mc);
          const hot = r.priority === "Critical" || mc && mc.rank === "A" && r.status !== "Completed";
          return (
            <div key={r.no} className="card" style={{ overflow: "hidden",
              borderColor: hot ? "var(--red)" : "var(--border)", borderWidth: hot ? 1.5 : 1 }}>
              {hot && <div style={{ background: "var(--red)", color: "#fff", padding: "5px 14px", fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="alert" size={13} /> งานวิกฤต — ต้องดำเนินการทันที</div>}
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
                <div className="small" style={{ marginBottom: 12 }}>{r.problem}</div>
                <div className="row between">
                  <span className="tiny muted-2 mono"><Icon name="clock" size={12} /> {r.date}</span>
                  {r.status === "In Progress" ?
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
  const [cat, setCat] = useState("Mechanical");
  const [cause, setCause] = useState("เสื่อมสภาพ");
  const [rootInput, setRootInput] = useState("");
  const [actionInput, setActionInput] = useState("");
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
    const repair = { root: rootInput.trim(), action: actionInput.trim(), hrs: calcHrs(startTime, endTime), verify: "Pending" };
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
      <div className="field"><label>สาเหตุราก (Root Cause) <span className="req">*</span></label><textarea className="textarea" style={{ minHeight: 70 }} value={rootInput} onChange={(e) => setRootInput(e.target.value)} placeholder="เช่น O-ring seal degraded causing pressure drop" /></div>
      <div className="field"><label>วิธีแก้ไข (Corrective Action) <span className="req">*</span></label><textarea className="textarea" style={{ minHeight: 70 }} value={actionInput} onChange={(e) => setActionInput(e.target.value)} placeholder="อธิบายการซ่อมที่ทำ" /></div>

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
        <div className="small" style={{ color: "var(--amber-ink)" }}>การบันทึกจะตัดสต็อกอะไหล่ออกจากคลังโดยอัตโนมัติ และส่งให้หัวหน้างานตรวจรับ</div>
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
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="h-sm" style={{ marginBottom: 14 }}>สถานะการดำเนินงาน</div>
        <Timeline steps={steps} />
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
  const repaired = r.status === "Completed";
  steps.push({ title: "ซ่อม", desc: rep ? rep.action : "", time: r.finish || "", state: repaired ? "done" : repairing ? "active" : "" });
  const approved = rep && rep.verify === "Approved";
  steps.push({ title: "ตรวจรับ", desc: approved ? "โดย " + rep.by : "รอหัวหน้าตรวจรับ", time: "", state: approved ? "done" : "" });
  return steps;
}

Object.assign(window, { LoginScreen, MachineScreen, LowPartForm, ReportForm, TechQueue, RepairForm, MobileRequests, MobileDetail, buildTimeline });
