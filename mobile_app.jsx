/* ============================================================
   MT_System — MOBILE: Supervisor/Manager screens + shell + mount
   ============================================================ */
const MA = window.DATA;
window.MSCREENS = window.MSCREENS || {};

/* ---------------- Supervisor: approvals ---------------- */
window.MSCREENS.approvals = function Approvals({ nav }){
  const pending = MA.requests.filter(r=>r.status==="Completed");
  const waiting = MA.requests.filter(r=>r.status!=="Completed");
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div className="m-stat"><div className="v" style={{color:"var(--amber-ink)"}}>{pending.filter(r=>{const x=MA.repairs[r.no];return x&&x.verify!=="Approved";}).length}</div><div className="k">รอตรวจรับ</div></div>
        <div className="m-stat"><div className="v" style={{color:"var(--blue-ink)"}}>{waiting.length}</div><div className="k">กำลังซ่อม/รอ</div></div>
      </div>
      <div className="m-sec">งานรอตรวจรับ</div>
      <div style={{display:"grid",gap:12}}>
        {pending.map(r=>{ const rep=MA.repairs[r.no]; const approved=rep&&rep.verify==="Approved";
          return (
            <button key={r.no} className="m-card m-card-pad" style={{textAlign:"left",cursor:"pointer",width:"100%"}} onClick={()=>nav.go("approve",{no:r.no})}>
              <div className="row between"><span className="mono small" style={{fontWeight:700,whiteSpace:"nowrap"}}>{r.no}</span>{approved?<span className="badge b-green"><span className="dot"></span>อนุมัติแล้ว</span>:<span className="badge b-amber"><span className="dot"></span>รอตรวจรับ</span>}</div>
              <div className="row gap-sm" style={{margin:"8px 0",flexWrap:"wrap"}}><span className="mono small" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><span className="small muted">{r.mcName}</span></div>
              <div className="row between"><span className="small muted">{rep?rep.tech:"—"}</span><span className="mono tiny muted-2">{rep?rep.hrs+" ชม.":""}</span></div>
            </button>
          );
        })}
      </div>
    </>
  );
};

window.MSCREENS.approve = function Approve({ nav }){
  const r=MA.requests.find(x=>x.no===nav.params.no)||MA.requests[0];
  const rep=MA.repairs[r.no]; const use=MA.usage[r.no]||[];
  const total=use.reduce((s,u)=>s+u.unit*u.qty,0);
  const [reason,setReason]=useState("");
  const approved=rep&&rep.verify==="Approved";
  const act=(ok)=>{ if(!ok && !reason.trim()){ nav.toast("กรุณาระบุเหตุผลที่ไม่อนุมัติ","bad"); return; }
    nav.toast(ok?("อนุมัติงาน "+r.no+" แล้ว"):"ส่งกลับให้ช่างแก้ไข", ok?"good":"bad"); nav.tab("approvals"); };
  return (
    <>
      <div className="m-card m-card-pad">
        <div className="row between"><span className="mono" style={{fontWeight:700,fontSize:16,whiteSpace:"nowrap"}}>{r.no}</span><JobBadge status={r.status}/></div>
        <div className="row gap-sm" style={{margin:"10px 0",flexWrap:"wrap"}}><span className="mono small" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><span className="small muted">{r.mcName}</span></div>
        {rep && <div className="stack small" style={{display:"grid",gap:7,paddingTop:10,borderTop:"1px solid var(--border)"}}>
          <div><span className="muted-2">ช่าง: </span>{rep.tech}</div>
          <div><span className="muted-2">สาเหตุราก: </span>{rep.root}</div>
          <div><span className="muted-2">วิธีแก้: </span>{rep.action}</div>
          <div><span className="muted-2">เวลาซ่อม: </span>{rep.hrs} ชม.</div>
        </div>}
      </div>
      {use.length>0 && <div className="m-card m-card-pad"><div className="row between" style={{marginBottom:10}}><div className="m-sec" style={{margin:0}}>อะไหล่ที่ใช้</div><span className="mono" style={{fontWeight:700}}>฿{MA.fmtNum(total)}</span></div>
        {use.map((u,i)=><div key={i} className="row between small" style={{padding:"4px 0"}}><span><span className="mono" style={{fontWeight:600}}>{u.code}</span> {u.name} ×{u.qty}</span><span className="mono">฿{MA.fmtNum(u.unit*u.qty)}</span></div>)}</div>}
      {approved ? <MInfoNote kind="good" icon="checkCircle">งานนี้อนุมัติแล้วโดย {rep.by}</MInfoNote> : (
        <>
          <MField label="เหตุผล / หมายเหตุ"><textarea className="m-textarea" style={{minHeight:70}} value={reason} onChange={e=>setReason(e.target.value)} placeholder="ระบุเหตุผล (จำเป็นเมื่อไม่อนุมัติ)"/></MField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <button className="m-btn m-btn-success" onClick={()=>act(true)}><Icon name="check" size={18}/> อนุมัติ</button>
            <button className="m-btn m-btn-danger" onClick={()=>act(false)}><Icon name="x" size={18}/> ไม่อนุมัติ</button>
          </div>
        </>
      )}
    </>
  );
};

