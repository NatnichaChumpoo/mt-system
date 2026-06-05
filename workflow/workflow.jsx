/* ============================================================
   MT_System — DETAILED WORKFLOW WALKTHROUGH
   Shell + stepper + shared helpers → window
   ============================================================ */
const { useState:wfS, useEffect:wfE } = React;
const W = window.DATA;

/* ---- worked example: REQ-2026-001 (full end-to-end, completed) ---- */
const EX = {
  mc:     W.machineByCode("MC-001"),
  req:    W.requests.find(r=>r.no==="REQ-2026-001"),
  repair: W.repairs["REQ-2026-001"],
  usage:  W.usage["REQ-2026-001"],
};

/* ---- phases ---- */
const PHASES = {
  A: { label:"แจ้งซ่อม",          color:"var(--blue)" },
  B: { label:"ดำเนินการซ่อม",     color:"var(--accent)" },
  C: { label:"ตรวจรับ & KPI",     color:"var(--green)" },
  D: { label:"คุมสต็อก & ป้องกัน", color:"var(--amber)" },
};
const ROLE_COLOR = {
  "Operator":"var(--blue)", "Technician":"var(--accent)", "Supervisor":"var(--green)",
  "Store Keeper":"var(--amber)", "Manager":"var(--ink)", "ระบบ":"var(--ink-2)", "ทุกบทบาท":"var(--ink-2)",
};

/* ---- step registry (metadata; body comes from window.WF[id]) ---- */
const STEPS = [
  { id:"overview", phase:"A", role:"ทุกบทบาท", icon:"gauge",  title:"ภาพรวมกระบวนการ",
    trigger:"เริ่มทำความเข้าใจระบบ", sys:"ร้อยเรียงทุกขั้นตอนเข้าด้วยกันเป็น flow เดียว" },
  { id:"scan", phase:"A", role:"Operator", icon:"qr", title:"พบเครื่องเสีย · สแกน QR หน้าเครื่อง",
    trigger:"พนักงานพบเครื่องจักรผิดปกติ", sys:"ดึงข้อมูลเครื่องจาก Machine Master ทันทีจากรหัส QR" },
  { id:"report", phase:"A", role:"Operator", icon:"wrench", title:"กรอกใบแจ้งซ่อม",
    trigger:"กดปุ่ม “แจ้งซ่อมเครื่องนี้”", sys:"ออกเลขใบแจ้ง REQ อัตโนมัติ + บันทึกเวลาเริ่มเสีย" },
  { id:"alert", phase:"A", role:"ระบบ", icon:"mail", title:"ระบบแจ้งเตือนอัตโนมัติ (Email / LINE)",
    trigger:"ใบแจ้งซ่อมถูกบันทึก", sys:"ตัดสินช่องทางแจ้งเตือนตาม Risk Zone ของเครื่อง" },
  { id:"queue", phase:"B", role:"Technician", icon:"list", title:"งานเข้าคิวช่าง · จัดลำดับความสำคัญ",
    trigger:"มีงานใหม่เข้าระบบ", sys:"เรียงคิวตามความรุนแรง + Rank เครื่อง" },
  { id:"accept", phase:"B", role:"Technician", icon:"clipboard", title:"ช่างรับงาน · วินิจฉัยสาเหตุ",
    trigger:"ช่างกด “กดรับงาน”", sys:"เปลี่ยนสถานะเป็น In Progress + เริ่มจับเวลา downtime" },
  { id:"repair", phase:"B", role:"Technician", icon:"wrench", title:"บันทึกการซ่อม · เบิกอะไหล่ที่ใช้",
    trigger:"ช่างซ่อมเสร็จ", sys:"คำนวณต้นทุนอะไหล่รวมแบบเรียลไทม์" },
  { id:"deduct", phase:"B", role:"ระบบ", icon:"box", title:"ตัดสต็อกอะไหล่อัตโนมัติ",
    trigger:"กดบันทึกผลการซ่อม", sys:"หักยอดคงคลัง + สร้าง Stock Out log + ตรวจ ROP" },
  { id:"verify", phase:"C", role:"Supervisor", icon:"checkCircle", title:"หัวหน้างานตรวจรับงาน",
    trigger:"งานอยู่สถานะ Completed", sys:"ยืนยันผล → ปิดงาน + จัดเก็บเข้าประวัติเครื่อง" },
  { id:"kpi", phase:"C", role:"Manager", icon:"chart", title:"คำนวณ & อัปเดต KPI",
    trigger:"งานถูกปิด", sys:"ปรับค่า MTBF / MTTR / Downtime / Breakdown เข้า Dashboard" },
  { id:"reorder", phase:"D", role:"Store Keeper", icon:"truck", title:"คุมสต็อกด้วย ROP · ออกใบสั่งซื้อ",
    trigger:"อะไหล่คงคลัง ≤ ROP", sys:"ไฮไลต์รายการ + คำนวณจำนวนที่ควรสั่ง" },
  { id:"prevent", phase:"D", role:"Supervisor", icon:"cal", title:"แผน PM & Risk Matrix",
    trigger:"ลดการเสียในอนาคต", sys:"ติดตามรอบ PM + ประเมินความเสี่ยงเชิงกลยุทธ์" },
];

