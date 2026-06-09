/* ============================================================
   MT_System — MOBILE screens (Operator + Technician) → window.MSCREENS
   relies on ui.jsx globals (Icon, badges, Timeline, QRBox...) and
   shared global useState/useEffect.
   ============================================================ */
const MS = window.DATA;
window.MSCREENS = window.MSCREENS || {};

/* timeline builder (self-contained) */
function mBuildTimeline(r, rep){
  const out=[{ title:"แจ้งซ่อม", desc:r.reporter, time:r.date, state:"done" }];
  const accepted=r.status!=="Waiting";
  out.push({ title:"รับงาน", desc: rep?rep.tech:"—", time: accepted?r.start:"", state: accepted?"done":"" });
  const repairing=r.status==="In Progress", repaired=r.status==="Completed";
  out.push({ title:"ซ่อม", desc: rep?rep.action:"", time:r.finish||"", state: repaired?"done":(repairing?"active":"") });
  return out;
}

/* small helpers */
function MInfoNote({ kind="info", icon, children }){
  const map={ info:["var(--blue-bg)","#cdd9e3","var(--blue-ink)","var(--blue)"], warn:["var(--amber-bg)","#e9dabb","var(--amber-ink)","var(--amber)"], good:["var(--green-bg)","#cdddd0","var(--green-ink)","var(--green)"], bad:["var(--red-bg)","#ecd3d0","var(--red-ink)","var(--red)"] };
  const [bg,bd,ink,ic]=map[kind]||map.info;
  return <div style={{ background:bg, border:"1px solid "+bd, borderRadius:13, padding:"12px 13px", display:"flex", gap:10, color:ink }}>
    <span style={{color:ic,flex:"none",marginTop:1}}><Icon name={icon} size={17}/></span><div style={{fontSize:13,lineHeight:1.5}}>{children}</div></div>;
}
function MField({ label, req, children }){
  return <div className="m-field" style={{marginBottom:0}}><label>{label}{req && <span style={{color:"var(--red)"}}> *</span>}</label>{children}</div>;
}

/* ============================================================
   OPERATOR
   ============================================================ */