/* ---------------- Production: review completed jobs ---------------- */
window.MSCREENS.prodReview = function ProdReview({ nav }){
  const completed = MA.requests.filter(r=>r.status==="Completed");
  const decisions = MA.prodGet();
  const pending = completed.filter(r=>!decisions[r.no]);
  const approved = completed.filter(r=>decisions[r.no] && decisions[r.no].decision==="Approved");
  const rejected = completed.filter(r=>decisions[r.no] && decisions[r.no].decision==="Rejected");
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <div className="m-stat"><div className="v" style={{color:"var(--amber-ink)"}}>{pending.length}</div><div className="k">รอตรวจสอบ</div></div>
        <div className="m-stat"><div className="v" style={{color:"var(--green-ink)"}}>{approved.length}</div><div className="k">อนุมัติ</div></div>
        <div className="m-stat"><div className="v" style={{color:"var(--red-ink)"}}>{rejected.length}</div><div className="k">ไม่อนุมัติ</div></div>
      </div>
      <div className="m-sec">งานที่ซ่อมเสร็จ · รอฝ่ายผลิตตรวจสอบ</div>
      <div style={{display:"grid",gap:12}}>
        {completed.map(r=>{ const rep=MA.repairs[r.no]; const info=MA.prodStatus(r.no);
          return (
            <button key={r.no} className="m-card m-card-pad" style={{textAlign:"left",cursor:"pointer",width:"100%"}} onClick={()=>nav.go("prodApprove",{no:r.no})}>
              <div className="row between"><span className="mono small" style={{fontWeight:700,whiteSpace:"nowrap"}}>{r.no}</span><span className={"badge "+info.cls}><span className="dot"></span>{info.th}</span></div>
              <div className="row gap-sm" style={{margin:"8px 0",flexWrap:"wrap"}}><span className="mono small" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><span className="small muted">{r.mcName}</span></div>
              <div className="row between"><span className="small muted">{rep?rep.tech:"—"}</span><span className="mono tiny muted-2">{rep?rep.hrs+" ชม.":""}</span></div>
            </button>
          );
        })}
        {completed.length===0 && <div className="m-card m-card-pad empty">ยังไม่มีงานที่ซ่อมเสร็จ</div>}
      </div>
    </>
  );
};

