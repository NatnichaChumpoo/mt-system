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

/* ---------------- Reliability Analysis ---------------- */
function ReliabilityDashboard({ ctx }) {
  const [months, setMonths] = React.useState(6);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    DATA.loadReliability(months)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [months]);

  const doExport = () => {
    if (!data) return;
    const { pareto=[], mtbfPerMachine=[], repeatFailure=[], costPerMachine=[] } = data;
    const rows = pareto.map(p => ({
      "เครื่อง": p.code, "ชื่อ": p.name, "Rank": p.rank,
      "Breakdown (ครั้ง)": p.breakdown_count,
      "Total Downtime (ชม.)": p.total_downtime||0,
      "Avg Downtime (ชม.)": p.avg_downtime||0,
    }));
    exportRowsToXlsx(ctx, rows, "Pareto", `Reliability_${months}M_${new Date().toISOString().slice(0,10)}.xlsx`, { emptyMsg:"ไม่มีข้อมูล" });
  };

  if (loading) return <div style={{ padding:40, textAlign:"center" }} className="muted">กำลังโหลดข้อมูล…</div>;
  if (error)   return <div style={{ padding:40, textAlign:"center", color:"var(--red)" }}>โหลดข้อมูลไม่สำเร็จ: {error}</div>;

  const { pareto=[], trend=[], rootCause=[], mtbfPerMachine=[], repeatFailure=[], costPerMachine=[] } = data || {};
  const maxBreak = pareto[0]?.breakdown_count || 1;
  const maxTrend = Math.max(...trend.map(t => t.total_downtime||0), 1);
  const totalRC   = rootCause.reduce((s,r) => s+r.count, 0) || 1;
  const maxCost   = costPerMachine[0]?.parts_cost || 1;
  const RC_COLORS = ["var(--accent)","var(--green)","var(--amber)","var(--red)","#a78bfa"];
  const MONTH_TH  = {"01":"ม.ค.","02":"ก.พ.","03":"มี.ค.","04":"เม.ย.","05":"พ.ค.",
    "06":"มิ.ย.","07":"ก.ค.","08":"ส.ค.","09":"ก.ย.","10":"ต.ค.","11":"พ.ย.","12":"ธ.ค."};
  const fmtMonth = (ym) => { const [,m] = ym.split("-"); return MONTH_TH[m]||ym; };

  return (
    <div>
      <PageHead title="Reliability Analysis"
        sub={`วิเคราะห์ความน่าเชื่อถือเครื่องจักร — ย้อนหลัง ${months} เดือน`}
        actions={
          <div className="row gap-sm">
            <select className="select" style={{ width:"auto" }} value={months} onChange={e=>setMonths(Number(e.target.value))}>
              <option value={1}>1 เดือน</option>
              <option value={3}>3 เดือน</option>
              <option value={6}>6 เดือน</option>
              <option value={12}>12 เดือน</option>
            </select>
            <button className="btn" onClick={doExport}><Icon name="download" size={15}/> Export Excel</button>
          </div>
        }
      />

      {/* ===== 1) Pareto ===== */}
      <SectionHead icon="chart" title="Pareto — เครื่องที่เสียบ่อยสุด" sub="เรียงตามจำนวนครั้งที่เกิด Breakdown" />
      <div className="panel" style={{ marginBottom:20 }}>
        <div style={{ padding:"16px 20px", display:"grid", gap:10 }}>
          {pareto.length===0 && <div className="muted small" style={{ textAlign:"center", padding:24 }}>ยังไม่มีข้อมูลใบแจ้งซ่อม</div>}
          {pareto.map((p,i) => (
            <div key={p.code} style={{ display:"grid", gridTemplateColumns:"100px 1fr 90px 70px", alignItems:"center", gap:12 }}>
              <div><div className="mono small" style={{ fontWeight:700 }}>{p.code}</div><div className="tiny muted-2">{p.name}</div></div>
              <div style={{ background:"var(--bg)", borderRadius:6, height:18, overflow:"hidden" }}>
                <div style={{ width:Math.round(p.breakdown_count/maxBreak*100)+"%", height:"100%", background:i===0?"var(--red)":i<=2?"var(--amber)":"var(--accent)", borderRadius:6, transition:"width .4s" }}/>
              </div>
              <div className="mono small" style={{ textAlign:"right", fontWeight:600 }}>{p.breakdown_count} ครั้ง</div>
              <RankPill rank={p.rank}/>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 2) Downtime Trend + Root Cause ===== */}
      <div className="grid" style={{ gridTemplateColumns:"1.4fr 1fr", gap:16, marginBottom:20, alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div><div className="h-sm">Downtime Trend รายเดือน</div><div className="tiny muted-2" style={{ marginTop:3 }}>ชั่วโมงหยุดเครื่องรวม {months} เดือนล่าสุด</div></div></div>
          <div style={{ padding:"16px 20px" }}>
            {trend.length===0 && <div className="muted small" style={{ textAlign:"center", padding:24 }}>ยังไม่มีข้อมูล</div>}
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:140 }}>
              {trend.map(t => (
                <div key={t.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div className="tiny mono muted" style={{ fontWeight:600 }}>{t.total_downtime||0}</div>
                  <div style={{ width:"100%", background:(t.total_downtime||0)===maxTrend?"var(--red)":"var(--accent)", borderRadius:"4px 4px 0 0",
                    height:Math.max(Math.round((t.total_downtime||0)/maxTrend*100),4)+"px", transition:"height .4s" }}/>
                  <div className="tiny muted-2">{fmtMonth(t.month)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><div className="h-sm">Root Cause Breakdown</div><div className="tiny muted-2" style={{ marginTop:3 }}>สาเหตุการเสียจากบันทึกซ่อม</div></div></div>
          <div style={{ padding:"16px 20px", display:"grid", gap:10 }}>
            {rootCause.length===0 && <div className="muted small" style={{ textAlign:"center", padding:24 }}>ยังไม่มีข้อมูลบันทึกซ่อม</div>}
            {rootCause.map((r,i) => (
              <div key={r.category} style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:10 }}>
                <div>
                  <div className="small" style={{ marginBottom:4 }}><span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", background:RC_COLORS[i], marginRight:6 }}/>{r.category}</div>
                  <div style={{ background:"var(--bg)", borderRadius:4, height:8, overflow:"hidden" }}>
                    <div style={{ width:Math.round(r.count/totalRC*100)+"%", height:"100%", background:RC_COLORS[i], borderRadius:4 }}/>
                  </div>
                </div>
                <div className="mono small" style={{ fontWeight:700 }}>{Math.round(r.count/totalRC*100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 3) Repeat Failure + Cost Analysis ===== */}
      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20, alignItems:"start" }}>
        {/* Repeat Failure */}
        <div className="panel">
          <div className="panel-head">
            <div><div className="h-sm">Repeat Failure</div><div className="tiny muted-2" style={{ marginTop:3 }}>เครื่องที่เสียปัญหาเดิมซ้ำ &gt; 1 ครั้ง</div></div>
            {repeatFailure.length>0 && <span className="badge b-red">{repeatFailure.length} รายการ</span>}
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>เครื่อง</th><th>สาเหตุ</th><th className="num">ซ้ำ</th><th>Rank</th></tr></thead>
              <tbody>
                {repeatFailure.length===0 && <tr><td colSpan={4} className="empty" style={{ textAlign:"center", padding:24 }}>ไม่พบปัญหาซ้ำในช่วงนี้ ✓</td></tr>}
                {repeatFailure.map((r,i) => (
                  <tr key={i}>
                    <td><span className="mono small" style={{ fontWeight:700 }}>{r.code}</span><div className="tiny muted-2">{r.name}</div></td>
                    <td className="small">{r.category}</td>
                    <td className="num mono" style={{ color:"var(--red)", fontWeight:700 }}>{r.repeat_count}x</td>
                    <td><RankPill rank={r.rank}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="panel">
          <div className="panel-head"><div><div className="h-sm">Cost Analysis — ค่าอะไหล่รายเครื่อง</div><div className="tiny muted-2" style={{ marginTop:3 }}>มูลค่าอะไหล่ที่ใช้ซ่อมในช่วงนี้</div></div></div>
          <div style={{ padding:"16px 20px", display:"grid", gap:10 }}>
            {costPerMachine.length===0 && <div className="muted small" style={{ textAlign:"center", padding:24 }}>ยังไม่มีข้อมูลการใช้อะไหล่</div>}
            {costPerMachine.map((c,i) => (
              <div key={c.code} style={{ display:"grid", gridTemplateColumns:"100px 1fr 100px", alignItems:"center", gap:10 }}>
                <div><div className="mono small" style={{ fontWeight:700 }}>{c.code}</div><div className="tiny muted-2">{c.repairs} ครั้งซ่อม</div></div>
                <div style={{ background:"var(--bg)", borderRadius:4, height:14, overflow:"hidden" }}>
                  <div style={{ width:Math.round(c.parts_cost/maxCost*100)+"%", height:"100%", background:i===0?"var(--red)":i<=2?"var(--amber)":"var(--green)", borderRadius:4 }}/>
                </div>
                <div className="mono small" style={{ textAlign:"right", fontWeight:600 }}>{Dd.fmtMoney(c.parts_cost)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 4) MTBF/MTTR per machine ===== */}
      <SectionHead icon="gauge" title="MTBF / MTTR รายเครื่อง" sub={`ย้อนหลัง ${months} เดือน — Mean Time Between Failures · Mean Time To Repair`} />
      <div className="panel">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>เครื่อง</th><th>Rank</th><th className="num">Breakdown</th><th className="num">Total Downtime</th><th className="num">MTTR (ชม.)</th><th className="num">MTBF (ชม.)</th><th>ความเสี่ยง</th></tr></thead>
            <tbody>
              {mtbfPerMachine.length===0 && <tr><td colSpan={7} className="empty" style={{ textAlign:"center", padding:32 }}>ไม่มีข้อมูล Breakdown ในช่วงนี้</td></tr>}
              {mtbfPerMachine.map(m => {
                const riskCls = m.rank==="A"?"b-red":m.rank==="B"?"b-amber":"b-blue";
                const risk    = m.rank==="A"?"HIGH":m.rank==="B"?"MEDIUM":"LOW";
                return (
                  <tr key={m.code}>
                    <td><span className="mono small" style={{ fontWeight:700 }}>{m.code}</span><div className="tiny muted-2">{m.name}</div></td>
                    <td><RankPill rank={m.rank}/></td>
                    <td className="num mono">{m.breakdowns}</td>
                    <td className="num mono">{m.total_downtime||"—"} ชม.</td>
                    <td className="num mono">{m.mttr||"—"}</td>
                    <td className="num mono">{m.mtbf||"—"}</td>
                    <td><span className={"badge "+riskCls}>{risk}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Monthly Report ---------------- */
const MONTH_NAMES_TH = ["","มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function MonthlyReport({ ctx }) {
  const now   = new Date();
  const [year,  setYear]  = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [data,  setData]  = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error,   setError]   = React.useState(null);

  const load = () => {
    setLoading(true); setError(null); setData(null);
    DATA.loadMonthlyReport(year, month)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  const PRIORITY_TH = { Critical:"วิกฤต", High:"สูง", Medium:"ปานกลาง", Low:"ต่ำ" };
  const STATUS_TH   = { Completed:"เสร็จสิ้น", "In Progress":"กำลังซ่อม", New:"ใหม่", Waiting:"รอดำเนินการ", Resubmitted:"ส่งซ่อมใหม่" };
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
  const fmtNum  = (n) => Number(n||0).toLocaleString("en-US");
  const yearOpts = [now.getFullYear(), now.getFullYear()-1, now.getFullYear()-2];

  return (
    <div>
      {/* ===== Controls (ซ่อนตอนพิมพ์) ===== */}
      <div className="no-print">
        <PageHead title="รายงานประจำเดือน" sub="สรุปงานซ่อมบำรุงและแผน PM สำหรับผู้บริหาร"
          actions={
            <div className="row gap-sm">
              <select className="select" style={{ width:"auto" }} value={month} onChange={e=>setMonth(Number(e.target.value))}>
                {MONTH_NAMES_TH.slice(1).map((n,i)=><option key={i+1} value={i+1}>{n}</option>)}
              </select>
              <select className="select" style={{ width:"auto" }} value={year} onChange={e=>setYear(Number(e.target.value))}>
                {yearOpts.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <button className="btn btn-primary" onClick={load}><Icon name="refresh" size={15}/> โหลดรายงาน</button>
              {data && <button className="btn" onClick={()=>window.print()}><Icon name="download" size={15}/> พิมพ์ / PDF</button>}
            </div>
          }
        />
        {!data && !loading && !error && (
          <div className="panel" style={{ textAlign:"center", padding:48 }}>
            <div className="muted">เลือกเดือนและปี แล้วกด "โหลดรายงาน"</div>
          </div>
        )}
        {loading && <div style={{ padding:48, textAlign:"center" }} className="muted">กำลังโหลด…</div>}
        {error   && <div style={{ padding:48, textAlign:"center", color:"var(--red)" }}>โหลดไม่สำเร็จ: {error}</div>}
      </div>

      {/* ===== Printable Report ===== */}
      {data && (() => {
        const { kpi={}, pmKpi={}, repairs=[], pmRows=[], topMachines=[], costRow={}, year:y, month:m } = data;
        const periodLabel = `${MONTH_NAMES_TH[m]} ${y}`;

        return (
          <div className="print-report">
            {/* Header */}
            <div className="rpt-header">
              <div className="rpt-header-left">
                <img src="/assets/logo.png" alt="CAR Logo" className="rpt-logo" />
                <div>
                  <div className="rpt-company">Complete Auto Rubber Manufacturing Co., Ltd.</div>
                  <div className="rpt-title">รายงานงานซ่อมบำรุงประจำเดือน</div>
                  <div className="rpt-subtitle">Monthly Maintenance Report — {periodLabel}</div>
                </div>
              </div>
              <div className="rpt-meta">
                <div className="rpt-meta-small">วันที่พิมพ์: {fmtDate(new Date().toISOString())}</div>
                <div className="rpt-meta-small">จัดทำโดย: ระบบ MT</div>
              </div>
            </div>
            <div className="rpt-divider"/>

            {/* 1) KPI */}
            <div className="rpt-section-title">1. สรุปผลการดำเนินงาน</div>
            <div className="rpt-kpi-grid">
              {[
                { label:"ใบแจ้งซ่อมทั้งหมด",      value:fmtNum(kpi.total_requests), unit:"ใบ",   warn:false },
                { label:"ดำเนินการเสร็จสิ้น",      value:fmtNum(kpi.completed),      unit:"ใบ",   warn:false },
                { label:"อยู่ระหว่างดำเนินการ",    value:fmtNum(kpi.in_progress),    unit:"ใบ",   warn:Number(kpi.in_progress)>0 },
                { label:"งานวิกฤต",                value:fmtNum(kpi.critical_count), unit:"ใบ",   warn:Number(kpi.critical_count)>0 },
                { label:"Downtime รวม",            value:fmtNum(kpi.total_downtime), unit:"ชม.", warn:false },
                { label:"ค่าอะไหล่รวม",            value:"฿"+fmtNum(costRow.parts_cost||0), unit:"", warn:false },
              ].map(k=>(
                <div key={k.label} className={"rpt-kpi-card"+(k.warn?" rpt-kpi-card--warn":"")}>
                  <div className="rpt-kpi-value">{k.value}{k.unit && <span className="rpt-kpi-unit"> {k.unit}</span>}</div>
                  <div className="rpt-kpi-label">{k.label}</div>
                </div>
              ))}
            </div>

            {/* 2) Top machines */}
            {topMachines.length > 0 && <>
              <div className="rpt-section-title" style={{ marginTop:18 }}>2. เครื่องจักรที่มีปัญหาบ่อย</div>
              <table className="rpt-table">
                <thead><tr><th>#</th><th>รหัสเครื่อง</th><th>ชื่อเครื่อง</th><th>Rank</th><th className="num">Breakdown</th><th className="num">Downtime (ชม.)</th></tr></thead>
                <tbody>
                  {topMachines.map((m,i)=>(
                    <tr key={m.code}>
                      <td>{i+1}</td>
                      <td className="mono">{m.code}</td>
                      <td>{m.name}</td>
                      <td style={{ fontWeight:700, color:m.rank==="A"?"#dc2626":m.rank==="B"?"#d97706":"#2563eb" }}>{m.rank}</td>
                      <td className="num">{m.breakdowns}</td>
                      <td className="num">{m.downtime||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>}

            {/* 3) Repair details */}
            <div className="rpt-section-title" style={{ marginTop:18 }}>3. รายละเอียดใบแจ้งซ่อม</div>
            {repairs.length === 0
              ? <div className="rpt-empty">ไม่มีใบแจ้งซ่อมในช่วงเดือนนี้</div>
              : <table className="rpt-table">
                  <thead><tr><th>เลขที่</th><th>เครื่อง</th><th>รายละเอียดปัญหา</th><th>ความสำคัญ</th><th>สถานะ</th><th>วันแจ้ง</th><th className="num">Downtime</th><th>ช่างผู้รับ</th></tr></thead>
                  <tbody>
                    {repairs.map(r=>(
                      <tr key={r.request_no}>
                        <td className="mono" style={{ fontSize:11 }}>{r.request_no}</td>
                        <td className="mono" style={{ fontSize:11 }}>{r.machine_code||"—"}</td>
                        <td style={{ fontSize:11 }}>{r.description}</td>
                        <td style={{ fontSize:11, fontWeight:700, color:r.priority==="Critical"?"#dc2626":r.priority==="High"?"#d97706":"#374151" }}>{PRIORITY_TH[r.priority]||r.priority}</td>
                        <td style={{ fontSize:11 }}>{STATUS_TH[r.status]||r.status}</td>
                        <td style={{ fontSize:11 }}>{fmtDate(r.created_at)}</td>
                        <td className="num" style={{ fontSize:11 }}>{r.downtime||"—"}</td>
                        <td style={{ fontSize:11 }}>{r.technician||"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }

            {/* 4) PM summary */}
            <div className="rpt-section-title" style={{ marginTop:18 }}>4. สรุปแผนการบำรุงรักษา (PM)</div>
            <div className="rpt-kpi-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
              {[
                { label:"PM ครบกำหนดในเดือนนี้", value:fmtNum(pmKpi.total_pm),    unit:"รายการ", warn:false },
                { label:"ดำเนินการเสร็จแล้ว",    value:fmtNum(pmKpi.pm_completed), unit:"รายการ", warn:false },
                { label:"เกินกำหนด",             value:fmtNum(pmKpi.pm_overdue),   unit:"รายการ", warn:Number(pmKpi.pm_overdue)>0 },
              ].map(k=>(
                <div key={k.label} className={"rpt-kpi-card"+(k.warn?" rpt-kpi-card--warn":"")}>
                  <div className="rpt-kpi-value">{k.value}<span className="rpt-kpi-unit"> {k.unit}</span></div>
                  <div className="rpt-kpi-label">{k.label}</div>
                </div>
              ))}
            </div>
            {pmRows.length > 0 && (
              <table className="rpt-table" style={{ marginTop:10 }}>
                <thead><tr><th>เครื่อง</th><th>Checklist</th><th>ความถี่</th><th>Rank</th><th>กำหนดทำ</th><th>ทำเสร็จวันที่</th><th>สถานะ</th></tr></thead>
                <tbody>
                  {pmRows.map((p,i)=>{
                    const today = new Date().toISOString().slice(0,10);
                    const st = p.completed ? "เสร็จสิ้น" : (p.next_pm_date < today ? "เกินกำหนด" : "รอดำเนินการ");
                    const stColor = p.completed?"#16a34a":st==="เกินกำหนด"?"#dc2626":"#374151";
                    return (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize:11 }}>{p.machine_code}</td>
                        <td style={{ fontSize:11 }}>{p.checklist}</td>
                        <td style={{ fontSize:11 }}>{p.frequency}</td>
                        <td style={{ fontWeight:700, fontSize:11, color:p.rank==="A"?"#dc2626":p.rank==="B"?"#d97706":"#2563eb" }}>{p.rank}</td>
                        <td style={{ fontSize:11 }}>{fmtDate(p.next_pm_date)}</td>
                        <td style={{ fontSize:11 }}>{fmtDate(p.last_pm_date)}</td>
                        <td style={{ fontSize:11, fontWeight:700, color:stColor }}>{st}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Signature */}
            <div className="rpt-sig">
              {["ผู้จัดทำรายงาน","ผู้จัดการฝ่ายซ่อมบำรุง","ผู้อำนวยการ / ผู้บริหาร"].map(n=>(
                <div key={n} className="rpt-sig-box">
                  <div className="rpt-sig-line"/>
                  <div style={{ fontSize:12 }}>{n}</div>
                  <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>วันที่ ……………………</div>
                </div>
              ))}
            </div>

            <div className="rpt-footer">
              Complete Auto Rubber Manufacturing Co., Ltd. &nbsp;|&nbsp; {periodLabel} &nbsp;|&nbsp; พิมพ์: {fmtDate(new Date().toISOString())}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

Object.assign(window, { Dashboard, Admin, AlertRow, ReliabilityDashboard, MonthlyReport });
