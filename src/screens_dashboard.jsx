/* ============================================================
   MT_System — Manager Dashboard + Admin
   ============================================================ */
const Dd = window.DATA;

function SectionHead({ icon, title, sub, color }) {
  return (
    <div className="row" style={{ gap:11, alignItems:"center", margin:"30px 0 14px" }}>
      <span style={{ color: color || "var(--ink-3)", flex:"none" }}><Icon name={icon} size={19} /></span>
      <div>
        <div className="h-md">{title}</div>
        {sub && <div className="tiny muted-2" style={{marginTop:1}}>{sub}</div>}
      </div>
      <div style={{ flex:1, height:1, background:"var(--border)" }}></div>
    </div>
  );
}

/* ---------------- 5.13 Manager dashboard ---------------- */
function Dashboard({ ctx }) {
  const [monthsBack, setMonthsBack] = useState(6);
  const trend = Dd.downtimeTrend.slice(-monthsBack);
  const rangeLabel = Dd.dateRangeLabel(trend);
  const maxPareto = Dd.pareto[0].count;
  const maxDown = Math.max(...trend.map(d=>d.v));
  const criticalParts = Dd.parts.filter(p=>p.status==="critical");
  const overduePm = Dd.pm.filter(p=>p.status==="Overdue");
  const inProgress = Dd.requests.filter(r=>r.priority==="Critical" && r.status!=="Completed");
  let cum = 0; const total = Dd.pareto.reduce((s,p)=>s+p.count,0);
  return (
    <div>
      <PageHead title="Dashboard ผู้บริหาร" sub={`ภาพรวมความน่าเชื่อถือเครื่องจักรและคลังอะไหล่ · ช่วงข้อมูล ${rangeLabel} (ย้อนหลัง ${monthsBack} เดือน)`} actions={
        <span className="row gap-sm no-print">
          <select className="select" style={{width:"auto"}} value={monthsBack} onChange={e=>setMonthsBack(Number(e.target.value))}>
            <option value={1}>ย้อนหลัง 1 เดือน</option>
            <option value={3}>ย้อนหลัง 3 เดือน</option>
            <option value={6}>ย้อนหลัง 6 เดือน</option>
          </select>
          <button className="btn" onClick={()=>window.print()}><Icon name="download" size={15}/> Export PDF</button>
        </span>
      } />

      {/* ====== 1) ต้องดำเนินการด่วน — ขึ้นก่อนเป็นอันดับแรก ====== */}
      <SectionHead icon="alert" color="var(--red)" title="ต้องดำเนินการด่วน" sub="รายการวิกฤตที่รอการตัดสินใจ/แก้ไขจากผู้บริหาร" />
      <div className="panel" style={{borderColor:"#f0c4c4"}}>
        <div className="panel-head" style={{background:"var(--red-bg)"}}><div className="h-sm" style={{color:"var(--red-ink)"}}><Icon name="alert" size={15} style={{verticalAlign:"-2px",marginRight:6}}/>รายการวิกฤตที่ต้องดำเนินการ — {inProgress.length + criticalParts.length + overduePm.length + 1} รายการ</div></div>
        <div className="panel-body grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:11}}>
          <AlertRow icon="wrench" color="var(--red)" title={`เครื่องวิกฤตหยุด — ${inProgress.length} รายการ`} desc={inProgress.map(r=>r.mc).join(", ")||"—"} onClick={()=>ctx.go("d_requests")}/>
          <AlertRow icon="box" color="var(--red)" title={`อะไหล่ของหมด (วิกฤต) — ${criticalParts.length} รายการ`} desc={criticalParts.slice(0,4).map(p=>p.code).join(", ")+"…"} onClick={()=>ctx.go("d_reorder")}/>
          <AlertRow icon="cal" color="var(--amber)" title={`PM เกินกำหนด — ${overduePm.length} เครื่อง`} desc={overduePm.map(p=>p.mc).join(", ")} onClick={()=>ctx.go("d_pm")}/>
          <AlertRow icon="gauge" color="var(--amber)" title="PM Compliance ต่ำกว่าเป้า" desc="80% (เป้า > 95%)" onClick={()=>ctx.go("d_pm")}/>
        </div>
      </div>

      {/* ====== 2) ประสิทธิภาพเครื่องจักร — KPI + การวิเคราะห์ปัญหา ====== */}
      <SectionHead icon="gauge" title="ประสิทธิภาพเครื่องจักร" sub="ตัวชี้วัดความน่าเชื่อถือ (Reliability KPI) และการวิเคราะห์ปัญหาที่เกิดบ่อย" />
      <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(208px,1fr))", marginBottom:18 }}>
        {Dd.kpi.map(k => <KpiCard key={k.key} k={k} />)}
      </div>
      <div className="grid" style={{ gridTemplateColumns:"1.3fr 1fr", alignItems:"start" }}>
        {/* Pareto */}
        <div className="panel">
          <div className="panel-head"><div><div className="h-sm">Pareto — อะไหล่ที่เสียบ่อย</div><div className="tiny muted-2" style={{marginTop:3}}>Top Failure Analysis</div></div><Icon name="chart" size={18} style={{color:"var(--ink-3)"}}/></div>
          <div className="panel-body">
            <div style={{ display:"grid", gap:11 }}>
              {Dd.pareto.map((p,i)=>{
                cum += p.count; const cumPct = Math.round(cum/total*100);
                return (
                  <div key={p.code} className="row" style={{gap:12}}>
                    <div style={{width:128, flex:"none"}} className="small">
                      <div style={{fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{p.name}</div>
                      <div className="tiny muted-2 mono">{p.code}</div>
                    </div>
                    <div className="grow" style={{position:"relative"}}>
                      <HBar pct={p.count/maxPareto*100} color={i<3?"var(--red)":i<5?"var(--amber)":"var(--navy)"} />
                    </div>
                    <span className="mono small" style={{width:30, textAlign:"right", fontWeight:700}}>{p.count}</span>
                    <span className="mono tiny muted-2" style={{width:38, textAlign:"right"}}>{cumPct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="tiny muted-2" style={{marginTop:14}}>เส้นสะสม (%) — 3 รายการแรกคิดเป็นกว่า 60% ของการเสียทั้งหมด</div>
          </div>
        </div>

        {/* Risk matrix */}
        <div className="panel">
          <div className="panel-head"><div><div className="h-sm">Risk Matrix</div><div className="tiny muted-2" style={{marginTop:2}}>Machine Rank × Part Criticality</div></div></div>
          <div className="panel-body">
            <div style={{ display:"grid", gridTemplateColumns:"auto repeat(3,1fr)", gap:6 }}>
              <div></div>
              {Dd.riskGrid.cols.map(c=><div key={c} className="tiny" style={{textAlign:"center", fontWeight:700, color:"var(--ink-2)", paddingBottom:4}}>{c.replace(" Part","")}</div>)}
              {Dd.riskGrid.rows.map(row=>(
                <React.Fragment key={row}>
                  <div className="tiny" style={{ fontWeight:700, color:"var(--ink-2)", display:"flex", alignItems:"center" }}>{row}</div>
                  {Dd.riskGrid.zone[row].map((z,i)=>(
                    <div key={i} style={{
                      borderRadius:9, padding:"16px 6px", textAlign:"center", fontWeight:700, fontSize:11.5, letterSpacing:".03em",
                      background: z==="HIGH"?"var(--red)":z==="MEDIUM"?"var(--amber)":"var(--green)", color:"#fff"
                    }}>{z}</div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div className="row gap-sm wrap" style={{marginTop:14}}>
              <RiskTag zone="HIGH"/><RiskTag zone="MEDIUM"/><RiskTag zone="LOW"/>
            </div>
            <div className="tiny muted-2" style={{marginTop:10}}>Rank A เครื่องสำคัญ → HIGH RISK เสมอ · ส่ง LINE Alert ทันที</div>
          </div>
        </div>
      </div>

      {/* ====== 3) คลังอะไหล่ — สรุปตามกลุ่มเครื่อง + ตัวชี้วัดคลัง ====== */}
      <SectionHead icon="box" title="คลังอะไหล่" sub="มูลค่าคงคลัง ความเสี่ยงแยกตามกลุ่มเครื่องจักร และตัวชี้วัดด้านคลัง" />
      <div className="grid" style={{ gridTemplateColumns:"1.5fr 1fr", alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">สรุปคลังแยกตาม MC Group</div><span className="chip"><Icon name="box" size={13}/> รวม {Dd.fmtMoney(Dd.mcGroups.reduce((s,g)=>s+g.value,0))}</span></div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>MC Group</th><th className="num">เครื่อง</th><th className="num">อะไหล่</th><th className="num">มูลค่าคลัง</th><th className="num">Critical</th><th className="num">ต่ำกว่า ROP</th><th>Risk Zone</th></tr></thead>
              <tbody>
                {Dd.mcGroups.map(g=>(
                  <tr key={g.group} className={g.risk==="HIGH"?"row-red":undefined}>
                    <td style={{fontWeight:600}}>{g.group}</td>
                    <td className="num mono">{g.machines}</td>
                    <td className="num mono">{g.parts}</td>
                    <td className="num mono small">{Dd.fmtMoney(g.value)}</td>
                    <td className="num mono">{g.critical}</td>
                    <td className="num mono" style={{color:g.reorder>5?"var(--amber-ink)":"var(--ink)", fontWeight:g.reorder>5?700:400}}>{g.reorder}</td>
                    <td><RiskTag zone={g.risk}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div className="h-sm">ตัวชี้วัดคลังอะไหล่</div></div>
          <div className="panel-body grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
            {Dd.invKpi.map(k=>{
              const color = k.state==="bad"?"var(--red)":k.state==="warn"?"var(--amber)":"var(--green)";
              const pct = k.money ? Math.min(100, k.value/(k.target*2)*100) : k.unit==="%" ? k.value : Math.min(100,k.value/k.target*100);
              return (
                <div key={k.name} className="card card-pad">
                  <div className="small muted" style={{marginBottom:8}}>{k.name}</div>
                  <div className="row between" style={{alignItems:"baseline"}}>
                    <span className="mono" style={{fontSize:22, fontWeight:700}}>{k.money?Dd.fmtMoney(k.value):k.value+(k.unit==="%"?"%":"")}</span>
                    <span className="tiny muted-2">เป้า {k.money?Dd.fmtMoney(k.target):k.target+(k.unit==="%"?"%":"")}</span>
                  </div>
                  <div className="progress" style={{marginTop:9}}><span style={{width:pct+"%", background:color}}></span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====== 4) แนวโน้ม — Downtime รายเดือน ====== */}
      <SectionHead icon="chart" title="แนวโน้ม" sub={`การเปลี่ยนแปลงของ Downtime ช่วง ${rangeLabel}`} />
      <div className="panel">
        <div className="panel-head"><div className="h-sm">แนวโน้ม Downtime รายเดือน</div><span className="delta delta-up"><Icon name="arrowDown" size={13}/> ลดลงต่อเนื่อง</span></div>
        <div className="panel-body">
          <div style={{ display:"flex", alignItems:"flex-end", gap:14, height:170, padding:"0 8px" }}>
            {trend.map((d,i)=>(
              <div key={i} className="col" style={{flex:1, alignItems:"center", gap:7, justifyContent:"flex-end", height:"100%"}}>
                <span className="mono small" style={{fontWeight:700, color:"var(--ink-2)"}}>{d.v}</span>
                <div style={{ width:"100%", maxWidth:46, height:(d.v/maxDown*128)+"px", borderRadius:"6px 6px 0 0",
                  background: i===trend.length-1?"var(--green)":"linear-gradient(180deg,#b89668,#9a7b4f)" }}></div>
                <span className="tiny muted-2">{d.m}</span>
              </div>
            ))}
          </div>
          <div className="tiny muted-2" style={{marginTop:10, textAlign:"center"}}>หน่วย: ชั่วโมง/เดือน · {rangeLabel}</div>
        </div>
      </div>
    </div>
  );
}
function AlertRow({ icon, color, title, desc, onClick }) {
  return (
    <button className="card card-pad row between" style={{textAlign:"left", cursor:"pointer", width:"100%", gap:10}} onClick={onClick}>
      <div className="row" style={{gap:11}}>
        <span style={{color, flex:"none"}}><Icon name={icon} size={19}/></span>
        <div><div className="small" style={{fontWeight:600}}>{title}</div><div className="tiny muted-2 mono">{desc}</div></div>
      </div>
      <Icon name="chevR" size={16} style={{color:"var(--ink-3)", flex:"none"}}/>
    </button>
  );
}

/* ---------------- EditMachineModal ---------------- */
function EditMachineModal({ ctx, machine, onClose }) {
  const groups = [...new Set(Dd.machines.map(m => m.group))].filter(Boolean);
  const depts  = [...new Set(Dd.machines.map(m => m.dept))].filter(Boolean);
  const [f, setF] = useState({
    name: machine.name || "",
    group: machine.group || groups[0] || "",
    rank: machine.rank || "B",
    criticality: machine.crit || "MEDIUM",
    dept: machine.dept || depts[0] || "",
    location: machine.zone || "",
    maker: machine.maker || "",
    model: machine.model || "",
    installDate: machine.install || "",
    status: machine.status || "Running",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) { ctx.toast("กรุณากรอกชื่อเครื่อง", "error"); return; }
    setSaving(true);
    try {
      await DATA.updateMachine({ code: machine.code, ...f });
      await DATA.refresh();
      ctx.toast("บันทึกข้อมูล " + machine.code + " สำเร็จ", "check");
      window.dispatchEvent(new Event("mt-data-refresh"));
      onClose();
    } catch (e) {
      ctx.toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={"แก้ไขเครื่องจักร — " + machine.code} onClose={onClose}>
      <div className="col" style={{ gap:14 }}>
        <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <label className="field-label" style={{ gridColumn:"1/-1" }}>ชื่อเครื่อง *
            <input className="input" value={f.name} onChange={e=>set("name",e.target.value)} />
          </label>
          <label className="field-label">กลุ่ม
            <select className="select" value={f.group} onChange={e=>set("group",e.target.value)}>
              {groups.map(g=><option key={g}>{g}</option>)}
            </select>
          </label>
          <label className="field-label">Rank
            <select className="select" value={f.rank} onChange={e=>set("rank",e.target.value)}>
              <option value="A">A — Critical</option>
              <option value="B">B — Medium</option>
              <option value="C">C — Low</option>
            </select>
          </label>
          <label className="field-label">แผนก
            <select className="select" value={f.dept} onChange={e=>set("dept",e.target.value)}>
              {depts.map(d=><option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="field-label">Zone / Location
            <input className="input" value={f.location} onChange={e=>set("location",e.target.value)} />
          </label>
          <label className="field-label">ผู้ผลิต (Maker)
            <input className="input" value={f.maker} onChange={e=>set("maker",e.target.value)} />
          </label>
          <label className="field-label">รุ่น (Model)
            <input className="input" value={f.model} onChange={e=>set("model",e.target.value)} />
          </label>
          <label className="field-label">วันติดตั้ง
            <input className="input" type="date" value={f.installDate} onChange={e=>set("installDate",e.target.value)} />
          </label>
          <label className="field-label">สถานะ
            <select className="select" value={f.status} onChange={e=>set("status",e.target.value)}>
              <option value="Running">Running</option>
              <option value="Stop">Stop</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </label>
        </div>
        <div className="row gap-sm" style={{ justifyContent:"flex-end", marginTop:4 }}>
          <button className="btn" onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "กำลังบันทึก…" : <><Icon name="check" size={14}/> บันทึก</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- User Modals ---------------- */
const USER_ROLES = [
  ["operator","Operator — พนักงาน/ผู้ปฏิบัติงาน"],
  ["maintenance","Maintenance — ช่างซ่อมบำรุง / ฝ่าย MT"],
  ["manager","Manager — ผู้จัดการ"],
  ["store","Store Keeper — คลังอะไหล่"],
  ["purchasing","Purchasing — จัดซื้อ"],
  ["admin","Admin — ผู้ดูแลระบบ"],
];

function UserForm({ f, set }) {
  return (
    <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:12 }}>
      <label className="field-label" style={{ gridColumn:"1/-1" }}>ชื่อ-นามสกุล *
        <input className="input" value={f.fullName} onChange={e=>set("fullName",e.target.value)} placeholder="เช่น สมชาย ใจดี" />
      </label>
      <label className="field-label">บทบาท (Role)
        <select className="select" value={f.role} onChange={e=>set("role",e.target.value)}>
          {USER_ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="field-label">อีเมล
        <input className="input" type="email" value={f.email} onChange={e=>set("email",e.target.value)} placeholder="user@company.com" />
      </label>
      <label className="field-label">เบอร์โทร
        <input className="input" value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="08x-xxx-xxxx" />
      </label>
      <label className="field-label">Telegram Chat ID
        <input className="input" value={f.telegramId} onChange={e=>set("telegramId",e.target.value)} placeholder="เช่น 123456789" />
      </label>
    </div>
  );
}

function AddUserModal({ ctx, onClose }) {
  const [f, setF] = useState({ fullName:"", role:"operator", email:"", phone:"", telegramId:"" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const submit = async () => {
    if (!f.fullName.trim()) { ctx.toast("กรุณากรอกชื่อ-นามสกุล", "error"); return; }
    setSaving(true);
    try {
      await DATA.createUser({ ...f, fullName: f.fullName.trim() });
      await DATA.refresh();
      ctx.toast("เพิ่มผู้ใช้ " + f.fullName.trim() + " สำเร็จ", "check");
      window.dispatchEvent(new Event("mt-data-refresh"));
      onClose();
    } catch(e) { ctx.toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="เพิ่มผู้ใช้งานใหม่" onClose={onClose}>
      <div className="col" style={{ gap:14 }}>
        <UserForm f={f} set={set} />
        <div className="row gap-sm" style={{ justifyContent:"flex-end", marginTop:4 }}>
          <button className="btn" onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "กำลังบันทึก…" : <><Icon name="plus" size={14}/> เพิ่มผู้ใช้</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({ ctx, user, onClose }) {
  const [f, setF] = useState({
    fullName:   user.name       || "",
    role:       user.dbRole     || "operator",
    email:      user.email      || "",
    phone:      user.phone      || "",
    telegramId: user.telegramId || "",
    isActive:   user.status === "Active",
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const submit = async () => {
    if (!f.fullName.trim()) { ctx.toast("กรุณากรอกชื่อ-นามสกุล", "error"); return; }
    setSaving(true);
    try {
      await DATA.updateUser({ db_id: user.db_id, ...f, fullName: f.fullName.trim() });
      await DATA.refresh();
      ctx.toast("บันทึกข้อมูล " + f.fullName.trim() + " สำเร็จ", "check");
      window.dispatchEvent(new Event("mt-data-refresh"));
      onClose();
    } catch(e) { ctx.toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={"แก้ไขผู้ใช้ — " + user.id} onClose={onClose}>
      <div className="col" style={{ gap:14 }}>
        <UserForm f={f} set={set} />
        <label className="field-label row gap-sm" style={{ flexDirection:"row", alignItems:"center", cursor:"pointer" }}>
          <input type="checkbox" checked={f.isActive} onChange={e=>set("isActive",e.target.checked)} style={{ width:16, height:16 }} />
          <span>บัญชีใช้งานได้ (Active)</span>
        </label>
        <div className="row gap-sm" style={{ justifyContent:"flex-end", marginTop:4 }}>
          <button className="btn" onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "กำลังบันทึก…" : <><Icon name="check" size={14}/> บันทึก</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- EditPartModal ---------------- */
function EditPartModal({ ctx, part, onClose }) {
  return (
    <Modal title={"แก้ไขอะไหล่ — " + part.code} onClose={onClose}>
      <EditPartFields ctx={ctx} part={part} onDone={onClose} onCancel={onClose} />
    </Modal>
  );
}

/* ---------------- EditPartFields (shared form, no Modal wrapper) ---------------- */
function EditPartFields({ ctx, part, onDone, onCancel }) {
  const groups = [...new Set(Dd.parts.map(p => p.group))].filter(Boolean);
  const ranks = ["Critical", "Medium", "Low"];
  const [f, setF] = useState({
    name:     part.name     || "",
    group:    part.group    || groups[0] || "",
    partRank: part.partRank || "Medium",
    max:      part.max      ?? "",
    min:      part.min      ?? "",
    safety:   part.safety   ?? "",
    rop:      part.rop      ?? "",
    price:    part.price    ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) { ctx.toast("กรุณากรอกชื่ออะไหล่", "error"); return; }
    setSaving(true);
    try {
      await DATA.updatePart({ code: part.code, ...f,
        max: Number(f.max)||0, min: Number(f.min)||0,
        safety: Number(f.safety)||0, rop: Number(f.rop)||0, price: Number(f.price)||0 });
      await DATA.refresh();
      ctx.toast("บันทึก " + part.code + " สำเร็จ", "check");
      window.dispatchEvent(new Event("mt-data-refresh"));
      onDone();
    } catch (e) {
      ctx.toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="col" style={{ gap:14 }}>
      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <label className="field-label" style={{ gridColumn:"1/-1" }}>ชื่ออะไหล่ *
          <input className="input" value={f.name} onChange={e=>set("name",e.target.value)} />
        </label>
        <label className="field-label">กลุ่มเครื่องจักร
          <select className="select" value={f.group} onChange={e=>set("group",e.target.value)}>
            {groups.map(g=><option key={g}>{g}</option>)}
          </select>
        </label>
        <label className="field-label">Part Rank
          <select className="select" value={f.partRank} onChange={e=>set("partRank",e.target.value)}>
            {ranks.map(r=><option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="field-label">Max Stock
          <input className="input" type="number" min="0" value={f.max} onChange={e=>set("max",e.target.value)} />
        </label>
        <label className="field-label">Min Stock
          <input className="input" type="number" min="0" value={f.min} onChange={e=>set("min",e.target.value)} />
        </label>
        <label className="field-label">Safety Stock
          <input className="input" type="number" min="0" value={f.safety} onChange={e=>set("safety",e.target.value)} />
        </label>
        <label className="field-label">ROP (Reorder Point)
          <input className="input" type="number" min="0" value={f.rop} onChange={e=>set("rop",e.target.value)} />
        </label>
        <label className="field-label" style={{ gridColumn:"1/-1" }}>ราคาต่อหน่วย (฿)
          <input className="input" type="number" min="0" value={f.price} onChange={e=>set("price",e.target.value)} />
        </label>
      </div>
      <div className="row gap-sm" style={{ justifyContent:"flex-end", marginTop:4 }}>
        <button className="btn" onClick={onCancel} disabled={saving}>ยกเลิก</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? "กำลังบันทึก…" : <><Icon name="check" size={14}/> บันทึก</>}
        </button>
      </div>
    </div>
  );
}

/* ---------------- AddMachineModal ---------------- */
function AddMachineModal({ ctx, onClose }) {
  const groups = [...new Set(Dd.machines.map(m => m.group))].filter(Boolean);
  const depts  = [...new Set(Dd.machines.map(m => m.dept))].filter(Boolean);
  const [f, setF] = useState({ code:"", name:"", group: groups[0]||"", rank:"B", criticality:"MEDIUM", dept: depts[0]||"", location:"", maker:"", model:"", installDate:"", status:"Running" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.code.trim() || !f.name.trim()) { ctx.toast("กรุณากรอก รหัส และ ชื่อเครื่อง", "error"); return; }
    setSaving(true);
    try {
      await DATA.createMachine(f);
      await DATA.refresh();
      ctx.toast("เพิ่มเครื่อง " + f.code + " สำเร็จ", "check");
      window.dispatchEvent(new Event("mt-data-refresh"));
      onClose();
    } catch (e) {
      ctx.toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="เพิ่มเครื่องจักรใหม่" onClose={onClose}>
      <div className="col" style={{ gap:14 }}>
        <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <label className="field-label">รหัสเครื่อง *
            <input className="input" placeholder="เช่น MC-010" value={f.code} onChange={e=>set("code",e.target.value.toUpperCase())} />
          </label>
          <label className="field-label">ชื่อเครื่อง *
            <input className="input" placeholder="ชื่อเครื่องจักร" value={f.name} onChange={e=>set("name",e.target.value)} />
          </label>
          <label className="field-label">กลุ่ม
            <select className="select" value={f.group} onChange={e=>set("group",e.target.value)}>
              {groups.map(g=><option key={g}>{g}</option>)}
            </select>
          </label>
          <label className="field-label">Rank
            <select className="select" value={f.rank} onChange={e=>set("rank",e.target.value)}>
              <option value="A">A — Critical</option>
              <option value="B">B — Medium</option>
              <option value="C">C — Low</option>
            </select>
          </label>
          <label className="field-label">แผนก
            <select className="select" value={f.dept} onChange={e=>set("dept",e.target.value)}>
              {depts.map(d=><option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="field-label">Zone / Location
            <input className="input" placeholder="เช่น Zone A" value={f.location} onChange={e=>set("location",e.target.value)} />
          </label>
          <label className="field-label">ผู้ผลิต (Maker)
            <input className="input" placeholder="เช่น Fanuc" value={f.maker} onChange={e=>set("maker",e.target.value)} />
          </label>
          <label className="field-label">รุ่น (Model)
            <input className="input" placeholder="เช่น MX-200" value={f.model} onChange={e=>set("model",e.target.value)} />
          </label>
          <label className="field-label">วันติดตั้ง
            <input className="input" type="date" value={f.installDate} onChange={e=>set("installDate",e.target.value)} />
          </label>
          <label className="field-label">สถานะเริ่มต้น
            <select className="select" value={f.status} onChange={e=>set("status",e.target.value)}>
              <option value="Running">Running</option>
              <option value="Stop">Stop</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </label>
        </div>
        <div className="row gap-sm" style={{ justifyContent:"flex-end", marginTop:4 }}>
          <button className="btn" onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "กำลังบันทึก…" : <><Icon name="plus" size={14}/> เพิ่มเครื่อง</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- 5.14 Admin ---------------- */
function Admin({ ctx }) {
  const [tab, setTab] = useState("machines");
  const [qr, setQr] = useState(null);
  const [testingQr, setTestingQr] = useState(false);
  const [addingMachine, setAddingMachine] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [addingPart, setAddingPart] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const partGroups = [...new Set(Dd.parts.map(p => p.group))].filter(Boolean);
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingCode, setDeletingCode] = useState(null);
  const isAdmin = ctx.role === "Admin";
  const tabs = [["machines","เครื่องจักร","machine"],["parts","อะไหล่","box"],...(isAdmin?[["users","ผู้ใช้/สิทธิ์","user"]]:[])];

  const deleteMachine = async (m) => {
    if (deletingCode) return;
    if (!window.confirm("ลบเครื่องจักร " + m.code + " — " + m.name + " ?")) return;
    setDeletingCode(m.code);
    try {
      await DATA.deleteMachine(m.code);
      await DATA.refresh();
      ctx.toast("ลบเครื่อง " + m.code + " แล้ว", "check");
      window.dispatchEvent(new Event("mt-data-refresh"));
    } catch (e) {
      ctx.toast(e.message, "error");
    } finally {
      setDeletingCode(null);
    }
  };
  return (
    <div>
      <PageHead title={isAdmin?"ผู้ดูแลระบบ (Admin)":"จัดการเครื่องจักร & อะไหล่"} sub="จัดการ Master Data — เครื่องจักร · อะไหล่" />
      <div className="row gap-sm" style={{marginBottom:16}}>
        {tabs.map(([v,l,ic])=>(
          <button key={v} className={"chip chip-btn"+(tab===v?" on":"")} onClick={()=>setTab(v)} style={{padding:"8px 14px"}}>
            <Icon name={ic} size={14}/> {l}
          </button>
        ))}
      </div>

      {addingMachine && <AddMachineModal ctx={ctx} onClose={()=>setAddingMachine(false)} />}
      {editingMachine && <EditMachineModal ctx={ctx} machine={editingMachine} onClose={()=>setEditingMachine(null)} />}
      {addingPart && <AddPartModal ctx={ctx} groups={partGroups} onClose={()=>setAddingPart(false)} />}
      {editingPart && <EditPartModal ctx={ctx} part={editingPart} onClose={()=>setEditingPart(null)} />}
      {addingUser && <AddUserModal ctx={ctx} onClose={()=>setAddingUser(false)} />}
      {editingUser && <EditUserModal ctx={ctx} user={editingUser} onClose={()=>setEditingUser(null)} />}
      {testingQr && <TestQRModal onClose={()=>setTestingQr(false)} />}

      {tab==="machines" && (
        <div className="panel">
          <div className="panel-head"><div className="h-sm">เครื่องจักร ({Dd.machines.length})</div>
            <div className="row gap-sm">
              <button className="btn btn-sm" onClick={()=>setTestingQr(true)}><Icon name="qr" size={14}/> ทดสอบ QR</button>
              <button className="btn btn-sm btn-primary" onClick={()=>setAddingMachine(true)}><Icon name="plus" size={14}/> เพิ่มเครื่อง</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>รหัส</th><th>ชื่อ</th><th>กลุ่ม</th><th>Rank</th><th>แผนก</th><th>ผู้ผลิต/รุ่น</th><th>สถานะ</th><th>QR Code</th><th></th></tr></thead>
              <tbody>
                {Dd.machines.map(m=>(
                  <tr key={m.code}>
                    <td className="cell-code">{m.code}</td>
                    <td className="small" style={{fontWeight:600}}>{m.name}</td>
                    <td><span className="chip">{m.group}</span></td>
                    <td><RankPill rank={m.rank}/></td>
                    <td className="small muted">{m.dept}</td>
                    <td className="small muted">{m.maker} · {m.model}</td>
                    <td><span className={"badge "+(m.status==="Running"?"b-green":"b-red")}><span className="dot"></span>{m.status}</span></td>
                    <td><button className="btn btn-sm" onClick={()=>setQr(m)}><Icon name="qr" size={14}/> สร้าง QR</button></td>
                    <td><div className="row gap-sm">
                      <button className="icon-btn" style={{width:30,height:30}} onClick={()=>setEditingMachine(m)}><Icon name="edit" size={14}/></button>
                      <button className="icon-btn" style={{width:30,height:30}} disabled={deletingCode===m.code} onClick={()=>deleteMachine(m)}><Icon name="trash" size={14}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="parts" && (
        <div className="panel">
          <div className="panel-head"><div className="h-sm">อะไหล่ ({Dd.parts.length})</div><button className="btn btn-sm btn-primary" onClick={()=>setAddingPart(true)}><Icon name="plus" size={14}/> เพิ่มอะไหล่</button></div>
          <div className="table-wrap" style={{maxHeight:"60vh"}}>
            <table className="tbl">
              <thead><tr><th>Part Code</th><th>ชื่อ</th><th>กลุ่ม</th><th>Rank</th><th>แบรนด์</th><th className="num">ROP</th><th className="num">คงคลัง</th><th>Owner</th><th></th></tr></thead>
              <tbody>
                {Dd.parts.map(p=>(
                  <tr key={p.code}>
                    <td className="cell-code">{p.code}</td>
                    <td className="small" style={{maxWidth:220}}>{p.name}</td>
                    <td><span className="chip">{p.group}</span></td>
                    <td><PartRankTag rank={p.partRank}/></td>
                    <td className="small muted">{p.brand}</td>
                    <td className="num mono">{p.rop}</td>
                    <td className="num mono">{p.cur}</td>
                    <td className="small muted">{p.owner}</td>
                    <td><button className="icon-btn" style={{width:30,height:30}} onClick={()=>setEditingPart(p)}><Icon name="edit" size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="users" && (
        <div className="panel">
          <div className="panel-head"><div className="h-sm">ผู้ใช้งาน ({Dd.users.length})</div><button className="btn btn-sm btn-primary" onClick={()=>setAddingUser(true)}><Icon name="plus" size={14}/> เพิ่มผู้ใช้</button></div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>ID</th><th>ชื่อ</th><th>อีเมล</th><th>บทบาท (Role)</th><th>โทร / Telegram</th><th>สถานะ</th><th></th></tr></thead>
              <tbody>
                {Dd.users.map(u=>(
                  <tr key={u.id}>
                    <td className="cell-code">{u.id}</td>
                    <td className="small" style={{fontWeight:600}}>{u.name}</td>
                    <td className="mono small muted">{u.email || "—"}</td>
                    <td><span className="chip">{u.role}</span> <span className="tiny muted-2">{Dd.roleLabelTH[u.role]}</span></td>
                    <td className="small muted">{u.phone || "—"}{u.telegramId ? <span className="tiny" style={{marginLeft:6, color:"var(--accent)"}}>TG:{u.telegramId}</span> : null}</td>
                    <td><span className={"badge "+(u.status==="Active"?"b-green":"b-red")}><span className="dot"></span>{u.status}</span></td>
                    <td><button className="icon-btn" style={{width:30,height:30}} onClick={()=>setEditingUser(u)}><Icon name="edit" size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {qr && (() => {
        const qrUrl = window.location.origin + window.location.pathname + "?mc=" + qr.code;
        const doDownload = () => {
          if (!window.QRCode) { alert("QR library ยังไม่โหลด"); return; }
          const tmp = document.createElement("div");
          tmp.style.cssText = "position:fixed;left:-9999px";
          document.body.appendChild(tmp);
          new window.QRCode(tmp, { text: qrUrl, width: 400, height: 400,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.M });
          setTimeout(() => {
            const canvas = tmp.querySelector("canvas");
            if (canvas) { const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = "QR-" + qr.code + ".png"; a.click(); }
            document.body.removeChild(tmp);
          }, 100);
        };
        return (
        <Modal title={"QR Code — "+qr.code} onClose={()=>setQr(null)}>
          <div className="col" style={{alignItems:"center", gap:16, padding:"8px 0"}}>
            <QRBox size={200} value={qrUrl} />
            <div style={{textAlign:"center"}}>
              <div className="mono" style={{fontWeight:700, fontSize:18}}>{qr.code}</div>
              <div className="small muted">{qr.name}</div>
            </div>
            <div className="card card-pad small" style={{width:"100%", background:"var(--surface-2)"}}>
              <div style={{fontWeight:600, marginBottom:4}}>ติด QR นี้ที่หน้าเครื่อง</div>
              <div className="muted tiny mono" style={{wordBreak:"break-all"}}>{qrUrl}</div>
              <div className="small muted" style={{marginTop:6}}>สแกนด้วยมือถือ → เปิดหน้าแจ้งซ่อม <strong>{qr.code}</strong> ทันที</div>
            </div>
            <div className="row gap-sm" style={{width:"100%"}}>
              <button className="btn btn-block" onClick={doDownload}><Icon name="download" size={15}/> ดาวน์โหลด PNG</button>
              <button className="btn btn-primary btn-block" onClick={()=>setQr(null)}>เสร็จสิ้น</button>
            </div>
          </div>
        </Modal>
        );
      })()}
    </div>
  );
}

/* ---------------- ทดสอบ QR Code (อัปโหลดรูป → ตรวจสอบลิงก์/เครื่องจักร) ---------------- */
function TestQRModal({ onClose }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    setError(null); setResult(null); setImgSrc(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImgSrc(e.target.result);
      const img = new Image();
      img.onload = () => {
        if (typeof jsQR === "undefined") { setError("ไม่พบไลบรารีอ่าน QR (jsQR)"); return; }
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const c2d = canvas.getContext("2d");
        c2d.drawImage(img, 0, 0);
        const imageData = c2d.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) setResult(code.data);
        else setError("ไม่พบ QR Code ในรูปภาพนี้ ลองใช้รูปที่คมชัดกว่านี้");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  let mc = null;
  if (result) {
    try { mc = new URL(result).searchParams.get("mc"); } catch {}
  }
  const machine = mc ? Dd.machineByCode(mc) : null;

  return (
    <Modal title="ทดสอบ QR Code" onClose={onClose}>
      <div className="stack">
        <div className="small muted">อัปโหลดรูปภาพ QR Code (เช่น ไฟล์ที่ดาวน์โหลดไว้ หรือรูปถ่าย QR ที่ติดหน้าเครื่อง) เพื่อตรวจสอบว่าลิงก์ที่เข้ารหัสไว้ถูกต้องและพาไปหน้าเครื่องจักรที่ถูกต้องหรือไม่</div>
        <input className="input" type="file" accept="image/*" onChange={e=>handleFile(e.target.files[0])} />
        {imgSrc && <img src={imgSrc} alt="QR ที่อัปโหลด" style={{ width:160, height:160, objectFit:"contain", border:"1px solid var(--border)", borderRadius:8, alignSelf:"center" }} />}
        {error && <div className="small" style={{ color:"var(--red-ink)" }}><Icon name="alert" size={14}/> {error}</div>}
        {result &&
          <div className="card card-pad" style={{ background:"var(--surface-2)" }}>
            <div className="tiny muted">ลิงก์ที่อ่านได้จาก QR</div>
            <div className="mono tiny" style={{ wordBreak:"break-all", marginTop:4 }}>{result}</div>
            <div style={{ marginTop:10 }}>
              {machine
                ? <div className="small" style={{ color:"var(--green-ink)" }}><Icon name="check" size={14}/> ถูกต้อง — ลิงก์นี้จะพาไปหน้าเครื่องจักร <strong>{machine.code} — {machine.name}</strong></div>
                : mc
                  ? <div className="small" style={{ color:"var(--red-ink)" }}><Icon name="alert" size={14}/> ไม่พบเครื่องจักรรหัส "{mc}" ในระบบ</div>
                  : <div className="small" style={{ color:"var(--red-ink)" }}><Icon name="alert" size={14}/> ลิงก์นี้ไม่ใช่ลิงก์ QR เครื่องจักรของระบบ (ไม่มีพารามิเตอร์ mc)</div>}
            </div>
          </div>}
        {result &&
          <button className="btn btn-primary btn-block" onClick={()=>window.open(result, "_blank")}>
            <Icon name="qr" size={15}/> เปิดลิงก์นี้ (จำลองการสแกน)
          </button>}
      </div>
    </Modal>
  );
}

Object.assign(window, { Dashboard, Admin, AlertRow });