window.MSCREENS.prodApprove = function ProdApprove({ nav }){
  const r=MA.requests.find(x=>x.no===nav.params.no)||MA.requests[0];
  const rep=MA.repairs[r.no]; const use=MA.usage[r.no]||[];
  const total=use.reduce((s,u)=>s+u.unit*u.qty,0);
  const [reason,setReason]=useState("");
  const info=MA.prodStatus(r.no);
  const decided=!!MA.prodFor(r.no);
  const act=(ok)=>{ if(!ok && !reason.trim()){ nav.toast("กรุณาระบุเหตุผลที่ไม่อนุมัติ","bad"); return; }
    MA.prodSet(r.no, ok?"Approved":"Rejected", reason);
    nav.toast(ok?("ฝ่ายผลิตอนุมัติ "+r.no+" — เครื่องพร้อมผลิต"):("ฝ่ายผลิตไม่อนุมัติ "+r.no+" — ส่งกลับซ่อม"), ok?"good":"bad");
    nav.tab("prodReview"); };
  return (
    <>
      <div className="m-card m-card-pad">
        <div className="row between"><span className="mono" style={{fontWeight:700,fontSize:16,whiteSpace:"nowrap"}}>{r.no}</span><JobBadge status={r.status}/></div>
        <div className="row gap-sm" style={{margin:"10px 0",flexWrap:"wrap"}}><span className="mono small" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><span className="small muted">{r.mcName}</span></div>
        {rep && <div className="stack small" style={{display:"grid",gap:7,paddingTop:10,borderTop:"1px solid var(--border)"}}>
          <div><span className="muted-2">ช่าง: </span>{rep.tech}</div>
          <div><span className="muted-2">สาเหตุราก: </span>{rep.root}</div>
          <div><span className="muted-2">วิธีแก้: </span>{rep.action}</div>
          <div><span className="muted-2">เวลาซ่อม: </span>{rep.hrs} ชม.</div>
        </div>}
      </div>
      {use.length>0 && <div className="m-card m-card-pad"><div className="row between" style={{marginBottom:10}}><div className="m-sec" style={{margin:0}}>อะไหล่ที่ใช้</div><span className="mono" style={{fontWeight:700}}>฿{MA.fmtNum(total)}</span></div>
        {use.map((u,i)=><div key={i} className="row between small" style={{padding:"4px 0"}}><span><span className="mono" style={{fontWeight:600}}>{u.code}</span> {u.name} ×{u.qty}</span><span className="mono">฿{MA.fmtNum(u.unit*u.qty)}</span></div>)}</div>}
      <MInfoNote kind="info" icon="checkCircle">ฝ่ายผลิตยืนยันว่าเครื่องกลับมาเดินการผลิตได้ตามปกติ ก่อนปล่อยเข้าไลน์ผลิต</MInfoNote>
      {decided ? (
        <MInfoNote kind={info.decision==="Approved"?"good":"bad"} icon={info.icon}>
          <span>{info.th}{info.reason?(" · "+info.reason):""}</span>
          <button className="m-btn" style={{marginTop:10}} onClick={()=>{ MA.prodSet(r.no,null); nav.tab("prodReview"); }}>แก้ไขผลตรวจ</button>
        </MInfoNote>
      ) : (
        <>
          <MField label="เหตุผล / หมายเหตุ"><textarea className="m-textarea" style={{minHeight:70}} value={reason} onChange={e=>setReason(e.target.value)} placeholder="ระบุเหตุผล (จำเป็นเมื่อไม่อนุมัติ)"/></MField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            <button className="m-btn m-btn-success" onClick={()=>act(true)}><Icon name="check" size={18}/> อนุมัติ</button>
            <button className="m-btn m-btn-danger" onClick={()=>act(false)}><Icon name="x" size={18}/> ไม่อนุมัติ</button>
          </div>
        </>
      )}
    </>
  );
};

