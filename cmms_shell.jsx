/* ============================================================
   MT_System — CMMS app shell (RBAC nav, topbar, router) → window
   ============================================================ */
const S = window.DATA;

/* ---- navigation registry: module → meta + which roles can see it ---- */
const NAV = [
  { group:"ภาพรวม", items:[
    { id:"dashboard", icon:"gauge", label:"Dashboard", roles:["Manager","Supervisor","Admin"] },
  ]},
  { group:"งานซ่อมบำรุง", items:[
    { id:"requests", icon:"wrench", label:"ใบแจ้งซ่อม", roles:["Operator","Technician","Supervisor","Manager","Admin"] },
    { id:"workorders", icon:"clipboard", label:"Work Orders", roles:["Technician","Supervisor","Admin"] },
    { id:"pm", icon:"cal", label:"แผน PM", roles:["Supervisor","Technician","Manager","Admin"] },
  ]},
  { group:"สินทรัพย์ & คลัง", items:[
    { id:"machines", icon:"machine", label:"เครื่องจักร", roles:["Operator","Technician","Supervisor","Manager","Admin"] },
    { id:"inventory", icon:"box", label:"คลังอะไหล่", roles:["Store Keeper","Supervisor","Manager","Admin"] },
  ]},
  { group:"วิเคราะห์ & ระบบ", items:[
    { id:"reports", icon:"chart", label:"รายงาน & KPI", roles:["Manager","Supervisor","Admin"] },
    { id:"telegram", icon:"mail", label:"Telegram", roles:["Supervisor","Admin"] },
    { id:"users", icon:"user", label:"ผู้ใช้ & สิทธิ์", roles:["Admin"] },
  ]},
];
const PAGE_TITLE = {
  dashboard:["Executive Dashboard","ภาพรวมการบำรุงรักษาและ KPI"],
  requests:["ใบแจ้งซ่อม (Maintenance Requests)","แจ้ง ติดตาม และจัดการงานซ่อม"],
  workorders:["Work Orders","คิวงานช่าง · บันทึกการซ่อม · ปิดงาน"],
  pm:["แผนบำรุงรักษาเชิงป้องกัน (PM)","ตารางและปฏิทินการ PM"],
  machines:["เครื่องจักร (Machine Management)","ทะเบียนเครื่อง · QR · ประวัติ"],
  inventory:["คลังอะไหล่ (Spare Part Inventory)","Master · รับเข้า · เบิกออก · ROP"],
  reports:["รายงาน & การวิเคราะห์","MTTR · MTBF · Downtime · ต้นทุน"],
  telegram:["Telegram Notification","ตั้งค่าบอทและการแจ้งเตือน"],
  users:["ผู้ใช้งาน & สิทธิ์ (RBAC)","จัดการบัญชีและบทบาท"],
};
const NOTIFS = [
  { ic:"alert", c:"var(--red)", t:"งานวิกฤตใหม่", d:"REQ-2026-002 · MC-004 น้ำมันไฮดรอลิกรั่ว", time:"10 น." },
  { ic:"box", c:"var(--amber)", t:"อะไหล่ต่ำกว่า ROP", d:"PT-09 Proportion Valve · คงคลัง 0", time:"1 ชม." },
  { ic:"cal", c:"var(--amber)", t:"PM เกินกำหนด", d:"C16 เครื่องอัด 200 Ton", time:"วันนี้" },
  { ic:"checkCircle", c:"var(--green)", t:"งานอนุมัติแล้ว", d:"REQ-2026-001 ปิดงานเรียบร้อย", time:"3 ชม." },
];

const CMMS_TWEAKS = /*EDITMODE-BEGIN*/{ "fontFamily":"IBM Plex Sans Thai", "accent":"#b07d3a" }/*EDITMODE-END*/;