/* --- Home --- */
window.MSCREENS.home = function OpHome({ nav }){
  const mine = MS.requests;
  const open = mine.filter(r=>r.status!=="Completed").length;
  const done = mine.filter(r=>r.status==="Completed").length;
  const machines = MS.machines.slice(0,3);
  return (
    <>
      <div className="m-hero">
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(280px 150px at 90% 0%, rgba(154,123,79,.18), transparent 62%)"}}></div>
        <div style={{position:"relative"}}>
          <div className="m-sub" style={{color:"var(--ink-2)"}}>สวัสดี · พนักงานหน้างาน</div>
          <div style={{fontFamily:"var(--display)",fontSize:22,fontWeight:600,marginTop:3}}>Somchai K.</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <button className="m-stat" style={{textAlign:"left",cursor:"pointer"}} onClick={()=>nav.tab("requests")}>
          <div className="v" style={{color:"var(--amber-ink)"}}>{open}</div><div className="k">ใบแจ้งที่ยังไม่ปิด</div>
        </button>
        <div className="m-stat"><div className="v" style={{color:"var(--green-ink)"}}>{done}</div><div className="k">ปิดงานแล้ว</div></div>
      </div>

      <div>
        <div className="m-sec">เครื่องที่ดูแล</div>
        <div className="m-list">
          {machines.map(m=>(
            <button key={m.code} className="m-row" onClick={()=>nav.go("machine",{mc:m.code})}>
              <span className="ic"><Icon name="machine" size={20}/></span>
              <span className="grow"><span className="t1">{m.code} · {m.name}</span><span className="t2">{m.group} · {m.dept}</span></span>
              <span className={"badge "+(m.status==="Running"?"b-green":"b-red")} style={{flex:"none"}}><span className="dot"></span>{m.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="m-sec">ใบแจ้งล่าสุดของฉัน</div>
        <div style={{display:"grid",gap:10}}>
          {mine.slice(0,3).map(r=> <ReqCard key={r.no} r={r} nav={nav}/>)}
        </div>
      </div>
    </>
  );
};

/* request card (shared) */
function ReqCard({ r, nav }){
  return (
    <button className="m-card m-card-pad" style={{textAlign:"left",cursor:"pointer",width:"100%"}} onClick={()=>nav.go("reqDetail",{no:r.no})}>
      <div className="row between"><span className="mono small" style={{fontWeight:700,whiteSpace:"nowrap"}}>{r.no}</span><JobBadge status={r.status}/></div>
      <div className="small" style={{margin:"8px 0",color:"var(--ink)"}}>{r.problem}</div>
      <div className="row between">
        <span className="row gap-sm"><span className="mono tiny" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><PriorityTag p={r.priority}/></span>
        <span className="tiny muted-2 mono">{r.date.split(" ")[0]}</span>
      </div>
    </button>
  );
}

/* --- Scan --- */
window.MSCREENS.scan = function Scan({ nav }){
  return (
    <div style={{margin:"-16px -16px -20px",display:"flex",flexDirection:"column",minHeight:"100%"}}>
      <div style={{flex:1,background:"linear-gradient(160deg,#2c2820,#16140f)",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,minHeight:380}}>
        <div style={{position:"absolute",top:16,left:16,right:16,textAlign:"center",color:"rgba(255,255,255,.85)",fontSize:13.5}}>เล็งกล้องไปที่ QR ที่ติดหน้าเครื่องจักร</div>
        <div style={{width:210,height:210,position:"relative"}}>
          {[[0,0,"tl"],[1,0,"tr"],[0,1,"bl"],[1,1,"br"]].map(([x,y],i)=>(
            <span key={i} style={{position:"absolute",[x?"right":"left"]:0,[y?"bottom":"top"]:0,width:38,height:38,
              borderTop:y?"0":"3px solid var(--accent-2)",borderBottom:y?"3px solid var(--accent-2)":"0",
              borderLeft:x?"0":"3px solid var(--accent-2)",borderRight:x?"3px solid var(--accent-2)":"0",
              borderTopLeftRadius:!x&&!y?12:0,borderTopRightRadius:x&&!y?12:0,borderBottomLeftRadius:!x&&y?12:0,borderBottomRightRadius:x&&y?12:0}}></span>
          ))}
          <div style={{position:"absolute",left:8,right:8,top:"50%",height:2,background:"var(--accent-2)",boxShadow:"0 0 12px var(--accent-2)",opacity:.9}}></div>
        </div>
        <div style={{marginTop:22,color:"rgba(255,255,255,.5)",fontSize:12}}>กำลังค้นหารหัส QR…</div>
      </div>
      <div style={{padding:16,background:"var(--surface)"}}>
        <div className="m-sec">จำลองการสแกน (prototype)</div>
        <div className="m-chips" style={{marginBottom:12}}>
          {MS.machines.slice(0,4).map(m=>(
            <button key={m.code} className="m-chip" onClick={()=>nav.go("machine",{mc:m.code})}>{m.code}</button>
          ))}
        </div>
        <button className="m-btn m-btn-primary" onClick={()=>nav.go("machine",{mc:"MC-001"})}><Icon name="qr" size={19}/> สแกนเครื่อง MC-001</button>
      </div>
    </div>
  );
};

/* --- Machine detail --- */
window.MSCREENS.machine = function Machine({ nav }){
  const mc = MS.machineByCode(nav.params.mc || "MC-001");
  const hist = MS.requestsForMachine(mc.code);
  const running = mc.status==="Running";
  return (
    <>
      <div className="m-card" style={{overflow:"hidden"}}>
        <div style={{background:"var(--surface-2)",borderBottom:"1px solid var(--border)",padding:"16px 16px 18px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"var(--accent)"}}></div>
          <div className="row between"><span className="badge b-gray"><Icon name="qr" size={12}/> สแกนสำเร็จ</span>
            <span className={"badge "+(running?"b-green":"b-red")}><span className="dot"></span>{running?"Running":"Stop"}</span></div>
          <div className="mono" style={{fontSize:26,fontWeight:600,marginTop:12,color:"var(--ink)"}}>{mc.code}</div>
          <div style={{fontSize:15,fontWeight:600,color:"var(--ink-2)"}}>{mc.name}</div>
          <div className="row gap-sm" style={{marginTop:11,flexWrap:"wrap"}}><RankPill rank={mc.rank}/><span className="chip">{mc.group}</span><span className="chip">Crit {mc.crit}</span></div>
        </div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[["แผนก",mc.dept],["ตำแหน่ง",mc.zone],["ผู้ผลิต",mc.maker],["รุ่น",mc.model]].map(([k,v])=>(
            <div key={k}><div className="tiny muted-2">{k}</div><div className="small" style={{fontWeight:600}}>{v}</div></div>
          ))}
        </div>
      </div>

      <button className="m-btn m-btn-danger m-btn-lg" onClick={()=>nav.go("report",{mc:mc.code})}><Icon name="wrench" size={20}/> แจ้งซ่อมเครื่องนี้</button>
      <button className="m-btn m-btn-warn" onClick={()=>nav.go("lowpart",{mc:mc.code})}><Icon name="box" size={19}/> แจ้งอะไหล่ใกล้หมด</button>

      <div>
        <div className="m-sec">ประวัติการแจ้งซ่อม ({hist.length})</div>
        {hist.length===0 ? <div className="m-card m-card-pad muted small" style={{textAlign:"center"}}>ยังไม่มีประวัติ</div>
          : <div style={{display:"grid",gap:10}}>{hist.map(r=><ReqCard key={r.no} r={r} nav={nav}/>)}</div>}
      </div>
    </>
  );
};

/* --- Report form --- */
window.MSCREENS.report = function Report({ nav }){
  const mc = MS.machineByCode(nav.params.mc || "MC-001");
  const [type,setType]=useState("งานซ่อม");
  const [sev,setSev]=useState("High");
  const [desc,setDesc]=useState("");
  const sevs=[["Low","low"],["Medium","medium"],["High","high"],["Critical","critical"]];
  const submit=()=>{ if(!desc.trim()){ nav.toast("กรุณากรอกอาการเสีย","bad"); return; }
    nav.sheet(close=>(
      <div style={{textAlign:"center",padding:"6px 4px 8px"}}>
        <div className="m-success"><Icon name="check" size={38}/></div>
        <div style={{fontFamily:"var(--display)",fontSize:20,fontWeight:600}}>ส่งใบแจ้งซ่อมแล้ว</div>
        <div className="small muted" style={{margin:"8px 0 4px"}}>ระบบส่งอีเมล/LINE แจ้งทีมช่างและหัวหน้างาน MT อัตโนมัติ</div>
        <div className="m-card m-card-pad" style={{margin:"14px 0",textAlign:"left",background:"var(--surface-2)"}}>
          <div className="row between"><span className="mono small" style={{fontWeight:700}}>REQ-2026-007</span><JobBadge status="Waiting"/></div>
          <div className="small" style={{marginTop:7}}>{mc.code} · {desc}</div>
        </div>
        <button className="m-btn m-btn-primary" onClick={()=>{ close(); nav.go("machine",{mc:mc.code}); }}>เสร็จสิ้น</button>
      </div>
    ));
  };
  return (
    <>
      <div className="m-card m-card-pad" style={{background:"var(--surface-2)",padding:13}}>
        <div className="tiny muted-2">เครื่องจักร (จาก QR)</div>
        <div className="row between" style={{marginTop:3}}><span><span className="mono" style={{fontWeight:700}}>{mc.code}</span> <span className="small">{mc.name}</span></span><RankPill rank={mc.rank}/></div>
      </div>
      <MField label="ประเภทงาน"><div className="m-seg" style={{gridTemplateColumns:"1fr 1fr"}}>
        {["งานซ่อม","งานสร้าง"].map(x=><div key={x} className={"m-opt"+(type===x?" on-medium":"")} onClick={()=>setType(x)}>{x}</div>)}
      </div></MField>
      <MField label="อาการเสีย" req><textarea className="m-textarea" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="เช่น Heater element broken, temperature dropped"/></MField>
      <MField label="ความรุนแรง"><div className="m-seg" style={{gridTemplateColumns:"1fr 1fr",gap:8}}>
        {sevs.map(([v,k])=><div key={v} className={"m-opt"+(sev===v?" on-"+k:"")} onClick={()=>setSev(v)}>{v}</div>)}
      </div></MField>
      <MField label="แนบรูปถ่าย">
        <button className="m-btn" style={{justifyContent:"flex-start",gap:12,color:"var(--ink-2)"}} onClick={()=>nav.toast("เปิดกล้อง (prototype)")}>
          <span style={{width:38,height:38,borderRadius:10,background:"var(--surface-2)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="camera" size={20}/></span>
          ถ่ายรูปหน้างาน
        </button>
      </MField>
      <MInfoNote kind="info" icon="mail">เมื่อส่ง ระบบแจ้งทีมช่างและหัวหน้างานทันที ตามระดับความเสี่ยงของเครื่อง</MInfoNote>
      <button className="m-btn m-btn-primary m-btn-lg" onClick={submit}><Icon name="check" size={19}/> ส่งใบแจ้งซ่อม</button>
    </>
  );
};

/* --- Low part report --- */
window.MSCREENS.lowpart = function LowPart({ nav }){
  const mc = MS.machineByCode(nav.params.mc || "MC-001");
  const [code,setCode]=useState("");
  const [urgency,setUrgency]=useState("ด่วน");
  const part = MS.partByCode(code);
  const low = MS.parts.filter(p=>p.status!=="normal").sort((a,b)=>a.cur-b.cur).slice(0,4);
  const urg=[["ปกติ","low"],["ด่วน","high"],["ด่วนมาก","critical"]];
  const submit=()=>{ if(!code){ nav.toast("กรุณาเลือกอะไหล่","bad"); return; }
    nav.toast("ส่งแจ้งอะไหล่ใกล้หมดแล้ว · แจ้งเจ้าหน้าที่คลังตรวจสอบ","good"); nav.go("machine",{mc:mc.code}); };
  return (
    <>
      <div className="m-card m-card-pad" style={{background:"var(--surface-2)",padding:13}}>
        <div className="tiny muted-2">เครื่องจักร (จาก QR)</div>
        <div className="small" style={{marginTop:3}}><span className="mono" style={{fontWeight:700}}>{mc.code}</span> {mc.name}</div>
      </div>
      <div>
        <div className="m-sec">อะไหล่ที่ระบบพบว่าใกล้หมด</div>
        <div style={{display:"grid",gap:9}}>
          {low.map(p=>(
            <button key={p.code} className="m-card m-card-pad" style={{textAlign:"left",cursor:"pointer",padding:13,borderColor:code===p.code?"var(--accent)":"var(--border)",borderWidth:code===p.code?1.5:1}} onClick={()=>setCode(p.code)}>
              <div className="row between"><span><span className="mono small" style={{fontWeight:700}}>{p.code}</span> <span className="small">{p.name}</span></span><StockBadge status={p.status}/></div>
              <div className="tiny muted-2 mono" style={{marginTop:5}}>คงคลัง {p.cur} · ROP {p.rop} · Lead {p.leadTime} วัน</div>
            </button>
          ))}
        </div>
      </div>
      <MField label="หรือเลือกจากทั้งหมด" req>
        <select className="m-select" value={code} onChange={e=>setCode(e.target.value)}>
          <option value="">เลือกอะไหล่...</option>
          {MS.parts.map(p=><option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
        </select>
      </MField>
      <MField label="ความเร่งด่วน"><div className="m-seg">{urg.map(([u,k])=><div key={u} className={"m-opt"+(urgency===u?" on-"+k:"")} style={{fontSize:14}} onClick={()=>setUrgency(u)}>{u}</div>)}</div></MField>
      {part && <MInfoNote kind={part.status==="critical"?"bad":"warn"} icon="box">{part.code} คงคลังเหลือ <b>{part.cur}</b> · จุดสั่งซื้อ ROP {part.rop}{part.cur<=part.rop && " — ต่ำกว่าจุดสั่งซื้อแล้ว"}</MInfoNote>}
      <MInfoNote kind="info" icon="mail">ระบบจะแจ้งเจ้าหน้าที่คลังให้ตรวจสอบยอดจริงและเพิ่มเข้ารายการต้องสั่งซื้อ</MInfoNote>
      <button className="m-btn m-btn-warn m-btn-lg" onClick={submit}><Icon name="box" size={19}/> ส่งแจ้งอะไหล่ใกล้หมด</button>
    </>
  );
};

/* --- My requests --- */
window.MSCREENS.requests = function Requests({ nav }){
  const [f,setF]=useState("all");
  const filters=[["all","ทั้งหมด"],["Waiting","รอ"],["In Progress","กำลังซ่อม"],["Completed","เสร็จ"]];
  const list=MS.requests.filter(r=>f==="all"||r.status===f);
  return (
    <>
      <div className="m-chips">{filters.map(([v,l])=><button key={v} className={"m-chip"+(f===v?" on":"")} onClick={()=>setF(v)}>{l}</button>)}</div>
      <div style={{display:"grid",gap:10}}>{list.map(r=><ReqCard key={r.no} r={r} nav={nav}/>)}
      {list.length===0 && <div className="m-card m-card-pad muted small" style={{textAlign:"center"}}>ไม่มีรายการ</div>}</div>
    </>
  );
};

/* --- Request detail --- */
window.MSCREENS.reqDetail = function ReqDetail({ nav }){
  const r=MS.requests.find(x=>x.no===nav.params.no)||MS.requests[0];
  const rep=MS.repairs[r.no]; const use=MS.usage[r.no]||[];
  const total=use.reduce((s,u)=>s+u.unit*u.qty,0);
  return (
    <>
      <div className="m-card m-card-pad">
        <div className="row between"><span className="mono" style={{fontWeight:700,fontSize:16,whiteSpace:"nowrap"}}>{r.no}</span><JobBadge status={r.status}/></div>
        <div className="row gap-sm" style={{margin:"10px 0",flexWrap:"wrap"}}><span className="mono small" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><span className="small muted">{r.mcName}</span><PriorityTag p={r.priority}/></div>
        <div className="small" style={{padding:"10px 0",borderTop:"1px solid var(--border)"}}>{r.problem}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div><div className="tiny muted-2">ผู้แจ้ง</div><div className="small" style={{fontWeight:600}}>{r.reporter}</div></div>
          <div><div className="tiny muted-2">Downtime</div><div className="small mono" style={{fontWeight:600}}>{r.downtime!=null?r.downtime+" ชม.":"—"}</div></div>
        </div>
      </div>
      <div className="m-card m-card-pad"><div className="m-sec" style={{margin:"0 0 12px"}}>สถานะการดำเนินงาน</div><Timeline steps={mBuildTimeline(r,rep)}/>
        {r.status==="Completed" && (()=>{ const info=MS.prodStatus(r.no); return (
          <div style={{marginTop:4,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{width:20,height:20,borderRadius:"50%",flex:"none",display:"flex",alignItems:"center",justifyContent:"center",background:info.dot,color:"#fff"}}>
              {info.icon ? <Icon name={info.icon} size={12}/> : <span style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}></span>}
            </span>
            <div>
              <div className="small" style={{fontWeight:700}}>สถานะการอนุมัติ (ฝ่ายผลิต)</div>
              <span className={"badge "+info.cls} style={{marginTop:5}}><span className="dot"></span>{info.th}</span>
              {info.reason && <div className="small muted" style={{marginTop:6}}>หมายเหตุ: {info.reason}</div>}
            </div>
          </div>
        ); })()}
      </div>
      {rep && <div className="m-card m-card-pad"><div className="m-sec" style={{margin:"0 0 10px"}}>ผลการซ่อม</div>
        <div className="stack small" style={{display:"grid",gap:7}}>
          <div><span className="muted-2">ช่าง: </span>{rep.tech}</div>
          <div><span className="muted-2">สาเหตุราก: </span>{rep.root}</div>
          <div><span className="muted-2">วิธีแก้: </span>{rep.action}</div>
        </div></div>}
      {use.length>0 && <div className="m-card m-card-pad"><div className="row between" style={{marginBottom:10}}><div className="m-sec" style={{margin:0}}>อะไหล่ที่ใช้</div><span className="mono" style={{fontWeight:700}}>฿{MS.fmtNum(total)}</span></div>
        <div style={{display:"grid",gap:8}}>{use.map((u,i)=>(<div key={i} className="row between small"><span><span className="mono" style={{fontWeight:600}}>{u.code}</span> {u.name} ×{u.qty}</span><span className="mono">฿{MS.fmtNum(u.unit*u.qty)}</span></div>))}</div></div>}
    </>
  );
};

/* ============================================================
   TECHNICIAN
   ============================================================ */
const M_PRI={ Critical:0, High:1, Medium:2, Low:3 };

window.MSCREENS.queue = function Queue({ nav }){
  const [tab,setTab]=useState("open");
  const open=MS.requests.filter(r=>r.status!=="Completed");
  const done=MS.requests.filter(r=>r.status==="Completed");
  const list=(tab==="open"?open:done).slice().sort((a,b)=>M_PRI[a.priority]-M_PRI[b.priority]);
  return (
    <>
      <div className="m-seg"><div className={"m-opt"+(tab==="open"?" on-medium":"")} style={{fontSize:13.5,padding:"12px 6px",whiteSpace:"nowrap"}} onClick={()=>setTab("open")}>รอ/กำลังทำ · {open.length}</div>
        <div className={"m-opt"+(tab==="done"?" on-low":"")} style={{fontSize:13.5,padding:"12px 6px",whiteSpace:"nowrap"}} onClick={()=>setTab("done")}>เสร็จแล้ว · {done.length}</div></div>
      <div style={{display:"grid",gap:12}}>
        {list.map(r=>{ const mc=MS.machineByCode(r.mc); const hot=r.priority==="Critical"||(mc&&mc.rank==="A"&&r.status!=="Completed");
          return (
            <div key={r.no} className="m-card" style={{overflow:"hidden",borderColor:hot?"var(--red)":"var(--border)",borderWidth:hot?1.5:1}}>
              {hot && <div style={{background:"var(--red)",color:"#fff",padding:"5px 14px",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6}}><Icon name="alert" size={12}/> งานสำคัญ — ทำก่อน</div>}
              <button className="m-card-pad" style={{display:"block",width:"100%",textAlign:"left",border:0,background:"none",cursor:"pointer"}} onClick={()=>nav.go("job",{no:r.no})}>
                <div className="row between"><span className="mono small" style={{fontWeight:700,whiteSpace:"nowrap"}}>{r.no}</span><PriorityTag p={r.priority}/></div>
                <div className="row gap-sm" style={{margin:"8px 0 6px",flexWrap:"wrap"}}><span className="mono" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><span className="small muted">{r.mcName}</span>{mc&&<RankPill rank={mc.rank}/>}</div>
                <div className="small" style={{marginBottom:11}}>{r.problem}</div>
                <div className="row between"><span className="tiny muted-2 mono"><Icon name="clock" size={12}/> {r.date}</span>
                  <span className={"m-chip on"} style={{padding:"7px 14px"}}>{r.status==="In Progress"?"บันทึกผล":r.status==="Completed"?"ดูรายละเอียด":"กดรับงาน"} ›</span></div>
              </button>
            </div>
          );
        })}
        {list.length===0 && <div className="m-card m-card-pad muted small" style={{textAlign:"center"}}>ไม่มีงานในสถานะนี้</div>}
      </div>
    </>
  );
};

window.MSCREENS.job = function Job({ nav }){
  const r=MS.requests.find(x=>x.no===nav.params.no)||MS.requests[0];
  const rep=MS.repairs[r.no]; const mc=MS.machineByCode(r.mc);
  const waiting=r.status==="Waiting", inprog=r.status==="In Progress";
  return (
    <>
      <div className="m-card m-card-pad">
        <div className="row between"><span className="mono" style={{fontWeight:700,fontSize:16,whiteSpace:"nowrap"}}>{r.no}</span><JobBadge status={r.status}/></div>
        <div className="row gap-sm" style={{margin:"10px 0",flexWrap:"wrap"}}><span className="mono small" style={{fontWeight:600,whiteSpace:"nowrap"}}>{r.mc}</span><span className="small muted">{r.mcName}</span>{mc&&<RankPill rank={mc.rank}/>}<PriorityTag p={r.priority}/></div>
        <div className="small" style={{padding:"10px 0",borderTop:"1px solid var(--border)"}}>{r.problem}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div><div className="tiny muted-2">ผู้แจ้ง</div><div className="small" style={{fontWeight:600}}>{r.reporter}</div></div>
          <div><div className="tiny muted-2">แผนก</div><div className="small" style={{fontWeight:600}}>{r.dept}</div></div>
        </div>
      </div>
      <div className="m-card m-card-pad"><div className="m-sec" style={{margin:"0 0 12px"}}>สถานะ</div><Timeline steps={mBuildTimeline(r,rep)}/>
        {r.status==="Completed" && (()=>{ const info=MS.prodStatus(r.no); return (
          <div style={{marginTop:4,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{width:20,height:20,borderRadius:"50%",flex:"none",display:"flex",alignItems:"center",justifyContent:"center",background:info.dot,color:"#fff"}}>
              {info.icon ? <Icon name={info.icon} size={12}/> : <span style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}></span>}
            </span>
            <div>
              <div className="small" style={{fontWeight:700}}>สถานะการอนุมัติ (ฝ่ายผลิต)</div>
              <span className={"badge "+info.cls} style={{marginTop:5}}><span className="dot"></span>{info.th}</span>
              {info.reason && <div className="small muted" style={{marginTop:6}}>หมายเหตุ: {info.reason}</div>}
            </div>
          </div>
        ); })()}
      </div>
      {waiting && <button className="m-btn m-btn-primary m-btn-lg" onClick={()=>{ nav.toast("รับงาน "+r.no+" แล้ว","good"); nav.go("repair",{no:r.no}); }}><Icon name="clipboard" size={19}/> กดรับงานนี้</button>}
      {inprog && <button className="m-btn m-btn-success m-btn-lg" onClick={()=>nav.go("repair",{no:r.no})}><Icon name="wrench" size={19}/> บันทึกผลการซ่อม</button>}
    </>
  );
};

window.MSCREENS.repair = function Repair({ nav }){
  const r=MS.requests.find(x=>x.no===nav.params.no)||MS.requests[1];
  const [cat,setCat]=useState("Mechanical");
  const [cause,setCause]=useState("เสื่อมสภาพ");
  const [rows,setRows]=useState([{code:"",qty:1}]);
  const cats=["Electrical","Mechanical","Hydraulic","Pneumatic","Electronic","Other"];
  const causes=["ใช้งานผิดวิธี","เสื่อมสภาพ","ติดตั้งเพิ่ม"];
  const total=rows.reduce((s,row)=>{const p=MS.partByCode(row.code);return s+(p?p.price*row.qty:0);},0);
  const setRow=(i,patch)=>setRows(rs=>rs.map((x,j)=>j===i?{...x,...patch}:x));
  const save=()=>{ nav.sheet(close=>(
    <div style={{textAlign:"center",padding:"6px 4px 8px"}}>
      <div className="m-success"><Icon name="check" size={38}/></div>
      <div style={{fontFamily:"var(--display)",fontSize:20,fontWeight:600}}>บันทึกผลซ่อมแล้ว</div>
      <div className="small muted" style={{margin:"8px 0 4px"}}>ระบบตัดสต็อกอะไหล่อัตโนมัติ และปิดงานทันที</div>
      {total>0 && <div className="m-card m-card-pad" style={{margin:"14px 0",background:"var(--surface-2)"}}><div className="row between"><span className="small muted">ต้นทุนอะไหล่</span><span className="mono" style={{fontWeight:700,fontSize:17}}>฿{MS.fmtNum(total)}</span></div></div>}
      <button className="m-btn m-btn-primary" onClick={()=>{ close(); nav.tab("queue"); }}>กลับไปคิวงาน</button>
    </div>
  )); };
  return (
    <>
      <div className="m-card m-card-pad" style={{background:"var(--surface-2)",padding:13}}>
        <div className="row between"><span className="mono small" style={{fontWeight:700}}>{r.no}</span><JobBadge status={r.status}/></div>
        <div className="small" style={{marginTop:6}}><span className="mono" style={{fontWeight:600}}>{r.mc}</span> · {r.problem}</div>
      </div>
      <MField label="หมวดปัญหา"><select className="m-select" value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></MField>
      <MField label="สาเหตุราก (Root Cause)"><textarea className="m-textarea" style={{minHeight:72}} placeholder="เช่น O-ring seal degraded"/></MField>
      <MField label="วิธีแก้ไข"><textarea className="m-textarea" style={{minHeight:72}} placeholder="อธิบายการซ่อม"/></MField>
      <MField label="ประเภทสาเหตุ"><div className="m-seg">{causes.map(c=><div key={c} className={"m-opt"+(cause===c?" on-accent":"")} style={{fontSize:13}} onClick={()=>setCause(c)}>{c}</div>)}</div></MField>
      <div className="m-card" style={{overflow:"hidden"}}>
        <div className="row between" style={{padding:"13px 15px",borderBottom:"1px solid var(--border)"}}><span className="m-sec" style={{margin:0}}>อะไหล่ที่ใช้</span>
          <button className="m-chip" onClick={()=>setRows(rs=>[...rs,{code:"",qty:1}])}><Icon name="plus" size={13}/> เพิ่ม</button></div>
        <div style={{padding:13,display:"grid",gap:11}}>
          {rows.map((row,i)=>{ const p=MS.partByCode(row.code);
            return (
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 64px 40px",gap:8,alignItems:"center"}}>
                <select className="m-select" style={{padding:"11px 10px",fontSize:13.5}} value={row.code} onChange={e=>setRow(i,{code:e.target.value})}>
                  <option value="">เลือก...</option>{MS.parts.map(p=><option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
                </select>
                <input className="m-input" style={{padding:"11px 8px",textAlign:"center"}} type="number" min="1" value={row.qty} onChange={e=>setRow(i,{qty:+e.target.value||1})}/>
                <button className="m-btn" style={{padding:11,width:40}} onClick={()=>setRows(rs=>rs.filter((_,j)=>j!==i))}><Icon name="trash" size={16}/></button>
                {p && <div className="tiny muted-2 mono" style={{gridColumn:"1 / -1",marginTop:-5}}>คงคลัง {p.cur} · ฿{MS.fmtNum(p.price)}/หน่วย → ฿{MS.fmtNum(p.price*row.qty)}</div>}
              </div>
            );
          })}
        </div>
        <div className="row between" style={{padding:"13px 15px",borderTop:"1px solid var(--border)",background:"var(--surface-2)"}}><span className="small muted">ต้นทุนอะไหล่รวม</span><span className="mono" style={{fontWeight:700,fontSize:17}}>฿{MS.fmtNum(total)}</span></div>
      </div>
      <MInfoNote kind="warn" icon="alert">การบันทึกจะตัดสต็อกอะไหล่ออกจากคลังโดยอัตโนมัติ และปิดงานทันที</MInfoNote>
      <button className="m-btn m-btn-success m-btn-lg" onClick={save}><Icon name="check" size={19}/> บันทึกผลการซ่อม</button>
    </>
  );
};

Object.assign(window, { ReqCard, MInfoNote, MField, mBuildTimeline });