/* ---------------- Manager: KPI glance ---------------- */
window.MSCREENS.kpi = function Kpi({ nav }){
  const mx=Math.max(...MA.downtimeTrend.map(d=>d.v));
  const critical=MA.parts.filter(p=>p.status==="critical").length;
  const overdue=MA.pm.filter(p=>p.status==="Overdue").length;
  return (
    <>
      <div className="m-sec">ตัวชี้วัดหลัก (พ.ค. 2026)</div>
      <div style={{display:"grid",gap:12}}>{MA.kpi.map(k=><KpiCard key={k.key} k={k}/>)}</div>
      <div className="m-card m-card-pad">
        <div className="row between" style={{marginBottom:12}}><div className="m-sec" style={{margin:0}}>แนวโน้ม Downtime</div><span className="delta delta-up"><Icon name="arrowDown" size={13}/> ลดลง</span></div>
        <div style={{display:"flex",alignItems:"flex-end",gap:9,height:120}}>
          {MA.downtimeTrend.map((d,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6,justifyContent:"flex-end",height:"100%"}}>
              <span className="mono tiny" style={{fontWeight:700}}>{d.v}</span>
              <div style={{width:"100%",maxWidth:26,height:(d.v/mx*82)+"px",borderRadius:"6px 6px 0 0",background:i===MA.downtimeTrend.length-1?"var(--green)":"linear-gradient(180deg,#b89668,#9a7b4f)"}}></div>
              <span className="tiny muted-2">{d.m}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="m-sec">ต้องดำเนินการ</div>
      <div className="m-list">
        <button className="m-row" onClick={()=>nav.toast("เปิดในเวอร์ชันคลัง (desktop)")}><span className="ic" style={{color:"var(--red)"}}><Icon name="box" size={20}/></span><span className="grow"><span className="t1">อะไหล่ของหมด (วิกฤต)</span><span className="t2">{critical} รายการต่ำกว่าคลัง</span></span><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></button>
        <button className="m-row" onClick={()=>nav.toast("เปิดแผน PM (desktop)")}><span className="ic" style={{color:"var(--amber)"}}><Icon name="cal" size={20}/></span><span className="grow"><span className="t1">PM เกินกำหนด</span><span className="t2">{overdue} เครื่อง</span></span><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></button>
      </div>
    </>
  );
};

/* ---------------- Notifications ---------------- */
window.MSCREENS.notifications = function Notifications({ nav }){
  const items=[
    { ic:"bell", c:"var(--red)", t:"LINE Alert · งานวิกฤต", d:"REQ-2026-002 · MC-004 Hydraulic oil leak", time:"10 นาที" },
    { ic:"box", c:"var(--amber)", t:"อะไหล่ต่ำกว่า ROP", d:"PT-09 Proportion Valve · คงคลัง 0", time:"1 ชม." },
    { ic:"checkCircle", c:"var(--green)", t:"งานได้รับการอนุมัติ", d:"REQ-2026-001 อนุมัติโดยหัวหน้างาน", time:"3 ชม." },
    { ic:"cal", c:"var(--amber)", t:"PM ใกล้ถึงกำหนด", d:"C16 เครื่องอัด 200 Ton · ครบกำหนด 28 พ.ค.", time:"วันนี้" },
    { ic:"mail", c:"var(--blue)", t:"มีใบแจ้งซ่อมใหม่", d:"REQ-2026-006 · MC-003 จอค้าง", time:"เมื่อวาน" },
  ];
  return (
    <div className="m-list">
      {items.map((n,i)=>(
        <div key={i} className="m-row" style={{cursor:"default"}}>
          <span className="ic" style={{color:n.c}}><Icon name={n.ic} size={20}/></span>
          <span className="grow"><span className="t1">{n.t}</span><span className="t2">{n.d}</span></span>
          <span className="tiny muted-2" style={{flex:"none"}}>{n.time}</span>
        </div>
      ))}
    </div>
  );
};

/* ---------------- Profile ---------------- */
window.MSCREENS.profile = function Profile({ nav }){
  const u=MA.roleUser[nav.role];
  return (
    <>
      <div className="m-card m-card-pad" style={{textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:"var(--navy)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,margin:"4px auto 12px"}}>{u.short}</div>
        <div style={{fontFamily:"var(--display)",fontSize:19,fontWeight:600}}>{u.name}</div>
        <div className="small muted">{nav.role} · {MA.roleLabelTH[nav.role]}</div>
        <button className="m-btn" style={{marginTop:14}} onClick={()=>nav.roleSheet()}><Icon name="user" size={18}/> สลับบทบาท (prototype)</button>
      </div>
      <div className="m-list">
        <button className="m-row" onClick={()=>nav.toast("การตั้งค่า (prototype)")}><span className="ic"><Icon name="cog" size={19}/></span><span className="grow"><span className="t1">การตั้งค่า</span></span><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></button>
        <button className="m-row" onClick={()=>nav.toast("ศูนย์ช่วยเหลือ (prototype)")}><span className="ic"><Icon name="alert" size={19}/></span><span className="grow"><span className="t1">ช่วยเหลือ</span></span><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></button>
        <a className="m-row" href="MT System.html" style={{textDecoration:"none"}}><span className="ic"><Icon name="home" size={19}/></span><span className="grow"><span className="t1">เปิดเวอร์ชันเดสก์ท็อป</span><span className="t2">หัวหน้า · คลัง · ผู้บริหาร</span></span><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></a>
      </div>
      <button className="m-btn" style={{color:"var(--red-ink)",borderColor:"#ecd3d0"}} onClick={()=>nav.toast("ออกจากระบบ (prototype)")}><Icon name="logout" size={18}/> ออกจากระบบ</button>
    </>
  );
};

/* ============================================================
   Shell
   ============================================================ */
const ROLE_TABS = {
  "Operator":   { home:"home", tabs:[{s:"home",l:"หน้าหลัก",ic:"home"},{s:"requests",l:"งานของฉัน",ic:"list"},{fab:true,s:"scan",l:"สแกน"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
  "Technician": { home:"queue", tabs:[{s:"queue",l:"คิวงาน",ic:"wrench"},{s:"requests",l:"ประวัติ",ic:"list"},{fab:true,s:"scan",l:"สแกน"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
  "Supervisor": { home:"approvals", tabs:[{s:"approvals",l:"ตรวจรับ",ic:"checkCircle"},{s:"kpi",l:"ภาพรวม",ic:"gauge"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
  "Production": { home:"prodReview", tabs:[{s:"prodReview",l:"ตรวจสอบ",ic:"checkCircle"},{s:"requests",l:"ใบแจ้ง",ic:"list"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
  "Manager":    { home:"kpi", tabs:[{s:"kpi",l:"Dashboard",ic:"gauge"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
};
const MOBILE_ROLES = ["Operator","Technician","Supervisor","Production","Manager"];
const SCREEN_TITLE = {
  home:"หน้าหลัก", scan:"สแกน QR", machine:"ข้อมูลเครื่อง", report:"แจ้งซ่อม", lowpart:"แจ้งอะไหล่ใกล้หมด",
  requests:"ใบแจ้งของฉัน", reqDetail:"รายละเอียดใบแจ้ง", queue:"คิวงานซ่อม", job:"รายละเอียดงาน", repair:"บันทึกการซ่อม",
  approvals:"ตรวจรับงาน", approve:"ตรวจรับงาน", prodReview:"ตรวจสอบ (ฝ่ายผลิต)", prodApprove:"ตรวจสอบงาน", kpi:"ภาพรวม KPI", notifications:"การแจ้งเตือน", profile:"บัญชีผู้ใช้",
};
const CREAM_HEAD = { scan:true };

const M_TWEAKS = /*EDITMODE-BEGIN*/{
  "fontFamily": "IBM Plex Sans Thai",
  "brand": "#232019"
}/*EDITMODE-END*/;

function MobileApp(){
  const [role,setRole]=useState(()=>localStorage.getItem("m_role")||"Operator");
  const [tab,setTab]=useState(()=>ROLE_TABS[localStorage.getItem("m_role")||"Operator"].home);
  const [screen,setScreen]=useState(tab);
  const [params,setParams]=useState({});
  const [stack,setStack]=useState([]);
  const [toast,setToast]=useState(null);
  const [sheet,setSheet]=useState(null);

  const showToast=(msg,kind)=>{ setToast({msg,kind}); clearTimeout(window.__mtt); window.__mtt=setTimeout(()=>setToast(null),2600); };
  const scrollTop=()=>{ const b=document.querySelector(".m-body"); if(b) b.scrollTop=0; };
  const nav = {
    role, params,
    go:(s,p={})=>{ setStack(st=>[...st,{screen,params}]); setScreen(s); setParams(p); setTimeout(scrollTop,0); },
    back:()=>setStack(st=>{ if(!st.length) return st; const p=st[st.length-1]; setScreen(p.screen); setParams(p.params); return st.slice(0,-1); }),
    tab:(s)=>{ setTab(s); setScreen(s); setParams({}); setStack([]); setTimeout(scrollTop,0); },
    toast:showToast,
    sheet:(fn)=>setSheet(()=>fn),
    roleSheet:()=>setSheet(()=>roleSheetContent),
  };
  const switchRole=(r)=>{ setRole(r); localStorage.setItem("m_role",r); const h=ROLE_TABS[r].home; setTab(h); setScreen(h); setParams({}); setStack([]); setSheet(null); setTimeout(scrollTop,0); };

  const roleSheetContent=(close)=>(
    <div>
      <div className="m-sec" style={{margin:"2px 2px 12px"}}>สลับบทบาท (prototype)</div>
      <div style={{display:"grid",gap:9}}>
        {MOBILE_ROLES.map(r=>(
          <button key={r} className="m-card m-card-pad" style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",padding:14,borderColor:r===role?"var(--accent)":"var(--border)",borderWidth:r===role?1.5:1}} onClick={()=>switchRole(r)}>
            <span style={{textAlign:"left"}}><span style={{fontWeight:700,fontSize:14.5}}>{r}</span><span className="small muted" style={{display:"block"}}>{MA.roleLabelTH[r]}</span></span>
            {r===role?<Icon name="check" size={18} style={{color:"var(--accent)"}}/>:<Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/>}
          </button>
        ))}
      </div>
      <MInfoNote kind="info" icon="home"><span>บทบาท <b>คลัง</b> และ <b>Admin</b> เหมาะกับงานบนเดสก์ท็อป — เปิดได้จากแท็บบัญชี › เวอร์ชันเดสก์ท็อป</span></MInfoNote>
      <button className="m-btn" style={{marginTop:12}} onClick={close}>ปิด</button>
    </div>
  );

  const cfg=ROLE_TABS[role];
  const Comp=window.MSCREENS[screen]||window.MSCREENS[cfg.home];
  const canBack=stack.length>0;
  const u=MA.roleUser[role];

  return (
    <div className="m-app" style={{position:"relative"}}>
      {/* header */}
      <div className={"m-head"+(CREAM_HEAD[screen]?" cream":"")}>
        <div className="m-head-row">
          <div className="row gap-sm" style={{minWidth:0,flex:1}}>
            {canBack && <button className="icon-btn" style={{width:36,height:36,flex:"none"}} onClick={nav.back}><Icon name="chevL" size={18}/></button>}
            <div style={{minWidth:0,flex:1}}>
              <div className="m-title" style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{SCREEN_TITLE[screen]||"MT System"}</div>
              {!canBack && <div className="m-sub">{MA.roleLabelTH[role]}</div>}
            </div>
          </div>
          <button onClick={()=>nav.tab("profile")} style={{flex:"none",width:38,height:38,borderRadius:11,background:"var(--navy)",color:"#fff",border:0,fontWeight:700,fontSize:13,cursor:"pointer"}}>{u.short}</button>
        </div>
      </div>

      {/* body */}
      <div className="m-body">
        <Comp nav={nav}/>
      </div>

      {/* toast */}
      {toast && <div className="m-toast">
        <span style={{color: toast.kind==="bad"?"#ff9b95":toast.kind==="good"?"#9ed0ad":"#bcd0e6", flex:"none"}}><Icon name={toast.kind==="bad"?"alert":toast.kind==="good"?"checkCircle":"mail"} size={18}/></span>
        <span>{toast.msg}</span>
      </div>}

      {/* bottom sheet */}
      {sheet && <div className="m-sheet-scrim" onClick={()=>setSheet(null)}>
        <div className="m-sheet" onClick={e=>e.stopPropagation()}><div className="m-grab"></div>{sheet(()=>setSheet(null))}</div>
      </div>}

      {/* tab bar */}
      <div className="m-tabs">
        {cfg.tabs.map((tb,i)=> tb.fab ? (
          <button key={i} className="m-tab-fab" onClick={()=>nav.go(tb.s)}>
            <span className="ring"><Icon name="qr" size={24}/></span>
            <span className="lbl">{tb.l}</span>
          </button>
        ) : (
          <button key={i} className={"m-tab"+((tab===tb.s)?" on":"")} onClick={()=>nav.tab(tb.s)}>
            <Icon name={tb.ic} size={23}/>
            <span className="lbl">{tb.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

window.__mountMobile=()=>ReactDOM.createRoot(document.getElementById("root")).render(<MobileApp_Wrapper/>);

/* wrapper to keep Tweaks bound to state */
function MobileApp_Wrapper(){
  const [t,setTweak]=useTweaks(M_TWEAKS);
  useEffect(()=>{
    const fams={ "IBM Plex Sans Thai":'"IBM Plex Sans Thai",sans-serif', "Noto Sans Thai":'"Noto Sans Thai",sans-serif', "Sarabun":'"Sarabun",sans-serif' };
    document.documentElement.style.setProperty("--font", fams[t.fontFamily]||fams["IBM Plex Sans Thai"]);
    document.documentElement.style.setProperty("--navy", t.brand);
  },[t]);
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px",
      background:"radial-gradient(900px 500px at 50% -10%, #efe6d6, #e6e1d8 60%)"}}>
      <IOSDevice><MobileApp/></IOSDevice>
      <TweaksPanel title="Tweaks">
        <TweakSection label="ตัวอักษร"/>
        <TweakSelect label="ฟอนต์" value={t.fontFamily} options={["IBM Plex Sans Thai","Noto Sans Thai","Sarabun"]} onChange={v=>setTweak("fontFamily",v)}/>
        <TweakSection label="โทนแบรนด์"/>
        <TweakColor label="สี Chrome" value={t.brand} options={["#232019","#1f2a24","#2a2433","#26201a"]} onChange={v=>setTweak("brand",v)}/>
      </TweaksPanel>
    </div>
  );
}