function CMMSApp(){
  const [t,setTweak]=useTweaks(CMMS_TWEAKS);
  const [theme,setTheme]=useState(()=>localStorage.getItem("cm_theme")||"light");
  const [role,setRole]=useState(()=>localStorage.getItem("cm_role")||"Manager");
  const [page,setPage]=useState(()=>localStorage.getItem("cm_page")||"dashboard");
  const [collapsed,setCollapsed]=useState(false);
  const [mobileNav,setMobileNav]=useState(false);
  const [menu,setMenu]=useState(null); // 'user' | 'notif' | null
  const [toast,setToast]=useState(null);
  const [authed,setAuthed]=useState(()=>localStorage.getItem("cm_authed")==="1");
  const [params,setParams]=useState({});

  useEffect(()=>{
    document.documentElement.setAttribute("data-theme",theme);
    localStorage.setItem("cm_theme",theme);
  },[theme]);
  useEffect(()=>{
    const fams={ "IBM Plex Sans Thai":'"IBM Plex Sans Thai",sans-serif', "Noto Sans Thai":'"Noto Sans Thai",sans-serif', "Sarabun":'"Sarabun",sans-serif' };
    document.documentElement.style.setProperty("--font", fams[t.fontFamily]||fams["IBM Plex Sans Thai"]);
    if(t.accent) document.documentElement.style.setProperty("--accent", t.accent);
  },[t]);
  useEffect(()=>{ localStorage.setItem("cm_role",role); },[role]);
  useEffect(()=>{ localStorage.setItem("cm_page",page); document.querySelector(".cm-content")?.scrollTo(0,0); window.scrollTo(0,0); },[page]);
  useEffect(()=>{ localStorage.setItem("cm_authed",authed?"1":"0"); },[authed]);

  const showToast=(msg,kind)=>{ setToast({msg,kind}); clearTimeout(window.__cmt); window.__cmt=setTimeout(()=>setToast(null),2800); };
  const nav={ role, theme, params,
    go:(p,pr={})=>{ setPage(p); setParams(pr); setMobileNav(false); },
    toast:showToast };

  // ensure current page is allowed for role; if not, jump to first allowed
  const allowed = (id)=> NAV.flatMap(g=>g.items).find(i=>i.id===id)?.roles.includes(role);
  useEffect(()=>{ if(!allowed(page)){ const first=NAV.flatMap(g=>g.items).find(i=>i.roles.includes(role)); if(first) setPage(first.id); } },[role]);

  if(!authed){
    const Login=window.CPAGES.login;
    return (
      <>
        <Login onLogin={(r)=>{ setRole(r); setAuthed(true); const first=NAV.flatMap(g=>g.items).find(i=>i.roles.includes(r)); setPage(first?first.id:"dashboard"); }} theme={theme} setTheme={setTheme}/>
        <Toast toast={toast}/>
      </>
    );
  }

  const u=S.roleUser[role];
  const Page=window.CPAGES[page]||window.CPAGES.dashboard;
  const [title,sub]=PAGE_TITLE[page]||["",""];
  const notifCount=NOTIFS.length;

  return (
    <div className="cm-app" onClick={()=>menu&&setMenu(null)}>
      {/* sidebar */}
      {mobileNav && <div className="cm-scrim" onClick={()=>setMobileNav(false)}></div>}
      <aside className={"cm-side"+(collapsed?" collapsed":"")+(mobileNav?" open":"")}>
        <div className="cm-brand">
          <span className="logo"><Icon name="wrench" size={19}/></span>
          <div className="col" style={{minWidth:0,lineHeight:1.1}}>
            <span className="nm">MT System</span>
            <span className="sub">CMMS Platform</span>
          </div>
        </div>
        <nav className="cm-nav">
          {NAV.map(g=>{
            const items=g.items.filter(i=>i.roles.includes(role));
            if(!items.length) return null;
            return (
              <div key={g.group} className="cm-nav-group">
                <div className="cm-nav-label">{g.group}</div>
                {items.map(i=>{
                  const pip = i.id==="requests" ? S.requests.filter(r=>r.status!=="Completed").length
                    : i.id==="inventory" ? S.parts.filter(p=>p.cur<=p.rop).length
                    : i.id==="pm" ? S.pm.filter(p=>p.status==="Overdue").length : 0;
                  return (
                    <button key={i.id} className={"cm-link"+(page===i.id?" on":"")} onClick={()=>nav.go(i.id)} title={i.label}>
                      <span className="ic"><Icon name={i.icon} size={19}/></span>
                      <span className="lbl">{i.label}</span>
                      {pip>0 && <span className="pip">{pip}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="cm-side-foot">
          <button className="cm-link" onClick={()=>setCollapsed(c=>!c)} title="ย่อ/ขยายเมนู">
            <span className="ic"><Icon name={collapsed?"chevR":"chevL"} size={19}/></span>
            <span className="lbl">ย่อเมนู</span>
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="cm-main">
        <header className="cm-top">
          <button className="cm-iconbtn cm-burger" onClick={()=>setMobileNav(true)}><Icon name="list" size={19}/></button>
          <div className="crumb grow">
            <b>{title}</b>
          </div>

          <div className="searchbar" style={{maxWidth:230,display:"flex"}}>
            <Icon name="search" size={16} style={{color:"var(--ink-3)"}}/>
            <input placeholder="ค้นหาเครื่อง / ใบแจ้ง / อะไหล่..." onKeyDown={e=>{ if(e.key==="Enter"){ showToast("ค้นหา: "+e.target.value,"mail"); } }}/>
          </div>

          <div className="cm-theme">
            <button className={theme==="light"?"on":""} onClick={()=>setTheme("light")} title="สว่าง"><Icon name="play" size={14} style={{transform:"none"}}/></button>
            <button className={theme==="dark"?"on":""} onClick={()=>setTheme("dark")} title="มืด"><Icon name="pin" size={14}/></button>
          </div>

          {/* notifications */}
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button className="cm-iconbtn" onClick={()=>setMenu(menu==="notif"?null:"notif")}>
              <Icon name="bell" size={19}/>{notifCount>0 && <span className="ndot"></span>}
            </button>
            {menu==="notif" && (
              <div className="cm-menu" style={{minWidth:310}}>
                <div className="row between" style={{padding:"6px 10px 9px"}}><span className="h-sm">การแจ้งเตือน</span><span className="badge b-red"><span className="dot"></span>{notifCount} ใหม่</span></div>
                {NOTIFS.map((n,i)=>(
                  <button key={i} className="cm-menu-item" style={{alignItems:"flex-start"}} onClick={()=>{ setMenu(null); showToast("เปิดการแจ้งเตือน","mail"); }}>
                    <span style={{color:n.c,marginTop:1,flex:"none"}}><Icon name={n.ic} size={17}/></span>
                    <span className="grow" style={{minWidth:0}}><span style={{fontWeight:700,fontSize:13}}>{n.t}</span><span className="small muted" style={{display:"block",whiteSpace:"normal"}}>{n.d}</span></span>
                    <span className="tiny muted-2" style={{flex:"none"}}>{n.time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* user / role */}
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button className="cm-userbtn" onClick={()=>setMenu(menu==="user"?null:"user")}>
              <span className="av">{u.short}</span>
              <span className="col" style={{minWidth:0,textAlign:"left",lineHeight:1.15}}>
                <span style={{fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>{u.name}</span>
                <span className="tiny muted-2" style={{whiteSpace:"nowrap"}}>{S.roleLabelTH[role]}</span>
              </span>
              <Icon name="chevD" size={15} style={{color:"var(--ink-3)"}}/>
            </button>
            {menu==="user" && (
              <div className="cm-menu">
                <div className="cm-nav-label" style={{padding:"4px 11px 6px"}}>สลับบทบาท (RBAC demo)</div>
                {["Operator","Technician","Supervisor","Store Keeper","Manager","Admin"].map(r=>(
                  <button key={r} className={"cm-menu-item"+(r===role?" on":"")} onClick={()=>{ setRole(r); setMenu(null); showToast("สลับเป็น "+S.roleLabelTH[r],"check"); }}>
                    <span style={{flex:"none",width:26,height:26,borderRadius:7,background:r===role?"var(--navy)":"var(--surface-2)",color:r===role?"var(--surface)":"var(--ink-3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{S.roleUser[r].short}</span>
                    <span className="grow"><span style={{fontWeight:600}}>{r}</span><span className="tiny muted-2" style={{display:"block"}}>{S.roleLabelTH[r]}</span></span>
                    {r===role && <Icon name="check" size={16}/>}
                  </button>
                ))}
                <div className="divider" style={{margin:"6px 0"}}></div>
                <a className="cm-menu-item" href="MT System.html" style={{textDecoration:"none"}}><Icon name="home" size={17}/> เวอร์ชันอื่น</a>
                <button className="cm-menu-item" onClick={()=>{ setAuthed(false); setMenu(null); }}><Icon name="logout" size={17}/> ออกจากระบบ</button>
              </div>
            )}
          </div>
        </header>

        <main className="cm-content">
          <Page nav={nav}/>
        </main>
      </div>

      <Toast toast={toast}/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="ธีม"/>
        <TweakRadio label="โหมดสี" value={theme} options={["light","dark"]} onChange={setTheme}/>
        <TweakSection label="ตัวอักษร"/>
        <TweakSelect label="ฟอนต์" value={t.fontFamily} options={["IBM Plex Sans Thai","Noto Sans Thai","Sarabun"]} onChange={v=>setTweak("fontFamily",v)}/>
        <TweakSection label="สีเน้น"/>
        <TweakColor label="Accent" value={t.accent} options={["#b07d3a","#3a6ea5","#3f7d57","#9a5b8c"]} onChange={v=>setTweak("accent",v)}/>
      </TweaksPanel>
    </div>
  );
}

window.CPAGES = window.CPAGES || {};
window.__mountCMMS=()=>ReactDOM.createRoot(document.getElementById("root")).render(<CMMSApp/>);
