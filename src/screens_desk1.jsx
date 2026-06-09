/* ============================================================
   MT_System — Desktop work screens
   Request list, Request detail, Supervisor verify, PM schedule
   ============================================================ */
const Dw = window.DATA;

/* ---------------- 5.4 Request create form (desktop) ---------------- */
function RequestCreateDesktop({ ctx, onBack }) {
  const [mc, setMc] = useState(Dw.machines[0]?.code || "");
  const [sev, setSev] = useState("High");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sevs = ["Low", "Medium", "High", "Critical"];
  const machine = Dw.machineByCode(mc);
  const reporterName = Dw.roleUser?.[ctx.role]?.name || ctx.role;

  const submit = async () => {
    if (submitting) return;
    if (!desc.trim()) { ctx.toast("กรุณากรอกอาการเสีย", "error"); return; }
    setSubmitting(true);
    try {
      const reqNo = await Dw.createRequest({ machineCode: mc, problem: desc.trim(), priority: sev, reporterName });
      if (typeof Dw.refresh === "function") { await Dw.refresh(); window.dispatchEvent(new Event("mt-data-refresh")); }
      ctx.toast("ส่งใบแจ้งซ่อมแล้ว · " + reqNo + " · Telegram แจ้งทีมช่างแล้ว", "mail");
      onBack();
    } catch (err) {
      ctx.toast("ส่งไม่สำเร็จ: " + err.message, "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <PageHead title="สร้างใบแจ้งซ่อม" sub="New Maintenance Request" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">รายละเอียดใบแจ้งซ่อม</div></div>
          <div className="panel-body">
            <div className="field"><label>เครื่องจักร <span className="req">*</span></label>
              <select className="select" value={mc} onChange={e => setMc(e.target.value)}>
                {Dw.machines.map(x => <option key={x.code} value={x.code}>{x.code} · {x.name}</option>)}
              </select>
            </div>
            <div className="field"><label>อาการเสีย <span className="req">*</span></label>
              <textarea className="textarea" style={{ minHeight: 90 }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="อธิบายอาการที่พบ..." />
            </div>
            <div className="field"><label>ความรุนแรง</label>
              <div className="seg">{sevs.map(s => <div key={s} className={"seg-opt" + (sev === s ? " on-" + s.toLowerCase() : "")} onClick={() => setSev(s)}>{s}</div>)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="field"><label>ผู้แจ้ง</label><input className="input" readOnly value={reporterName} /></div>
              <div className="field"><label>แผนก</label><input className="input" readOnly value={machine?.dept || "—"} /></div>
            </div>
            <div className="row gap-sm" style={{ marginTop: 8 }}>
              <button className="btn btn-primary grow" onClick={submit} disabled={submitting}>
                <Icon name="check" size={16} /> {submitting ? "กำลังส่ง..." : "ส่งใบแจ้งซ่อม"}
              </button>
              <button className="btn btn-ghost" onClick={onBack} disabled={submitting}>ยกเลิก</button>
            </div>
          </div>
        </div>
        <div className="stack" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {machine && (
            <div className="panel">
              <div className="panel-head"><div className="h-sm">เครื่องที่เลือก</div><RankPill rank={machine.rank} /></div>
              <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div className="tiny muted-2">รหัส</div><div className="small mono" style={{ fontWeight: 700 }}>{machine.code}</div></div>
                <div><div className="tiny muted-2">สถานะ</div><div className="small">{machine.status}</div></div>
                <div><div className="tiny muted-2">กลุ่ม</div><div className="small">{machine.group}</div></div>
                <div><div className="tiny muted-2">Criticality</div><div className="small">{machine.crit}</div></div>
              </div>
            </div>
          )}
          <div className="card card-pad" style={{ background: "var(--blue-bg)", border: "1px solid var(--border)", display: "flex", gap: 11 }}>
            <span style={{ color: "var(--blue)" }}><Icon name="mail" size={18} /></span>
            <div className="small" style={{ color: "var(--blue-ink)" }}>เมื่อส่ง ระบบจะแจ้งทีมช่างผ่าน <b>Telegram</b> ทันที</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 5.4 Request list ---------------- */
function RequestList({ ctx }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [pri, setPri] = useState("all");
  const [creating, setCreating] = useState(false);

  let rows = Dw.requests.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (pri !== "all" && r.priority !== pri) return false;
    if (q && !(r.no + r.mc + r.mcName + r.problem).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const { sorted, sort, onSort } = useSort(rows, { key: "date", dir: -1 });

  if (creating) return <RequestCreateDesktop ctx={ctx} onBack={() => setCreating(false)} />;
  return (
    <div>
      <PageHead title="ใบแจ้งซ่อมทั้งหมด" sub="Maintenance Requests" />
      <div className="panel">
        <div className="panel-head wrap" style={{ gap: 10 }}>
          <SearchBar value={q} onChange={setQ} placeholder="ค้นหา REQ / เครื่อง / อาการ" />
          <div className="row gap-sm wrap grow" style={{ justifyContent: "flex-end" }}>
            <FilterChips value={status} onChange={setStatus} opts={[["all", "ทุกสถานะ"], ["Waiting", "รอ"], ["In Progress", "กำลังซ่อม"], ["Completed", "เสร็จ"], ["Returned", "ส่งกลับซ่อม"], ["Resubmitted", "MT ส่งแก้ไขแล้ว"]]} />
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
  const [, force] = useState(0);
  const reviewHistory = Dw.getReviewHistory(r.no);
  const prodDecision = Dw.prodFor(r.no);
  const prodInfo = Dw.prodStatus(r.no);
  const isProd = ctx.role === "Production";
  const isMT = ctx.role === "Maintenance";
  const canVerify = false;
  const canProd = isProd && (r.status === "Completed" || r.status === "Resubmitted") && !prodDecision;
  const canResubmit = isMT && r.status === "Returned";
  const [reason, setReason] = useState("");
  const [reRoot, setReRoot] = useState(rep?.root || "");
  const [reAction, setReAction] = useState(rep?.action || "");
  const [reHrs, setReHrs] = useState(rep?.hrs ?? 0);
  const [reSubmitting, setReSubmitting] = useState(false);
  const doResubmit = async () => {
    if (!reAction.trim()) { ctx.toast("กรุณากรอกวิธีแก้ไข", "error"); return; }
    setReSubmitting(true);
    try {
      await Dw.saveRepair(r.no, { root: reRoot, action: reAction, hrs: Number(reHrs), verify: "Approved" }, []);
      await Dw.refresh();
      window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast("บันทึกผลซ่อมใหม่สำเร็จ · รออนุมัติจากฝ่ายผลิต", "mail");
      ctx.back();
    } catch (e) { ctx.toast("บันทึกไม่สำเร็จ: " + e.message, "error"); }
    finally { setReSubmitting(false); }
  };
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

          {reviewHistory.length > 0 &&
          <div className="panel">
              <div className="panel-head"><div className="h-sm">ประวัติการตรวจสอบ (ฝ่ายผลิต)</div><span className="chip">{reviewHistory.length} รอบ</span></div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead><tr><th>รอบที่</th><th>ผล</th><th>เหตุผล</th><th>วันที่</th></tr></thead>
                  <tbody>
                    {reviewHistory.map((h) => (
                      <tr key={h.round}>
                        <td className="mono small" style={{ fontWeight:700 }}>รอบที่ {h.round}</td>
                        <td>{h.decision === "Approved"
                          ? <span className="badge b-green"><span className="dot"></span>อนุมัติ</span>
                          : <span className="badge b-red"><span className="dot"></span>ส่งกลับซ่อม</span>}</td>
                        <td className="small muted">{h.reason || "—"}</td>
                        <td className="mono tiny muted">{(h.decidedAt || "").toString().slice(0,16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              {(r.status === "Completed" || r.status === "Resubmitted") &&
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

          {canProd ?
          <div className="panel" style={{ borderColor: "var(--navy)" }}>
              <div className="panel-head" style={{ background: "var(--accent-bg)" }}><div className="h-sm">ตรวจสอบโดยฝ่ายผลิต (Production)</div></div>
              <div className="panel-body">
                <div className="small muted" style={{ marginBottom: 12 }}>ยืนยันว่าเครื่องกลับมาเดินการผลิตได้ตามปกติหลังการซ่อม ก่อนปล่อยเข้าไลน์ผลิต</div>
                <div className="field"><label>หมายเหตุ / เหตุผล</label><textarea className="textarea" style={{ minHeight: 70 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ระบุเหตุผล (จำเป็นเมื่อไม่อนุมัติ)" /></div>
                <div className="row gap-sm">
                  <button className="btn btn-success grow" onClick={async () => {try{await Dw.prodApprove(r.no,"Approved",reason);await Dw.refresh();window.dispatchEvent(new Event("mt-data-refresh"));ctx.toast("ฝ่ายผลิตอนุมัติ "+r.no+" — เครื่องพร้อมผลิต");ctx.go("d_prodverify");}catch(e){ctx.toast("บันทึกไม่สำเร็จ","error");}}}><Icon name="check" size={16} /> อนุมัติ</button>
                  <button className="btn btn-danger grow" onClick={async () => {if (!reason.trim()){ctx.toast("กรุณาระบุเหตุผลที่ไม่อนุมัติ","error");return;}try{await Dw.prodApprove(r.no,"Rejected",reason);await Dw.refresh();window.dispatchEvent(new Event("mt-data-refresh"));ctx.toast("ส่งงานคืน MT แล้ว · Telegram แจ้งทีมช่างแล้ว","error");ctx.go("d_prodverify");}catch(e){ctx.toast("บันทึกไม่สำเร็จ","error");}}}><Icon name="x" size={16} /> ไม่อนุมัติ</button>
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

          null
          }

          {canResubmit &&
          <div className="panel" style={{ borderColor: "var(--red)" }}>
              <div className="panel-head" style={{ background: "var(--red-bg,#fff5f5)" }}><div className="h-sm" style={{ color: "var(--red)" }}>ฝ่ายผลิตส่งงานคืน — กรุณาแก้ไขและส่งใหม่</div></div>
              <div className="panel-body stack">
                {r.prodReason && <div className="small" style={{ color: "var(--red)", marginBottom: 4 }}>เหตุผล: {r.prodReason}</div>}
                <div className="field"><label>สาเหตุราก (Root Cause)</label>
                  <textarea className="textarea" style={{ minHeight: 60 }} value={reRoot} onChange={e => setReRoot(e.target.value)} placeholder="ระบุสาเหตุที่แท้จริง..." />
                </div>
                <div className="field"><label>วิธีแก้ไข (Corrective Action) <span className="req">*</span></label>
                  <textarea className="textarea" style={{ minHeight: 60 }} value={reAction} onChange={e => setReAction(e.target.value)} placeholder="ระบุสิ่งที่ทำการแก้ไข..." />
                </div>
                <div className="field" style={{ maxWidth: 160 }}><label>เวลาซ่อมรวม (ชม.)</label>
                  <input className="input" type="number" min={0} step={0.5} value={reHrs} onChange={e => setReHrs(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={doResubmit} disabled={reSubmitting}>
                  <Icon name="check" size={16} /> {reSubmitting ? "กำลังบันทึก..." : "บันทึกผลซ่อมใหม่"}
                </button>
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
  const [tab, setTab] = useState("first");
  const [saving, setSaving] = useState(null);
  const [rejectNo, setRejectNo] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // tab: first = รออนุมัติครั้งแรก, resubmit = MT ส่งแก้ไขแล้ว, history = อนุมัติแล้ว
  const firstPending   = Dw.requests.filter((r) => r.status === "Completed" && !r.prodDecision);
  const rePending      = Dw.requests.filter((r) => r.status === "Resubmitted");
  const approvedList   = Dw.requests.filter((r) => r.prodDecision === "Approved");

  const currentList = tab === "first" ? firstPending : tab === "resubmit" ? rePending : approvedList;

  const doApprove = async (no, e) => {
    e.stopPropagation();
    setSaving(no);
    try {
      await Dw.prodApprove(no, "Approved", "");
      await Dw.refresh(); window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast("ฝ่ายผลิตอนุมัติ " + no + " — เครื่องพร้อมผลิต");
    } catch (err) { ctx.toast("บันทึกไม่สำเร็จ: " + err.message, "error"); }
    finally { setSaving(null); }
  };

  const doReject = async () => {
    if (!rejectReason.trim()) { ctx.toast("กรุณาระบุเหตุผล", "error"); return; }
    setSaving(rejectNo);
    try {
      await Dw.prodApprove(rejectNo, "Rejected", rejectReason.trim());
      await Dw.refresh(); window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast("ส่งงานคืน MT แล้ว · Telegram แจ้งทีมช่างแล้ว", "error");
      setRejectNo(null); setRejectReason("");
    } catch (err) { ctx.toast("บันทึกไม่สำเร็จ: " + err.message, "error"); }
    finally { setSaving(null); }
  };

  const TAB_CONFIG = [
    { key:"first",     label:"รออนุมัติ",         sub:"ยังไม่เคยผ่าน PD",          count:firstPending.length,  color:"var(--amber)", icon:"clipboard" },
    { key:"resubmit",  label:"MT ส่งแก้ไขแล้ว",   sub:"เคยถูกส่งคืน ส่งแก้มาใหม่", count:rePending.length,     color:"var(--navy)",  icon:"wrench" },
    { key:"history",   label:"ประวัติการอนุมัติ",  sub:"อนุมัติผ่านแล้ว",            count:approvedList.length,  color:"var(--green)", icon:"checkCircle" },
  ];

  return (
    <div>
      {rejectNo && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={() => setRejectNo(null)}>
          <div style={{ background:"var(--surface)", borderRadius:16, width:"100%", maxWidth:440, boxShadow:"0 8px 40px rgba(0,0,0,.18)", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
            <div className="panel-head" style={{ padding:"16px 20px" }}>
              <div className="h-sm">ส่งงานคืน MT</div>
              <button className="icon-btn" onClick={() => setRejectNo(null)}><Icon name="x" size={18}/></button>
            </div>
            <div style={{ padding:"16px 20px" }}>
              <div className="small muted" style={{ marginBottom:12 }}>งาน <b>{rejectNo}</b> จะถูกส่งกลับให้ MT พร้อม Telegram แจ้งเหตุผล</div>
              <div className="field"><label>เหตุผลที่ไม่อนุมัติ <span className="req">*</span></label>
                <textarea className="textarea" style={{ minHeight:80 }} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="เช่น เครื่องยังมีเสียงผิดปกติ ขอให้ตรวจสอบอีกครั้ง" />
              </div>
              <div className="row gap-sm" style={{ marginTop:4 }}>
                <button className="btn btn-danger grow" onClick={doReject} disabled={!!saving}><Icon name="x" size={16}/> ยืนยันส่งงานคืน</button>
                <button className="btn btn-ghost" onClick={() => setRejectNo(null)}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHead title="ตรวจสอบใบแจ้งซ่อม (ฝ่ายผลิต)" sub="งานที่ช่างซ่อมเสร็จแล้ว รอฝ่ายผลิตยืนยัน" />

      {/* Summary cards */}
      <div className="grid" style={{ gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:18 }}>
        {TAB_CONFIG.map((t) => (
          <div key={t.key} className="card card-pad row" style={{ gap:13, cursor:"pointer", borderWidth: tab===t.key ? 2 : 1, borderColor: tab===t.key ? t.color : "var(--border)", transition:"border-color .15s" }} onClick={() => setTab(t.key)}>
            <div style={{ width:42, height:42, borderRadius:11, background:t.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flex:"none" }}><Icon name={t.icon} size={20}/></div>
            <div>
              <div className="mono" style={{ fontSize:24, fontWeight:600, lineHeight:1 }}>{t.count}</div>
              <div style={{ fontWeight:600, fontSize:13, marginTop:2 }}>{t.label}</div>
              <div className="tiny muted" style={{ marginTop:1 }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab panel */}
      <div className="panel">
        <div className="panel-head">
          <div className="h-sm">{TAB_CONFIG.find(t=>t.key===tab)?.label}</div>
          {tab === "resubmit" && rePending.length > 0 && <span className="badge b-navy"><span className="dot"></span>เคยถูก reject มาก่อน</span>}
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่</th><th>เครื่อง</th><th>อาการ</th><th>ช่าง</th><th>เวลาซ่อม</th>
                {tab === "resubmit" && <th>รอบที่</th>}
                {tab === "history"  && <th>วันที่อนุมัติ</th>}
                {tab !== "history"  && <th></th>}
              </tr>
            </thead>
            <tbody>
              {currentList.map((r) => {
                const rep = Dw.repairs[r.no];
                const isSaving = saving === r.no;
                const hist = Dw.getReviewHistory(r.no);
                return (
                  <tr key={r.no} style={{ cursor:"pointer" }} onClick={() => ctx.go("d_detail", { reqNo: r.no })}>
                    <td className="cell-code">{r.no}</td>
                    <td><span className="mono small" style={{ fontWeight:600 }}>{r.mc}</span><div className="tiny muted-2">{r.mcName}</div></td>
                    <td className="small" style={{ maxWidth:220 }}>{r.problem}</td>
                    <td className="small">{rep ? rep.tech : "—"}</td>
                    <td className="mono small">{rep ? rep.hrs + " ชม." : "—"}</td>
                    {tab === "resubmit" && (
                      <td>
                        <span className="badge b-red" style={{ fontSize:11 }}>รอบที่ {r.reviewRound}</span>
                        {hist.length > 0 && <div className="tiny muted" style={{ marginTop:3 }}>เคย reject {hist.filter(h=>h.decision==="Rejected").length} ครั้ง</div>}
                      </td>
                    )}
                    {tab === "history" && (
                      <td className="mono tiny muted">{(hist.find(h=>h.decision==="Approved")?.decidedAt || "").toString().slice(0,16)}</td>
                    )}
                    {tab !== "history" && (
                      <td>
                        <div className="row gap-sm" style={{ justifyContent:"flex-end" }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-sm btn-success" onClick={(e) => doApprove(r.no, e)} disabled={isSaving}><Icon name="check" size={14}/> อนุมัติ</button>
                          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); setRejectNo(r.no); setRejectReason(""); }} disabled={isSaving}><Icon name="x" size={14}/> ส่งคืน</button>
                        </div>
                      </td>
                    )}
                  </tr>);
              })}
              {currentList.length === 0 && (
                <tr><td colSpan={7} className="empty" style={{ textAlign:"center", padding:32 }}>
                  {tab === "first"     ? "ไม่มีงานรออนุมัติ" :
                   tab === "resubmit"  ? "ไม่มีงานที่ MT ส่งแก้ไขมา" :
                   "ยังไม่มีประวัติการอนุมัติ"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}

/* ---------------- 5.12 PM schedule ---------------- */
const PM_BADGE = { "Completed": "b-green", "Overdue": "b-red", "Due Later": "b-blue" };
const PM_TH = { "Completed": "เสร็จตามแผน", "Overdue": "เกินกำหนด", "Due Later": "ยังไม่ถึงกำหนด" };
function PmDetailModal({ pm, onClose }) {
  const m = Dw.machineByCode(pm.mc);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"var(--surface)", borderRadius:16, width:"100%", maxWidth:520, boxShadow:"0 8px 40px rgba(0,0,0,.18)", overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        <div className="panel-head" style={{ padding:"16px 20px" }}>
          <div>
            <div className="h-sm">รายละเอียดแผน PM</div>
            <div className="tiny muted-2" style={{ marginTop:3 }}>{pm.mc} · {pm.name}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:"18px 20px", display:"grid", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div className="panel" style={{ margin:0 }}>
              <div style={{ padding:"12px 14px" }}>
                <div className="tiny muted-2">เครื่องจักร</div>
                <div className="small mono" style={{ fontWeight:700, marginTop:3 }}>{pm.mc}</div>
                <div className="tiny muted-2" style={{ marginTop:2 }}>{pm.name}</div>
              </div>
            </div>
            <div className="panel" style={{ margin:0 }}>
              <div style={{ padding:"12px 14px" }}>
                <div className="tiny muted-2">สถานะ</div>
                <div style={{ marginTop:5 }}><span className={"badge " + PM_BADGE[pm.status]}><span className="dot"></span>{PM_TH[pm.status]}</span></div>
              </div>
            </div>
          </div>
          <div className="panel" style={{ margin:0 }}>
            <div style={{ padding:"12px 14px" }}>
              <div className="tiny muted-2" style={{ marginBottom:6 }}>Checklist / รายการตรวจสอบ</div>
              <div className="small" style={{ fontWeight:600, lineHeight:1.6 }}>{pm.checklist}</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <div className="panel" style={{ margin:0 }}>
              <div style={{ padding:"12px 14px" }}>
                <div className="tiny muted-2">ความถี่</div>
                <div style={{ marginTop:5 }}><span className="chip">{pm.freq}</span></div>
              </div>
            </div>
            <div className="panel" style={{ margin:0 }}>
              <div style={{ padding:"12px 14px" }}>
                <div className="tiny muted-2">PM ล่าสุด</div>
                <div className="small mono" style={{ fontWeight:600, marginTop:4 }}>{pm.last||"—"}</div>
              </div>
            </div>
            <div className="panel" style={{ margin:0, borderColor: pm.status==="Overdue"?"var(--red)":"var(--border)" }}>
              <div style={{ padding:"12px 14px" }}>
                <div className="tiny muted-2">ครั้งถัดไป</div>
                <div className="small mono" style={{ fontWeight:700, marginTop:4, color: pm.status==="Overdue"?"var(--red-ink)":"inherit" }}>{pm.next||"—"}</div>
              </div>
            </div>
          </div>
          {m && (
            <div className="panel" style={{ margin:0 }}>
              <div style={{ padding:"12px 14px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <div><div className="tiny muted-2">กลุ่มเครื่อง</div><div className="small" style={{ fontWeight:600, marginTop:3 }}>{m.group}</div></div>
                <div><div className="tiny muted-2">Criticality</div><div className="small" style={{ fontWeight:600, marginTop:3 }}>{m.crit}</div></div>
                <div><div className="tiny muted-2">Rank</div><div style={{ marginTop:3 }}><RankPill rank={m.rank}/></div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PmSchedule({ ctx }) {
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const [sel, setSel] = useState(null);
  let rows = Dw.pm.filter((p) => (st === "all" || p.status === st) && (!q || (p.mc + p.name + p.checklist).toLowerCase().includes(q.toLowerCase())));
  const overdue = Dw.pm.filter((p) => p.status === "Overdue").length;
  return (
    <div>
      {sel && <PmDetailModal pm={sel} onClose={() => setSel(null)} />}
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
            <thead><tr><th>เครื่อง</th><th>PM Checklist</th><th>ความถี่</th><th>PM ล่าสุด</th><th>PM ครั้งถัดไป</th><th>สถานะ</th><th></th></tr></thead>
            <tbody>
              {rows.map((p) =>
              <tr key={p.mc + p.checklist} className={p.status === "Overdue" ? "row-red" : ""} style={{ cursor:"pointer" }} onClick={() => setSel(p)}>
                  <td><span className="mono small" style={{ fontWeight: 600 }}>{p.mc}</span><div className="tiny muted-2">{p.name}</div></td>
                  <td className="small">{p.checklist}</td>
                  <td><span className="chip">{p.freq}</span></td>
                  <td className="mono small muted">{p.last}</td>
                  <td className="mono small" style={{ fontWeight: 600 }}>{p.next}</td>
                  <td><span className={"badge " + PM_BADGE[p.status]}><span className="dot"></span>{PM_TH[p.status]}</span></td>
                  <td><Icon name="chevR" size={16} style={{ color:"var(--ink-3)" }}/></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}

Object.assign(window, { RequestList, RequestDetail, VerifyQueue, ProductionVerify, PmSchedule, FilterChips, MiniStat });