/* ============================================================
   Shared helpers (exported to window for step files)
   ============================================================ */

/* colored callout */
function WFNote({ kind="info", icon, title, children }) {
  const map = {
    info:  ["var(--blue-bg)","#cdd9e3","var(--blue-ink)","var(--blue)"],
    good:  ["var(--green-bg)","#cdddd0","var(--green-ink)","var(--green)"],
    warn:  ["var(--amber-bg)","#e9dabb","var(--amber-ink)","var(--amber)"],
    bad:   ["var(--red-bg)","#ecd3d0","var(--red-ink)","var(--red)"],
    accent:["var(--accent-bg)","#e6d8c0","#6e5530","var(--accent)"],
  };
  const [bg,bd,ink,ic] = map[kind]||map.info;
  return (
    <div style={{ background:bg, border:"1px solid "+bd, borderRadius:12, padding:"14px 16px", display:"flex", gap:12 }}>
      {icon && <span style={{ color:ic, flex:"none", marginTop:1 }}><Icon name={icon} size={19}/></span>}
      <div style={{ color:ink }}>
        {title && <div style={{ fontWeight:700, fontSize:14, marginBottom:children?4:0 }}>{title}</div>}
        {children && <div className="small" style={{ lineHeight:1.55 }}>{children}</div>}
      </div>
    </div>
  );
}

