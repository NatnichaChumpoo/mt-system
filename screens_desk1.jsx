/* ============================================================
   MT_System — Desktop work screens
   Request list, Request detail, Supervisor verify, PM schedule
   ============================================================ */
const Dw = window.DATA;

/* ---------------- 5.4 Request list ---------------- */
function RequestList({ ctx }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [pri, setPri] = useState("all");
  let rows = Dw.requests.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (pri !== "all" && r.priority !== pri) return false;
    if (q && !(r.no + r.mc + r.mcName + r.problem).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const { sorted, sort, onSort } = useSort(rows, { key: "date", dir: -1 });
  return (
    <div>
      <PageHead title="ใบแจ้งซ่อมทั้งหมด" sub="Maintenance Requests" actions={
      <button className="btn btn-primary"><Icon name="plus" size={16} /> สร้างใบแจ้ง</button>
      } />
      <div className="panel">
        <div className="panel-head wrap" style={{ gap: 10 }}>
          <SearchBar value={q} onChange={setQ} placeholder="ค้นหา REQ / เครื่อง / อาการ" />
          <div className="row gap-sm wrap grow" style={{ justifyContent: "flex-end" }}>
            <FilterChips value={status} onChange={setStatus} opts={[["all", "ทุกสถานะ"], ["Waiting", "รอ"], ["In Progress", "กำลังซ่อม"], ["Completed", "เสร็จ"]]} />
            <FilterChips value={pri} onChange={setPri} opts={[["all", "ทุกระดับ"], ["Critical", "Critical"], ["High", "High"], ["Medium", "Medium"], ["Low", "Low"]]} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr>
              <Th k="no" sort={sort} onSort={onSort}>เลขที่</Th>
              <Th k="mc" sort={sort} onSort={onSort}>เครื่อง</Th>
              <th>อาการ</th>
              <Th k="priority" sort={sort} onSort={onSort}>ความรุนแรง</Th>
              <Th k="status" sort={sort} onSort={onSort}>สถานะ</Th>
              <Th k="date" sort={sort} onSort={onSort}>วันที่</Th>
              <Th k="downtime" sort={sort} onSort={onSort} align="right">Downtime</Th>
              <th></th>
            </tr></thead>
            <tbody>
              {sorted.map((r) =>
              <tr key={r.no} style={{ cursor: "pointer" }} onClick={() => ctx.go("d_detail", { reqNo: r.no })}>
                  <td className="cell-code">{r.no}</td>
                  <td><div className="mono small" style={{ fontWeight: 600 }}>{r.mc}</div><div className="tiny muted-2">{r.mcName}</div></td>
                  <td style={{ maxWidth: 280 }} className="small">{r.problem}</td>
                  <td><PriorityTag p={r.priority} /></td>
                  <td><JobBadge status={r.status} /></td>
                  <td className="mono tiny muted">{r.date}</td>
                  <td className="num mono small">{r.downtime != null ? r.downtime + "h" : "—"}</td>
                  <td><Icon name="chevR" size={16} style={{ color: "var(--ink-3)" }} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}

function FilterChips({ value, onChange, opts }) {
  return (
    <div className="row gap-sm">
      {opts.map(([v, l]) =>
      <span key={v} className={"chip chip-btn" + (value === v ? " on" : "")} onClick={() => onChange(v)}>{l}</span>
      )}
    </div>);

}

/* ---------------- 5.5 / 5.8 Request detail (with optional verify) ---------------- */
function RequestDetail({ ctx }) {
  const r = Dw.requests.find((x) => x.no === ctx.params.reqNo) || Dw.requests[0];
  const mc = Dw.machineByCode(r.mc);
  const rep = Dw.repairs[r.no];
  const use = Dw.usage[r.no] || [];
  const total = use.reduce((s, u) => s + u.unit * u.qty, 0);
  const steps = buildTimeline(r, rep);
  const [, force] = useState(0); // re-render after a production decision
  const prodDecision = Dw.prodFor(r.no);
  const prodInfo = Dw.prodStatus(r.no); // consistent badge descriptor (th/en/cls/icon)
  const isProd = ctx.role === "Production";
  const canVerify = ctx.role === "Supervisor" && r.status === "Completed" && rep && rep.verify !== "Approved";
  const canProd = isProd && r.status === "Completed" && !prodDecision;
  const [reason, setReason] = useState("");
  return (
    <div>
      <div className="row" style={{ marginBottom: 14, gap: 10 }}>
        <button className="icon-btn" onClick={ctx.back}><Icon name="chevL" size={18} /></button>
        <div className="grow">
          <div className="row gap-sm wrap">
            <span className="h-lg mono">{r.no}</span><JobBadge status={r.status} /><PriorityTag p={r.priority} />
          </div>
          <div className="muted small" style={{ marginTop: 2 }}>{r.problem}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
        <div className="stack">
          <div className="panel">
            <div className="panel-head"><div className="h-sm">ข้อมูลใบแจ้ง</div><span className="chip"><Icon name="machine" size={13} /> {mc ? mc.group : ""}</span></div>
            <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {[["เครื่องจักร", r.mc + " — " + r.mcName], ["ประเภท", r.type], ["ผู้แจ้ง", r.reporter], ["แผนก", r.dept], ["เวลาแจ้ง", r.date], ["Downtime", r.downtime != null ? r.downtime + " ชม." : "—"], ["เริ่มเสีย", r.start || "—"], ["ซ่อมเสร็จ", r.finish || "—"], ["Rank", mc ? mc.rank : "—"]].map(([k, v]) =>
              <div key={k}><div className="tiny muted-2">{k}</div><div className="small" style={{ fontWeight: 600 }}>{v}</div></div>
              )}
            </div>
          </div>

          {rep &&
          <div className="panel">
              <div className="panel-head"><div className="h-sm">ผลการซ่อม (Repair Action)</div>{rep.verify === "Approved" && <span className="badge b-green"><Icon name="check" size={12} /> Approved</span>}</div>
              <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field2 k="ช่างผู้ซ่อม" v={rep.tech} />
                <Field2 k="หมวดปัญหา" v={rep.cat} />
                <Field2 k="สาเหตุราก (Root Cause)" v={rep.root} span />
                <Field2 k="วิธีแก้ไข (Corrective Action)" v={rep.action} span />
                <Field2 k="ประเภทสาเหตุ" v={rep.causeType} />
                <Field2 k="เวลาซ่อมรวม" v={rep.hrs + " ชม."} />
              </div>
            </div>
          }

          {use.length > 0 &&
          <div className="panel">
              <div className="panel-head"><div className="h-sm">อะไหล่ที่ใช้</div></div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead><tr><th>รหัส</th><th>รายการ</th><th className="num">จำนวน</th><th className="num">ต้นทุน/หน่วย</th><th className="num">รวม</th><th>Supplier</th></tr></thead>
                  <tbody>
                    {use.map((u, i) => <tr key={i}><td className="cell-code">{u.code}</td><td className="small">{u.name}</td><td className="num mono">{u.qty}</td><td className="num mono">฿{Dw.fmtNum(u.unit)}</td><td className="num mono" style={{ fontWeight: 600 }}>฿{Dw.fmtNum(u.unit * u.qty)}</td><td className="small muted">{u.supplier}</td></tr>)}
                    <tr style={{ background: "var(--surface-2)" }}><td colSpan={4} className="small" style={{ fontWeight: 600, textAlign: "right" }}>ต้นทุนอะไหล่รวม</td><td className="num mono" style={{ fontWeight: 700, fontSize: 15 }}>฿{Dw.fmtNum(total)}</td><td></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>

        <div className="stack">
          <div className="panel">
            <div className="panel-head"><div className="h-sm">สถานะการดำเนินงาน</div></div>
            <div className="panel-body"><Timeline steps={steps} />
              {r.status === "Completed" &&
              <div style={{ marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: prodInfo.dot, color: "#fff" }}>
                  {prodInfo.icon ? <Icon name={prodInfo.icon} size={12} /> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }}></span>}
                </span>
                <div>
                  <div className="tl-title">สถานะการอนุมัติ (ฝ่ายผลิต)</div>
                  <span className={"badge " + prodInfo.cls} style={{ marginTop: 5 }}><span className="dot"></span>{prodInfo.th}</span>
                  {prodInfo.reason && <div className="small muted" style={{ marginTop: 6 }}>หมายเหตุ: {prodInfo.reason}</div>}
                </div>
              </div>}
            </div>
          </div>

          {canVerify ?
          <div className="panel" style={{ borderColor: "var(--green)" }}>
              <div className="panel-head" style={{ background: "var(--green-bg)" }}><div className="h-sm" style={{ color: "var(--green-ink)" }}>ตรวจรับงาน (Supervisor)</div></div>
              <div className="panel-body">
                <div className="field"><label>เหตุผล / หมายเหตุ</label><textarea className="textarea" style={{ minHeight: 70 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ระบุเหตุผล (จำเป็นเมื่อไม่อนุมัติ)" /></div>
                <div className="row gap-sm">
                  <button className="btn btn-success grow" onClick={() => {ctx.toast("อนุมัติงาน " + r.no + " แล้ว · จัดเก็บเข้าประวัติ");ctx.go("d_verify");}}><Icon name="check" size={16} /> อนุมัติ</button>
                  <button className="btn btn-danger grow" onClick={() => {if (!reason.trim()) {ctx.toast("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "error");return;}ctx.toast("ส่งกลับให้ช่างแก้ไข", "error");ctx.go("d_verify");}}><Icon name="x" size={16} /> ไม่อนุมัติ</button>
                </div>
              </div>
            </div> :
          canProd ?
          <div className="panel" style={{ borderColor: "var(--navy)" }}>
              <div className="panel-head" style={{ background: "var(--accent-bg)" }}><div className="h-sm">ตรวจสอบโดยฝ่ายผลิต (Production)</div></div>
              <div className="panel-body">
                <div className="small muted" style={{ marginBottom: 12 }}>ยืนยันว่าเครื่องกลับมาเดินการผลิตได้ตามปกติหลังการซ่อม ก่อนปล่อยเข้าไลน์ผลิต</div>
                <div className="field"><label>หมายเหตุ / เหตุผล</label><textarea className="textarea" style={{ minHeight: 70 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ระบุเหตุผล (จำเป็นเมื่อไม่อนุมัติ)" /></div>
                <div className="row gap-sm">
                  <button className="btn btn-success grow" onClick={() => {Dw.prodSet(r.no, "Approved", reason);ctx.toast("ฝ่ายผลิตอนุมัติ " + r.no + " — เครื่องพร้อมผลิต");ctx.go("d_prodverify");}}><Icon name="check" size={16} /> อนุมัติ</button>
                  <button className="btn btn-danger grow" onClick={() => {if (!reason.trim()) {ctx.toast("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "error");return;}Dw.prodSet(r.no, "Rejected", reason);ctx.toast("ฝ่ายผลิตไม่อนุมัติ " + r.no + " — ส่งกลับซ่อม", "error");ctx.go("d_prodverify");}}><Icon name="x" size={16} /> ไม่อนุมัติ</button>
                </div>
              </div>
            </div> :
          isProd && prodDecision ?
          <div className="panel" style={{ borderColor: prodDecision.decision === "Approved" ? "var(--green)" : "var(--red)" }}>
              <div className="panel-head"><div className="h-sm">ผลตรวจสอบฝ่ายผลิต</div></div>
              <div className="panel-body stack">
                {prodDecision.decision === "Approved" ?
              <span className="badge b-green"><span className="dot"></span>ฝ่ายผลิตอนุมัติ · เครื่องพร้อมผลิต</span> :
              <span className="badge b-red"><span className="dot"></span>ฝ่ายผลิตไม่อนุมัติ · ส่งกลับซ่อม</span>}
                {prodDecision.reason && <div className="small muted">หมายเหตุ: {prodDecision.reason}</div>}
                <button className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => {Dw.prodSet(r.no, null);ctx.go("d_prodverify");}}>แก้ไขผลตรวจ</button>
              </div>
            </div> :

          <div className="panel">
              <div className="panel-head"><div className="h-sm">การแจ้งเตือน</div></div>
              <div className="panel-body stack small">
                <div className="row gap-sm"><span style={{ color: "var(--blue)" }}><Icon name="mail" size={16} /></span> อีเมลแจ้งทีมช่าง + หัวหน้างาน MT</div>
                <div className="row gap-sm"><span style={{ color: "var(--green)" }}><Icon name="bell" size={16} /></span> LINE Alert ตาม Risk Zone ของเครื่อง</div>
                {mc && <div style={{ marginTop: 6 }}><RiskTag zone={mc.rank === "A" ? "HIGH" : mc.rank === "B" ? "MEDIUM" : "LOW"} /></div>}
              </div>
            </div>
          }
        </div>
      </div>
    </div>);

}
function Field2({ k, v, span }) {
  return <div style={span ? { gridColumn: "1 / -1" } : null}><div className="tiny muted-2">{k}</div><div className="small" style={{ fontWeight: 600 }}>{v}</div></div>;
}

/* ---------------- 5.8 Supervisor verify queue ---------------- */
function VerifyQueue({ ctx }) {
  const pending = Dw.requests.filter((r) => r.status === "Completed");
  const open = Dw.requests.filter((r) => r.status !== "Completed");
  return (
    <div>
      <PageHead title="ตรวจรับงาน" sub="งานที่ซ่อมเสร็จและรอหัวหน้างานยืนยันผล" />
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginBottom: 18 }}>
        <MiniStat label="รอตรวจรับ" value={pending.filter((r) => {const rep = Dw.repairs[r.no];return rep && rep.verify !== "Approved";}).length} color="var(--amber)" icon="clipboard" />
        <MiniStat label="กำลังซ่อม/รอ" value={open.length} color="var(--blue)" icon="wrench" />
        <MiniStat label="อนุมัติแล้ว (เดือนนี้)" value={pending.filter((r) => {const rep = Dw.repairs[r.no];return rep && rep.verify === "Approved";}).length} color="var(--green)" icon="checkCircle" />
      </div>
      <div className="panel">
        <div className="panel-head"><div className="h-sm">งานรอตรวจรับ</div></div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>เลขที่</th><th>เครื่อง</th><th>ช่าง</th><th>เวลาซ่อม</th><th>ตรวจรับ</th><th></th></tr></thead>
            <tbody>
              {pending.map((r) => {
                const rep = Dw.repairs[r.no];
                return (
                  <tr key={r.no} style={{ cursor: "pointer" }} onClick={() => ctx.go("d_detail", { reqNo: r.no })}>
                    <td className="cell-code">{r.no}</td>
                    <td><span className="mono small" style={{ fontWeight: 600 }}>{r.mc}</span> <span className="small muted">{r.mcName}</span></td>
                    <td className="small">{rep ? rep.tech : "—"}</td>
                    <td className="mono small">{rep ? rep.hrs + " ชม." : "—"}</td>
                    <td>{rep && rep.verify === "Approved" ? <span className="badge b-green"><span className="dot"></span>อนุมัติแล้ว</span> : <span className="badge b-amber"><span className="dot"></span>รอตรวจรับ</span>}</td>
                    <td>{rep && rep.verify !== "Approved" ? <button className="btn btn-sm btn-primary" onClick={(e) => {e.stopPropagation();ctx.go("d_detail", { reqNo: r.no });}}>ตรวจรับ</button> : <Icon name="chevR" size={15} style={{ color: "var(--ink-3)" }} />}</td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
function MiniStat({ label, value, color, icon }) {
  return (
    <div className="card card-pad row" style={{ gap: 13 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={icon} size={20} /></div>
      <div><div className="mono" style={{ fontSize: 24, fontWeight: 600, lineHeight: 1 }}>{value}</div><div className="tiny muted" style={{ marginTop: 3 }}>{label}</div></div>
    </div>);

}

/* ---------------- Production review queue ---------------- */
function ProductionVerify({ ctx }) {
  const [, setTick] = useState(0);
  const decisions = Dw.prodGet();
  const completed = Dw.requests.filter((r) => r.status === "Completed");
  const pending = completed.filter((r) => !decisions[r.no]);
  const approved = completed.filter((r) => decisions[r.no] && decisions[r.no].decision === "Approved");
  const rejected = completed.filter((r) => decisions[r.no] && decisions[r.no].decision === "Rejected");
  const quickApprove = (no, e) => {e.stopPropagation();Dw.prodSet(no, "Approved", "");setTick((t) => t + 1);ctx.toast("ฝ่ายผลิตอนุมัติ " + no + " — เครื่องพร้อมผลิต");};
  const prodBadge = (no) => {
    const info = Dw.prodStatus(no);
    return <span className={"badge " + info.cls}><span className="dot"></span>{info.th}</span>;
  };
  return (
    <div>
      <PageHead title="ตรวจสอบใบแจ้งซ่อม (ฝ่ายผลิต)" sub="งานที่ช่างซ่อมเสร็จแล้ว — ฝ่ายผลิตยืนยันว่าเครื่องกลับมาเดินการผลิตได้ตามปกติ" />
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginBottom: 18 }}>
        <MiniStat label="รอฝ่ายผลิตตรวจสอบ" value={pending.length} color="var(--amber)" icon="clipboard" />
        <MiniStat label="อนุมัติ" value={approved.length} color="var(--green)" icon="checkCircle" />
        <MiniStat label="ไม่อนุมัติ (ส่งกลับซ่อม)" value={rejected.length} color="var(--red)" icon="x" />
      </div>
      <div className="panel">
        <div className="panel-head"><div className="h-sm">งานที่ซ่อมเสร็จ · รอฝ่ายผลิตตรวจสอบ</div></div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>เลขที่</th><th>เครื่อง</th><th>อาการ</th><th>ช่าง</th><th>เวลาซ่อม</th><th>ผลตรวจฝ่ายผลิต</th><th></th></tr></thead>
            <tbody>
              {completed.map((r) => {
                const rep = Dw.repairs[r.no];
                const decided = !!decisions[r.no];
                return (
                  <tr key={r.no} style={{ cursor: "pointer" }} onClick={() => ctx.go("d_detail", { reqNo: r.no })}>
                    <td className="cell-code">{r.no}</td>
                    <td><span className="mono small" style={{ fontWeight: 600 }}>{r.mc}</span> <span className="small muted">{r.mcName}</span></td>
                    <td className="small" style={{ maxWidth: 240 }}>{r.problem}</td>
                    <td className="small">{rep ? rep.tech : "—"}</td>
                    <td className="mono small">{rep ? rep.hrs + " ชม." : "—"}</td>
                    <td>{prodBadge(r.no)}</td>
                    <td>
                      {!decided ?
                      <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
                          <button className="btn btn-sm btn-success" onClick={(e) => quickApprove(r.no, e)}><Icon name="check" size={14} /> อนุมัติ</button>
                          <button className="btn btn-sm btn-primary" onClick={(e) => {e.stopPropagation();ctx.go("d_detail", { reqNo: r.no });}}>ตรวจสอบ</button>
                        </div> :
                      <Icon name="chevR" size={15} style={{ color: "var(--ink-3)" }} />}
                    </td>
                  </tr>);

              })}
              {completed.length === 0 && <tr><td colSpan={7} className="empty">ยังไม่มีงานที่ซ่อมเสร็จรอตรวจสอบ</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}

/* ---------------- 5.12 PM schedule ---------------- */
const PM_BADGE = { "Completed": "b-green", "Overdue": "b-red", "Due Later": "b-blue" };
const PM_TH = { "Completed": "เสร็จตามแผน", "Overdue": "เกินกำหนด", "Due Later": "ยังไม่ถึงกำหนด" };
function PmSchedule({ ctx }) {
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  let rows = Dw.pm.filter((p) => (st === "all" || p.status === st) && (!q || (p.mc + p.name + p.checklist).toLowerCase().includes(q.toLowerCase())));
  const overdue = Dw.pm.filter((p) => p.status === "Overdue").length;
  return (
    <div>
      <PageHead title="แผนบำรุงรักษาเชิงป้องกัน (PM Schedule)" sub="Preventive Maintenance — ติดตามรอบ PM ของเครื่องจักร" actions={
      <button className="btn"><Icon name="download" size={15} /> ส่งออก</button>
      } />
      {overdue > 0 &&
      <div className="card card-pad row gap-sm" style={{ background: "var(--red-bg)", border: "1px solid #f0c4c4", marginBottom: 16 }}>
          <span style={{ color: "var(--red)" }}><Icon name="alert" size={18} /></span>
          <span className="small" style={{ color: "var(--red-ink)", fontWeight: 600 }}>มี {overdue} เครื่องที่เกินกำหนด PM — ต้องดำเนินการทันที</span>
        </div>
      }
      <div className="panel">
        <div className="panel-head wrap" style={{ gap: 10 }}>
          <SearchBar value={q} onChange={setQ} placeholder="ค้นหาเครื่อง / checklist" />
          <FilterChips value={st} onChange={setSt} opts={[["all", "ทั้งหมด"], ["Overdue", "เกินกำหนด"], ["Due Later", "ยังไม่ถึง"], ["Completed", "เสร็จแล้ว"]]} />
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>เครื่อง</th><th>PM Checklist</th><th>ความถี่</th><th>PM ล่าสุด</th><th>PM ครั้งถัดไป</th><th>สถานะ</th></tr></thead>
            <tbody>
              {rows.map((p) =>
              <tr key={p.mc + p.checklist} className={p.status === "Overdue" ? "row-red" : ""}>
                  <td><span className="mono small" style={{ fontWeight: 600 }}>{p.mc}</span><div className="tiny muted-2">{p.name}</div></td>
                  <td className="small">{p.checklist}</td>
                  <td><span className="chip">{p.freq}</span></td>
                  <td className="mono small muted">{p.last}</td>
                  <td className="mono small" style={{ fontWeight: 600 }}>{p.next}</td>
                  <td><span className={"badge " + PM_BADGE[p.status]}><span className="dot"></span>{PM_TH[p.status]}</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}

Object.assign(window, { RequestList, RequestDetail, VerifyQueue, ProductionVerify, PmSchedule, FilterChips, MiniStat });