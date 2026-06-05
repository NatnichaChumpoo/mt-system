/* ============================================================
   MT_System — MOBILE v2 (real camera QR scan, no FAB, no Manager)
   Loads AFTER mobile_screens.jsx; overrides the scan screen and
   provides its own shell. Does NOT touch the old mobile files.
   ============================================================ */
const M2 = window.DATA;
window.MSCREENS = window.MSCREENS || {};

/* ---------------- Real camera QR scan ---------------- */
window.MSCREENS.scan = function CameraScan({ nav }){
  const videoRef = useRef(null);
  const [status,setStatus] = useState("requesting"); // requesting | live | denied | error | unsupported
  const [detected,setDetected] = useState(null);
  const ref = useRef({ stream:null, raf:null, done:false, settled:false });

  useEffect(()=>{
    let cancelled=false;
    const canvas=document.createElement("canvas");
    const cctx=canvas.getContext("2d",{willReadFrequently:true});
    let detector=null;

    const matchMachine = (text)=>{
      if(!text) return null;
      const up=String(text).toUpperCase();
      const hit=M2.machines.find(m=> up.includes(m.code.toUpperCase()));
      return hit ? hit.code : null;
    };
    const handle=(text)=>{
      const code=matchMachine(text);
      if(code){ ref.current.done=true; ref.current.settled=true; setDetected(code);
        setTimeout(()=>{ if(!cancelled) nav.go("machine",{mc:code}); }, 420); }
      else { nav.toast("QR นี้ไม่ตรงกับเครื่องในระบบ: "+String(text).slice(0,24),"bad"); }
    };
    const loop=async ()=>{
      if(cancelled||ref.current.done) return;
      const v=videoRef.current;
      if(v && v.readyState>=2 && v.videoWidth){
        let text=null;
        try{
          if(detector){ const codes=await detector.detect(v); if(codes&&codes.length) text=codes[0].rawValue; }
          else if(window.jsQR){ canvas.width=v.videoWidth; canvas.height=v.videoHeight; cctx.drawImage(v,0,0);
            const img=cctx.getImageData(0,0,canvas.width,canvas.height); const r=window.jsQR(img.data,img.width,img.height,{inversionAttempts:"dontInvert"}); if(r&&r.data) text=r.data; }
        }catch(e){}
        if(text){ handle(text); return; }
      }
      ref.current.raf=requestAnimationFrame(loop);
    };
    const start=async ()=>{
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ ref.current.settled=true; setStatus("unsupported"); return; }
      setStatus("requesting");
      try{
        const stream=await navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:"environment" } }, audio:false });
        if(cancelled){ stream.getTracks().forEach(t=>t.stop()); return; }
        ref.current.stream=stream;
        const v=videoRef.current; if(!v){ stream.getTracks().forEach(t=>t.stop()); return; }
        v.srcObject=stream; v.setAttribute("playsinline","true"); await v.play().catch(()=>{});
        ref.current.settled=true; setStatus("live");
        if("BarcodeDetector" in window){ try{ detector=new window.BarcodeDetector({ formats:["qr_code"] }); }catch(e){ detector=null; } }
        loop();
      }catch(e){ if(!cancelled){ ref.current.settled=true; setStatus((e&&(e.name==="NotAllowedError"||e.name==="SecurityError"))?"denied":"error"); } }
    };
    start();
    const tmo=setTimeout(()=>{ if(!cancelled && !ref.current.settled){ ref.current.settled=true; setStatus("error"); } }, 5000);
    return ()=>{ cancelled=true; clearTimeout(tmo); if(ref.current.raf) cancelAnimationFrame(ref.current.raf);
      if(ref.current.stream) ref.current.stream.getTracks().forEach(t=>t.stop()); };
  // eslint-disable-next-line
  },[]);

  const live = status==="live";
  const failed = status==="denied"||status==="error"||status==="unsupported";
  const statusText = { requesting:"กำลังเปิดกล้อง…", live:"เล็งกล้องไปที่ QR ที่ติดหน้าเครื่องจักร",
    denied:"ไม่ได้รับสิทธิ์ใช้กล้อง", error:"เปิดกล้องไม่สำเร็จ", unsupported:"อุปกรณ์นี้ไม่รองรับกล้อง" }[status];

  return (
    <div style={{margin:"-16px -16px -20px",display:"flex",flexDirection:"column",minHeight:"100%"}}>
      {/* camera viewport */}
      <div style={{position:"relative",background:"#16140f",minHeight:380,flex:1,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <video ref={videoRef} muted playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:live?1:0,transition:".3s"}}></video>
        {!live && <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#2c2820,#16140f)"}}></div>}

        {/* top status */}
        <div style={{position:"absolute",top:14,left:14,right:14,textAlign:"center",zIndex:3}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(0,0,0,.45)",color:"#fff",padding:"7px 13px",borderRadius:99,fontSize:12.5,backdropFilter:"blur(6px)"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background: detected?"#9ed0ad":live?"var(--accent-2)":"#e8d8b4",boxShadow:detected?"0 0 8px #9ed0ad":"none"}}></span>
            {detected?("พบเครื่อง "+detected):statusText}
          </span>
        </div>

        {/* scan frame */}
        {!failed && (
          <div style={{width:220,height:220,position:"relative",zIndex:2}}>
            {[[0,0],[1,0],[0,1],[1,1]].map(([x,y],i)=>(
              <span key={i} style={{position:"absolute",[x?"right":"left"]:0,[y?"bottom":"top"]:0,width:40,height:40,
                borderTop:y?"0":"3px solid "+(detected?"#9ed0ad":"var(--accent-2)"),borderBottom:y?"3px solid "+(detected?"#9ed0ad":"var(--accent-2)"):"0",
                borderLeft:x?"0":"3px solid "+(detected?"#9ed0ad":"var(--accent-2)"),borderRight:x?"3px solid "+(detected?"#9ed0ad":"var(--accent-2)"):"0",
                borderTopLeftRadius:!x&&!y?14:0,borderTopRightRadius:x&&!y?14:0,borderBottomLeftRadius:!x&&y?14:0,borderBottomRightRadius:x&&y?14:0}}></span>
            ))}
            {live && !detected && <div style={{position:"absolute",left:8,right:8,top:"50%",height:2,background:"var(--accent-2)",boxShadow:"0 0 12px var(--accent-2)",animation:"m2scan 2s ease-in-out infinite"}}></div>}
            {detected && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#9ed0ad"}}><Icon name="checkCircle" size={56}/></div>}
          </div>
        )}

        {failed && (
          <div style={{position:"relative",zIndex:2,textAlign:"center",color:"#fff",padding:"0 30px"}}>
            <div style={{width:60,height:60,borderRadius:16,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Icon name="camera" size={28}/></div>
            <div style={{fontWeight:700,fontSize:15}}>{statusText}</div>
            <div style={{fontSize:13,opacity:.7,marginTop:6,lineHeight:1.5}}>เปิดสิทธิ์กล้องในเบราว์เซอร์ แล้วลองใหม่ หรือเลือกเครื่องด้วยตนเองด้านล่าง</div>
          </div>
        )}
      </div>

      {/* manual fallback */}
      <div style={{padding:16,background:"var(--surface)"}}>
        <div className="m-sec">เลือกเครื่องด้วยตนเอง</div>
        <select className="m-select" defaultValue="" onChange={e=>{ if(e.target.value) nav.go("machine",{mc:e.target.value}); }}>
          <option value="">เลือกเครื่องจักร…</option>
          {M2.machines.map(m=><option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
        </select>
        <div className="m-chips" style={{marginTop:12}}>
          {M2.machines.slice(0,5).map(m=><button key={m.code} className="m-chip" onClick={()=>nav.go("machine",{mc:m.code})}>{m.code}</button>)}
        </div>
      </div>
    </div>
  );
};

/* ---------------- Supervisor: approvals + approve ---------------- */
window.MSCREENS.approvals = function Approvals2({ nav }){
  const pending=M2.requests.filter(r=>r.status==="Completed");
  const waiting=M2.requests.filter(r=>r.status!=="Completed");
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div className="m-stat"><div className="v" style={{color:"var(--amber-ink)"}}>{pending.filter(r=>{const x=M2.repairs[r.no];return x&&x.verify!=="Approved";}).length}</div><div className="k">รอตรวจรับ</div></div>
        <div className="m-stat"><div className="v" style={{color:"var(--blue-ink)"}}>{waiting.length}</div><div className="k">กำลังซ่อม/รอ</div></div>
      </div>
      <div className="m-sec">งานรอตรวจรับ</div>
      <div style={{display:"grid",gap:12}}>
        {pending.map(r=>{ const rep=M2.repairs[r.no]; const approved=rep&&rep.verify==="Approved";
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

window.MSCREENS.approve = function Approve2({ nav }){
  const r=M2.requests.find(x=>x.no===nav.params.no)||M2.requests[0];
  const rep=M2.repairs[r.no]; const use=M2.usage[r.no]||[];
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
      {use.length>0 && <div className="m-card m-card-pad"><div className="row between" style={{marginBottom:10}}><div className="m-sec" style={{margin:0}}>อะไหล่ที่ใช้</div><span className="mono" style={{fontWeight:700}}>฿{M2.fmtNum(total)}</span></div>
        {use.map((u,i)=><div key={i} className="row between small" style={{padding:"4px 0"}}><span><span className="mono" style={{fontWeight:600}}>{u.code}</span> {u.name} ×{u.qty}</span><span className="mono">฿{M2.fmtNum(u.unit*u.qty)}</span></div>)}</div>}
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

/* ---------------- Notifications ---------------- */
window.MSCREENS.notifications = function Notifications2(){
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
window.MSCREENS.profile = function Profile2({ nav }){
  const u=M2.roleUser[nav.role];
  return (
    <>
      <div className="m-card m-card-pad" style={{textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:"var(--navy)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,margin:"4px auto 12px"}}>{u.short}</div>
        <div style={{fontFamily:"var(--display)",fontSize:19,fontWeight:600}}>{u.name}</div>
        <div className="small muted">{nav.role} · {M2.roleLabelTH[nav.role]}</div>
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
   Shell v2 — no FAB, header scan button, roles minus Manager
   ============================================================ */
const ROLE_TABS2 = {
  "Operator":   { home:"home", scan:true, tabs:[{s:"home",l:"หน้าหลัก",ic:"home"},{s:"requests",l:"งานของฉัน",ic:"list"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
  "Technician": { home:"queue", scan:true, tabs:[{s:"queue",l:"คิวงาน",ic:"wrench"},{s:"requests",l:"ประวัติ",ic:"list"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
  "Supervisor": { home:"approvals", scan:false, tabs:[{s:"approvals",l:"ตรวจรับ",ic:"checkCircle"},{s:"requests",l:"ใบแจ้ง",ic:"list"},{s:"notifications",l:"แจ้งเตือน",ic:"bell"},{s:"profile",l:"บัญชี",ic:"user"}] },
};
const MOBILE_ROLES2 = ["Operator","Technician","Supervisor"];
const SCREEN_TITLE2 = {
  home:"หน้าหลัก", scan:"สแกน QR ด้วยกล้อง", machine:"ข้อมูลเครื่อง", report:"แจ้งซ่อม", lowpart:"แจ้งอะไหล่ใกล้หมด",
  requests:"ใบแจ้งซ่อม", reqDetail:"รายละเอียดใบแจ้ง", queue:"คิวงานซ่อม", job:"รายละเอียดงาน", repair:"บันทึกการซ่อม",
  approvals:"ตรวจรับงาน", approve:"ตรวจรับงาน", notifications:"การแจ้งเตือน", profile:"บัญชีผู้ใช้",
};
const CREAM_HEAD2 = { scan:true };
const M2_TWEAKS = /*EDITMODE-BEGIN*/{ "fontFamily":"IBM Plex Sans Thai", "brand":"#232019" }/*EDITMODE-END*/;

function MobileApp2(){
  const [role,setRole]=useState(()=>localStorage.getItem("m2_role")||"Operator");
  const [tab,setTab]=useState(()=>ROLE_TABS2[localStorage.getItem("m2_role")||"Operator"].home);
  const [screen,setScreen]=useState(tab);
  const [params,setParams]=useState({});
  const [stack,setStack]=useState([]);
  const [toast,setToast]=useState(null);
  const [sheet,setSheet]=useState(null);

  const showToast=(msg,kind)=>{ setToast({msg,kind}); clearTimeout(window.__m2t); window.__m2t=setTimeout(()=>setToast(null),2800); };
  const scrollTop=()=>{ const b=document.querySelector(".m-body"); if(b) b.scrollTop=0; };
  const nav={ role, params,
    go:(s,p={})=>{ setStack(st=>[...st,{screen,params}]); setScreen(s); setParams(p); setTimeout(scrollTop,0); },
    back:()=>setStack(st=>{ if(!st.length) return st; const p=st[st.length-1]; setScreen(p.screen); setParams(p.params); return st.slice(0,-1); }),
    tab:(s)=>{ setTab(s); setScreen(s); setParams({}); setStack([]); setTimeout(scrollTop,0); },
    toast:showToast, sheet:(fn)=>setSheet(()=>fn), roleSheet:()=>setSheet(()=>roleSheetContent) };
  const switchRole=(r)=>{ setRole(r); localStorage.setItem("m2_role",r); const h=ROLE_TABS2[r].home; setTab(h); setScreen(h); setParams({}); setStack([]); setSheet(null); setTimeout(scrollTop,0); };

  const roleSheetContent=(close)=>(
    <div>
      <div className="m-sec" style={{margin:"2px 2px 12px"}}>สลับบทบาท (prototype)</div>
      <div style={{display:"grid",gap:9}}>
        {MOBILE_ROLES2.map(r=>(
          <button key={r} className="m-card m-card-pad" style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",padding:14,borderColor:r===role?"var(--accent)":"var(--border)",borderWidth:r===role?1.5:1}} onClick={()=>switchRole(r)}>
            <span style={{textAlign:"left"}}><span style={{fontWeight:700,fontSize:14.5}}>{r}</span><span className="small muted" style={{display:"block"}}>{M2.roleLabelTH[r]}</span></span>
            {r===role?<Icon name="check" size={18} style={{color:"var(--accent)"}}/>:<Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/>}
          </button>
        ))}
      </div>
      <MInfoNote kind="info" icon="home"><span>บทบาท <b>ผู้บริหาร · คลัง · Admin</b> เหมาะกับงานบนเดสก์ท็อป — เปิดได้จากแท็บบัญชี › เวอร์ชันเดสก์ท็อป</span></MInfoNote>
      <button className="m-btn" style={{marginTop:12}} onClick={close}>ปิด</button>
    </div>
  );

  const cfg=ROLE_TABS2[role];
  const Comp=window.MSCREENS[screen]||window.MSCREENS[cfg.home];
  const canBack=stack.length>0;
  const u=M2.roleUser[role];
  const canScan=cfg.scan;

  return (
    <div className="m-app" style={{position:"relative"}}>
      <div className={"m-head"+(CREAM_HEAD2[screen]?" cream":"")}>
        <div className="m-head-row">
          <div className="row gap-sm" style={{minWidth:0,flex:1}}>
            {canBack && <button className="icon-btn" style={{width:36,height:36,flex:"none"}} onClick={nav.back}><Icon name="chevL" size={18}/></button>}
            <div style={{minWidth:0,flex:1}}>
              <div className="m-title" style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{SCREEN_TITLE2[screen]||"MT System"}</div>
              {!canBack && <div className="m-sub">{M2.roleLabelTH[role]}</div>}
            </div>
          </div>
          <div className="row gap-sm" style={{flex:"none"}}>
            <button onClick={()=>nav.tab("profile")} style={{flex:"none",width:38,height:38,borderRadius:11,background:"var(--navy)",color:"#fff",border:0,fontWeight:700,fontSize:13,cursor:"pointer"}}>{u.short}</button>
          </div>
        </div>
      </div>

      <div className="m-body"><Comp nav={nav}/></div>

      {toast && <div className="m-toast">
        <span style={{color: toast.kind==="bad"?"#ff9b95":toast.kind==="good"?"#9ed0ad":"#bcd0e6", flex:"none"}}><Icon name={toast.kind==="bad"?"alert":toast.kind==="good"?"checkCircle":"mail"} size={18}/></span>
        <span>{toast.msg}</span>
      </div>}

      {sheet && <div className="m-sheet-scrim" onClick={()=>setSheet(null)}>
        <div className="m-sheet" onClick={e=>e.stopPropagation()}><div className="m-grab"></div>{sheet(()=>setSheet(null))}</div>
      </div>}

      <div className="m-tabs">
        {cfg.tabs.map((tb,i)=>(
          <button key={i} className={"m-tab"+((tab===tb.s)?" on":"")} onClick={()=>nav.tab(tb.s)}>
            <Icon name={tb.ic} size={23}/><span className="lbl">{tb.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileApp2_Wrapper(){
  const [t,setTweak]=useTweaks(M2_TWEAKS);
  useEffect(()=>{
    const fams={ "IBM Plex Sans Thai":'"IBM Plex Sans Thai",sans-serif', "Noto Sans Thai":'"Noto Sans Thai",sans-serif', "Sarabun":'"Sarabun",sans-serif' };
    document.documentElement.style.setProperty("--font", fams[t.fontFamily]||fams["IBM Plex Sans Thai"]);
    document.documentElement.style.setProperty("--navy", t.brand);
  },[t]);
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px",
      background:"radial-gradient(900px 500px at 50% -10%, #efe6d6, #e6e1d8 60%)"}}>
      <IOSDevice><MobileApp2/></IOSDevice>
      <TweaksPanel title="Tweaks">
        <TweakSection label="ตัวอักษร"/>
        <TweakSelect label="ฟอนต์" value={t.fontFamily} options={["IBM Plex Sans Thai","Noto Sans Thai","Sarabun"]} onChange={v=>setTweak("fontFamily",v)}/>
        <TweakSection label="โทนแบรนด์"/>
        <TweakColor label="สี Chrome" value={t.brand} options={["#232019","#1f2a24","#2a2433","#26201a"]} onChange={v=>setTweak("brand",v)}/>
      </TweaksPanel>
    </div>
  );
}

/* scan-line keyframes */
(function(){ if(document.getElementById("m2-kf")) return; const s=document.createElement("style"); s.id="m2-kf";
  s.textContent="@keyframes m2scan{0%{transform:translateY(-96px)}50%{transform:translateY(96px)}100%{transform:translateY(-96px)}}"; document.head.appendChild(s); })();

window.__mountMobile2=()=>ReactDOM.createRoot(document.getElementById("root")).render(<MobileApp2_Wrapper/>);