/* data-trace strip: what changed in the system */
function WFTrace({ title="ข้อมูลที่ระบบบันทึก/เปลี่ยนแปลง", items }) {
  return (
    <div className="panel" style={{ background:"var(--surface-2)" }}>
      <div className="panel-head" style={{ padding:"12px 18px" }}>
        <div className="row gap-sm"><Icon name="box" size={15} style={{color:"var(--accent)"}}/><span className="h-sm">{title}</span></div>
        <span className="eyebrow" style={{fontSize:10}}>DATA TRACE</span>
      </div>
      <div style={{ padding:"14px 18px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"14px 22px" }}>
        {items.map((it,i)=>(
          <div key={i} className="row gap-sm" style={{alignItems:"flex-start"}}>
            <span style={{ marginTop:5, width:7, height:7, borderRadius:"50%", flex:"none",
              background: it.tone==="add"?"var(--green)":it.tone==="cut"?"var(--red)":it.tone==="warn"?"var(--amber)":"var(--accent)" }}></span>
            <div>
              <div className="tiny muted-2">{it.k}</div>
              <div className="small mono" style={{ fontWeight:600 }}>{it.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* read-only field */
function WFRO({ label, value, mono, strong }) {
  return (
    <div>
      <div className="tiny muted-2" style={{marginBottom:3}}>{label}</div>
      <div className={(mono?"mono ":"")+"small"} style={{ fontWeight: strong?700:600, color:"var(--ink)" }}>{value}</div>
    </div>
  );
}

/* numbered annotation bullet */
function WFStep({ n, title, children }) {
  return (
    <div className="row" style={{ gap:12, alignItems:"flex-start" }}>
      <span style={{ flex:"none", width:24, height:24, borderRadius:7, background:"var(--navy)", color:"#fff",
        fontSize:12.5, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{n}</span>
      <div style={{ paddingTop:1 }}>
        <span className="small" style={{ fontWeight:700 }}>{title}</span>
        {children && <div className="small muted" style={{ marginTop:2, lineHeight:1.5 }}>{children}</div>}
      </div>
    </div>
  );
}

/* phone-free framed "screen" preview with a caption */
function WFScreen({ caption, role, children }) {
  return (
    <div className="panel" style={{ overflow:"hidden" }}>
      <div className="panel-head" style={{ padding:"10px 16px", background:"var(--surface-2)" }}>
        <div className="row gap-sm">
          <span style={{ width:10,height:10,borderRadius:"50%",background:"#e0c4be",flex:"none" }}></span>
          <span style={{ width:10,height:10,borderRadius:"50%",background:"#e8d8b4",flex:"none" }}></span>
          <span style={{ width:10,height:10,borderRadius:"50%",background:"#c9d7cd",flex:"none" }}></span>
          <span className="small muted" style={{marginLeft:6}}>{caption}</span>
        </div>
        {role && <span className="chip" style={{fontSize:11}}>{role}</span>}
      </div>
      <div style={{ padding:18 }}>{children}</div>
    </div>
  );
}

Object.assign(window, { WFNote, WFTrace, WFRO, WFStep, WFScreen, WF_EX:EX });

/* timeline builder (self-contained for workflow page) */
window.buildTimeline = function(r, rep){
  const steps = [{ title:"แจ้งซ่อม", desc:r.reporter, time:r.date, state:"done" }];
  const accepted = r.status!=="Waiting";
  steps.push({ title:"รับงาน", desc: rep?rep.tech:"—", time: accepted?r.start:"", state: accepted?"done":"" });
  const repairing = r.status==="In Progress";
  const repaired = r.status==="Completed";
  steps.push({ title:"ซ่อม", desc: rep?rep.action:"", time: r.finish||"", state: repaired?"done":(repairing?"active":"") });
  const approved = rep && rep.verify==="Approved";
  steps.push({ title:"ตรวจรับ", desc: approved?("โดย "+rep.by):"รอหัวหน้าตรวจรับ", time:"", state: approved?"done":"" });
  return steps;
};

/* ============================================================
   App shell
   ============================================================ */
const WF_TWEAKS = /*EDITMODE-BEGIN*/{
  "fontFamily": "IBM Plex Sans Thai",
  "density": "cozy",
  "brand": "#232019"
}/*EDITMODE-END*/;

function WorkflowApp() {
  const [t, setTweak] = useTweaks(WF_TWEAKS);
  const [idx, setIdx] = wfS(()=>{ const v=+localStorage.getItem("wf_idx"); return (v>=0 && v<STEPS.length)?v:0; });
  const [seen, setSeen] = wfS(()=>{ try{ return new Set(JSON.parse(localStorage.getItem("wf_seen")||"[]")); }catch(e){ return new Set(); } });

  wfE(()=>{
    const fams = { "IBM Plex Sans Thai":'"IBM Plex Sans Thai",sans-serif', "Noto Sans Thai":'"Noto Sans Thai",sans-serif', "Sarabun":'"Sarabun",sans-serif' };
    document.documentElement.style.setProperty("--font", fams[t.fontFamily]||fams["IBM Plex Sans Thai"]);
    document.documentElement.style.setProperty("--navy", t.brand);
    document.documentElement.setAttribute("data-density", t.density);
  },[t]);

  wfE(()=>{ localStorage.setItem("wf_idx", idx); const s=new Set(seen); s.add(idx); setSeen(s); localStorage.setItem("wf_seen", JSON.stringify([...s])); document.querySelector("main")?.scrollTo(0,0); window.scrollTo(0,0); /* eslint-disable-next-line */ },[idx]);

  const step = STEPS[idx];
  const ph = PHASES[step.phase];
  const Body = window.WF[step.id];
  const go = i => setIdx(Math.max(0, Math.min(STEPS.length-1, i)));
  const pct = Math.round(((idx+1)/STEPS.length)*100);

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      {/* rail */}
      <aside style={{ width:288, flex:"none", background:"var(--surface)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh" }}>
        <div style={{ padding:"20px 20px 18px", borderBottom:"1px solid var(--border)" }}>
          <div className="row gap-sm">
            <span style={{ width:40,height:40,borderRadius:11,background:"var(--navy)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flex:"none" }}><Icon name="wrench" size={20}/></span>
            <div>
              <div className="h-md" style={{ fontSize:17, lineHeight:1.1 }}>MT System</div>
              <div className="tiny" style={{ color:"var(--ink-3)", letterSpacing:".03em", marginTop:1 }}>คู่มือกระบวนการ · ทุกขั้นตอน</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, overflowY:"auto", padding:"14px 12px" }}>
          {Object.keys(PHASES).map(pid=>{
            const list = STEPS.map((s,i)=>({s,i})).filter(x=>x.s.phase===pid);
            return (
              <div key={pid} style={{ marginBottom:14 }}>
                <div className="eyebrow" style={{ padding:"0 10px 8px", display:"flex", alignItems:"center", gap:7, fontSize:10 }}>
                  <span style={{ width:8,height:8,borderRadius:2,background:PHASES[pid].color,flex:"none" }}></span>{PHASES[pid].label}
                </div>
                {list.map(({s,i})=>{
                  const active=i===idx, visited=seen.has(i)&&!active;
                  return (
                    <button key={s.id} onClick={()=>go(i)} style={{ width:"100%", display:"flex", alignItems:"center", gap:11, padding:"9px 11px", marginBottom:2, borderRadius:9, border:0, cursor:"pointer", textAlign:"left",
                      background: active?"var(--accent-bg)":"transparent", color: active?"var(--ink)":"var(--ink-2)", fontWeight: active?700:500, fontSize:13.5 }}>
                      <span style={{ flex:"none", width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11.5, fontWeight:700,
                        background: active?"var(--navy)":visited?"var(--green-bg)":"var(--surface-3)",
                        color: active?"#fff":visited?"var(--green-ink)":"var(--ink-3)",
                        border: active?"0":"1px solid var(--border)" }}>
                        {visited ? <Icon name="check" size={13}/> : (i+1)}
                      </span>
                      <span style={{ lineHeight:1.25 }}>{s.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div style={{ padding:14, borderTop:"1px solid var(--border)" }}>
          <a href="MT System.html" className="btn btn-block" style={{ textDecoration:"none" }}><Icon name="chevL" size={15}/> ไปที่เวอร์ชันแอป (ตามบทบาท)</a>
        </div>
      </aside>

      {/* main */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        {/* progress bar */}
        <div style={{ height:3, background:"var(--surface-3)", flex:"none" }}><div style={{ height:"100%", width:pct+"%", background:"var(--accent)", transition:".3s" }}></div></div>

        <header style={{ height:60, flex:"none", background:"rgba(255,255,255,.85)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 30px", position:"sticky", top:0, zIndex:30 }}>
          <div className="row gap-sm">
            <span className="eyebrow">คู่มือกระบวนการ</span><span style={{color:"var(--ink-3)"}}>/</span>
            <span className="small" style={{fontWeight:600, color:ph.color}}>{ph.label}</span>
          </div>
          <div className="row gap-sm">
            <span className="small muted">ขั้นที่ <b style={{color:"var(--ink)"}}>{idx+1}</b> / {STEPS.length}</span>
          </div>
        </header>

        <main style={{ flex:1, padding:"30px 36px 40px", width:"100%" }}>
          <div style={{ maxWidth:1080, margin:"0 auto" }}>
            {/* step header */}
            <div style={{ marginBottom:24 }}>
              <div className="row gap-sm" style={{ marginBottom:12 }}>
                <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:10, background:"var(--navy)", color:"#fff", flex:"none" }}><Icon name={step.icon} size={18}/></span>
                <span className="chip" style={{ borderColor: ROLE_COLOR[step.role], color: ROLE_COLOR[step.role] }}><span className="dot" style={{ width:7,height:7,borderRadius:"50%",background:ROLE_COLOR[step.role] }}></span>{step.role}</span>
                <span className="chip" style={{ background:"var(--surface-2)" }}>ขั้นที่ {idx+1}</span>
              </div>
              <h1 className="h-xl" style={{ margin:"0 0 14px" }}>{step.title}</h1>
              <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:12, maxWidth:760 }}>
                <div className="row gap-sm" style={{ alignItems:"flex-start" }}><span style={{color:"var(--ink-3)",marginTop:1,flex:"none"}}><Icon name="play" size={15}/></span><div><div className="tiny muted-2">จุดเริ่ม (Trigger)</div><div className="small" style={{fontWeight:600}}>{step.trigger}</div></div></div>
                <div className="row gap-sm" style={{ alignItems:"flex-start" }}><span style={{color:"var(--accent)",marginTop:1,flex:"none"}}><Icon name="cog" size={15}/></span><div><div className="tiny muted-2">ระบบทำอะไร</div><div className="small" style={{fontWeight:600}}>{step.sys}</div></div></div>
              </div>
            </div>

            <div className="stack" style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {Body ? <Body/> : <div className="empty card">— ขั้นตอนนี้กำลังจัดทำ —</div>}
            </div>

            {/* footer nav */}
            <div className="row between" style={{ marginTop:34, paddingTop:22, borderTop:"1px solid var(--border)", gap:12 }}>
              <button className="btn" disabled={idx===0} onClick={()=>go(idx-1)} style={{ visibility: idx===0?"hidden":"visible" }}>
                <Icon name="chevL" size={16}/> ก่อนหน้า
              </button>
              <div className="row gap-sm" style={{ gap:6 }}>
                {STEPS.map((s,i)=>(
                  <button key={s.id} onClick={()=>go(i)} title={s.title} style={{ width:9, height:9, borderRadius:"50%", border:0, cursor:"pointer", padding:0,
                    background: i===idx?"var(--accent)":seen.has(i)?"var(--border-2)":"var(--surface-3)" }}></button>
                ))}
              </div>
              {idx<STEPS.length-1 ? (
                <button className="btn btn-primary" onClick={()=>go(idx+1)}>
                  ถัดไป · {STEPS[idx+1].title.split(" · ")[0].slice(0,18)} <Icon name="chevR" size={16}/>
                </button>
              ) : (
                <a href="MT System.html" className="btn btn-primary" style={{textDecoration:"none"}}>เปิดเวอร์ชันแอป <Icon name="chevR" size={16}/></a>
              )}
            </div>
          </div>
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="ตัวอักษร" />
        <TweakSelect label="ฟอนต์" value={t.fontFamily} options={["IBM Plex Sans Thai","Noto Sans Thai","Sarabun"]} onChange={v=>setTweak("fontFamily",v)} />
        <TweakRadio label="ความหนาแน่น" value={t.density} options={["compact","cozy"]} onChange={v=>setTweak("density",v)} />
        <TweakSection label="โทนแบรนด์" />
        <TweakColor label="สี Chrome" value={t.brand} options={["#232019","#1f2a24","#2a2433","#26201a"]} onChange={v=>setTweak("brand",v)} />
      </TweaksPanel>
    </div>
  );
}

window.WF = window.WF || {};
window.__mountWorkflow = () => ReactDOM.createRoot(document.getElementById("root")).render(<WorkflowApp/>);
