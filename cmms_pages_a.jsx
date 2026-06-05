/* ============================================================
   MT_System — CMMS pages A: Login, Dashboard, Machines/QR
   ============================================================ */
const A = window.DATA;
window.CPAGES = window.CPAGES || {};

/* ---------------- Login ---------------- */
window.CPAGES.login = function Login({ onLogin, theme, setTheme }){
  const [u,setU]=useState("direk");
  const [p,setP]=useState("••••••••");
  const [role,setRole]=useState("Manager");
  const roles=["Operator","Technician","Supervisor","Store Keeper","Manager","Admin"];
  return (
    <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr",background:"var(--bg)"}}>
      {/* brand panel */}
      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(155deg,#1f1b14,#14304a 130%)",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"44px 48px",color:"#fff"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(520px 320px at 80% -5%, rgba(199,154,91,.30), transparent 60%)"}}></div>
        <div className="row gap-sm" style={{position:"relative"}}>
          <span style={{width:42,height:42,borderRadius:11,background:"var(--accent-2)",color:"#1f1b14",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="wrench" size={22}/></span>
          <div><div style={{fontWeight:700,fontSize:19}}>MT System</div><div style={{fontSize:12,opacity:.7}}>CMMS Platform</div></div>
        </div>
        <div style={{position:"relative"}}>
          <div style={{fontSize:34,fontWeight:600,lineHeight:1.2,letterSpacing:"-.01em"}}>ระบบบริหารงาน<br/>ซ่อมบำรุงเครื่องจักร</div>
          <div style={{fontSize:15,opacity:.78,marginTop:16,lineHeight:1.6,maxWidth:380}}>
            จัดการงานแจ้งซ่อม · บำรุงรักษาเชิงป้องกัน · คุมสต็อกอะไหล่ · ติดตาม KPI พร้อมแจ้งเตือนผ่าน Telegram แบบเรียลไทม์
          </div>
          <div className="row" style={{gap:26,marginTop:28}}>
            {[["MTBF","420 ชม."],["MTTR","1.38 ชม."],["PM","80%"]].map(([k,v])=>(
              <div key={k}><div style={{fontFamily:"var(--mono)",fontSize:22,fontWeight:700}}>{v}</div><div style={{fontSize:11.5,opacity:.6,letterSpacing:".05em"}}>{k}</div></div>
            ))}
          </div>
        </div>
        <div style={{position:"relative",fontSize:12,opacity:.5}}>© 2026 MT System · Manufacturing Maintenance</div>
      </div>

      {/* form */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative"}}>
        <div style={{position:"absolute",top:22,right:24}}>
          <div className="cm-theme">
            <button className={theme==="light"?"on":""} onClick={()=>setTheme("light")}><Icon name="play" size={14} style={{transform:"none"}}/></button>
            <button className={theme==="dark"?"on":""} onClick={()=>setTheme("dark")}><Icon name="pin" size={14}/></button>
          </div>
        </div>
        <div style={{width:"100%",maxWidth:380}}>
          <div className="h-lg" style={{marginBottom:4}}>เข้าสู่ระบบ</div>
          <div className="muted small" style={{marginBottom:24}}>ยินดีต้อนรับกลับ · กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</div>
          <div className="field"><label>ชื่อผู้ใช้ (Username)</label><input className="input" value={u} onChange={e=>setU(e.target.value)}/></div>
          <div className="field"><label>รหัสผ่าน (Password)</label><input className="input" type="password" value={p} onChange={e=>setP(e.target.value)}/></div>
          <div className="field"><label>เข้าใช้งานในบทบาท (สำหรับเดโม)</label>
            <select className="select" value={role} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r} value={r}>{r} · {A.roleLabelTH[r]}</option>)}</select>
          </div>
          <div className="row between" style={{margin:"4px 0 18px"}}>
            <label className="row gap-sm" style={{cursor:"pointer",fontSize:13}}><input type="checkbox" defaultChecked/> จดจำฉันไว้</label>
            <a href="#" className="small" style={{color:"var(--accent)",fontWeight:600,textDecoration:"none"}} onClick={e=>e.preventDefault()}>ลืมรหัสผ่าน?</a>
          </div>
          <button className="btn btn-primary btn-lg btn-block" onClick={()=>onLogin(role)}><Icon name="logout" size={18} style={{transform:"scaleX(-1)"}}/> เข้าสู่ระบบ</button>
          <div className="muted-2 tiny" style={{textAlign:"center",marginTop:18}}>ยังไม่มีบัญชี? ติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีและกำหนดสิทธิ์</div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Dashboard ---------------- */
window.CPAGES.dashboard = function Dashboard({ nav }){
  const openReq=A.requests.filter(r=>r.status!=="Completed").length;
  const critical=A.requests.filter(r=>r.priority==="Critical").length;
  const reorder=A.parts.filter(p=>p.cur<=p.rop).length;
  const overdue=A.pm.filter(p=>p.status==="Overdue").length;
  return (
    <>
      {/* KPI strip */}
      <div className="grid-auto" style={{marginBottom:18}}>
        {A.kpi.map(k=><KpiCard key={k.key} k={k}/>)}
      </div>

      {/* status row */}
      <div className="grid-auto" style={{marginBottom:18}}>
        <StatCard icon="wrench" tone="blue" value={openReq} label="ใบแจ้งที่ยังเปิดอยู่" foot={<span className="small muted">รวมรอ + กำลังซ่อม</span>}/>
        <StatCard icon="alert" tone="red" value={critical} label="งานวิกฤต (Critical)" foot={<span className="badge b-red"><span className="dot"></span>ต้องเร่งดำเนินการ</span>}/>
        <StatCard icon="box" tone="amber" value={reorder} label="อะไหล่ต่ำกว่า ROP" foot={<span className="small muted">ควรสั่งซื้อ</span>}/>
        <StatCard icon="cal" tone="green" value={overdue} label="PM เกินกำหนด" foot={<span className="small muted">จาก {A.pm.length} แผน</span>}/>
      </div>

      <div className="grid-2" style={{marginBottom:18}}>
        {/* downtime trend */}
        <div className="panel">
          <div className="panel-head"><div className="h-sm">แนวโน้ม Downtime (6 เดือน)</div><span className="delta delta-up"><Icon name="arrowDown" size={13}/> ดีขึ้นต่อเนื่อง</span></div>
          <div className="panel-body"><AreaChart data={A.downtimeTrend} color="var(--accent)"/></div>
        </div>
        {/* pareto */}
        <div className="panel">
          <div className="panel-head"><div className="h-sm">Top Failure Causes (Pareto)</div><button className="btn btn-sm" onClick={()=>nav.go("reports")}>ดูทั้งหมด</button></div>
          <div className="panel-body"><ParetoBars rows={A.pareto.slice(0,6)} color="var(--red)"/></div>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:18}}>
        {/* risk matrix */}
        <div className="panel">
          <div className="panel-head"><div className="h-sm">Risk Matrix</div><span className="tiny muted-2">Machine Rank × Part Criticality</span></div>
          <div className="panel-body">
            <div style={{display:"grid",gridTemplateColumns:"auto repeat(3,1fr)",gap:7}}>
              <div></div>
              {A.riskGrid.cols.map(c=><div key={c} className="tiny" style={{textAlign:"center",fontWeight:700,color:"var(--ink-2)",paddingBottom:4}}>{c.replace(" Part","")}</div>)}
              {A.riskGrid.rows.map(row=>(
                <React.Fragment key={row}>
                  <div className="tiny" style={{fontWeight:700,color:"var(--ink-2)",display:"flex",alignItems:"center"}}>{row}</div>
                  {A.riskGrid.zone[row].map((z,i)=>(
                    <div key={i} style={{borderRadius:9,padding:"16px 6px",textAlign:"center",fontWeight:700,fontSize:11.5,color:"#fff",
                      background:z==="HIGH"?"var(--red)":z==="MEDIUM"?"var(--amber)":"var(--green)"}}>{z}</div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        {/* inventory by group */}
        <div className="panel">
          <div className="panel-head"><div className="h-sm">สรุปคลังแยกตาม MC Group</div><button className="btn btn-sm" onClick={()=>nav.go("inventory")}>คลังอะไหล่</button></div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Group</th><th className="num">มูลค่า</th><th className="num">ต่ำกว่า ROP</th><th>Risk</th></tr></thead>
            <tbody>{A.mcGroups.map(g=>(
              <tr key={g.group}><td style={{fontWeight:600}}>{g.group}</td><td className="num mono small">{A.fmtMoney(g.value)}</td>
              <td className="num mono" style={{fontWeight:g.reorder>5?700:400,color:g.reorder>5?"var(--amber-ink)":"var(--ink)"}}>{g.reorder}</td>
              <td><RiskTag zone={g.risk}/></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      </div>

      {/* active critical alert */}
      <div className="panel" style={{borderColor:"var(--red)"}}>
        <div className="panel-head" style={{background:"var(--red-bg)"}}><div className="row gap-sm"><Icon name="alert" size={17} style={{color:"var(--red)"}}/><span className="h-sm">รายการวิกฤตที่ต้องดำเนินการทันที</span></div><button className="btn btn-sm btn-danger" onClick={()=>nav.go("requests")}>จัดการ</button></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>เลขที่</th><th>เครื่อง</th><th>อาการ</th><th>ความรุนแรง</th><th>สถานะ</th></tr></thead>
          <tbody>{A.requests.filter(r=>r.priority==="Critical"||r.priority==="High").map(r=>(
            <tr key={r.no}><td className="cell-code">{r.no}</td><td><span className="mono small">{r.mc}</span></td><td className="small">{r.problem}</td><td><PriorityTag p={r.priority}/></td><td><JobBadge status={r.status}/></td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
};

/* ---------------- Machines ---------------- */
window.CPAGES.machines = function Machines({ nav }){
  const [q,setQ]=useState("");
  const [grp,setGrp]=useState("all");
  const [sel,setSel]=useState(null);
  const groups=["all",...new Set(A.machines.map(m=>m.group))];
  const rows=A.machines.filter(m=>(grp==="all"||m.group===grp)&&(q===""||(m.code+m.name).toLowerCase().includes(q.toLowerCase())));
  const { sorted, sort, onSort }=useSort(rows,{key:"code",dir:1});
  const canManage=nav.role==="Admin";

  if(sel) return <MachineDetail mc={sel} onBack={()=>setSel(null)} nav={nav}/>;

  return (
    <>
      <div className="grid-auto" style={{marginBottom:18}}>
        <StatCard icon="machine" tone="navy" value={A.machines.length} label="เครื่องจักรทั้งหมด"/>
        <StatCard icon="play" tone="green" value={A.machines.filter(m=>m.status==="Running").length} label="กำลังเดินเครื่อง"/>
        <StatCard icon="stop" tone="red" value={A.machines.filter(m=>m.status==="Stop").length} label="หยุดเดินเครื่อง"/>
        <StatCard icon="alert" tone="amber" value={A.machines.filter(m=>m.rank==="A").length} label="เครื่อง Rank A (สำคัญ)"/>
      </div>

      <div className="panel">
        <div className="panel-head wrap" style={{gap:12}}>
          <div className="row gap-sm wrap">
            <SearchBar value={q} onChange={setQ} placeholder="ค้นหารหัส/ชื่อเครื่อง..."/>
            <div className="seg-pill">{groups.slice(0,5).map(g=><button key={g} className={grp===g?"on":""} onClick={()=>setGrp(g)}>{g==="all"?"ทั้งหมด":g}</button>)}</div>
          </div>
          {canManage && <button className="btn btn-primary" onClick={()=>nav.toast("เพิ่มเครื่องจักรใหม่ (prototype)","check")}><Icon name="plus" size={16}/> เพิ่มเครื่อง</button>}
        </div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr>
            <Th k="code" sort={sort} onSort={onSort}>รหัส</Th>
            <Th k="name" sort={sort} onSort={onSort}>ชื่อเครื่อง</Th>
            <Th k="group" sort={sort} onSort={onSort}>กลุ่ม</Th>
            <th>Rank</th><Th k="dept" sort={sort} onSort={onSort}>แผนก</Th>
            <th>สถานะ</th><th></th>
          </tr></thead>
          <tbody>{sorted.map(m=>(
            <tr key={m.code} style={{cursor:"pointer"}} onClick={()=>setSel(m.code)}>
              <td className="cell-code">{m.code}</td>
              <td style={{fontWeight:600}}>{m.name}</td>
              <td><span className="chip">{m.group}</span></td>
              <td><RankPill rank={m.rank}/></td>
              <td className="small muted">{m.dept}</td>
              <td><span className={"badge "+(m.status==="Running"?"b-green":"b-red")}><span className="dot"></span>{m.status}</span></td>
              <td><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
};

function MachineDetail({ mc, onBack, nav }){
  const m=A.machineByCode(mc);
  const hist=A.requestsForMachine(mc);
  const pm=A.pm.filter(p=>p.mc===mc);
  return (
    <>
      <button className="btn btn-ghost" style={{marginBottom:14}} onClick={onBack}><Icon name="chevL" size={16}/> กลับไปทะเบียนเครื่อง</button>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px",gap:18,alignItems:"start"}}>
        <div className="stack" style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="panel">
            <div className="panel-head"><div className="row gap-sm"><span className="mono" style={{fontWeight:700,fontSize:18}}>{m.code}</span><RankPill rank={m.rank}/><span className={"badge "+(m.status==="Running"?"b-green":"b-red")}><span className="dot"></span>{m.status}</span></div>
              <span className="chip">{m.group}</span></div>
            <div className="panel-body grid" style={{gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
              {[["ชื่อเครื่อง",m.name],["แผนก",m.dept],["ตำแหน่ง",m.zone],["ผู้ผลิต",m.maker],["รุ่น",m.model],["ติดตั้งเมื่อ",m.install],["Criticality",m.crit],["Machine Rank","Rank "+m.rank]].map(([k,v])=>(
                <div key={k}><div className="tiny muted-2">{k}</div><div className="small" style={{fontWeight:600}}>{v}</div></div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><div className="h-sm">ประวัติการแจ้งซ่อม ({hist.length})</div></div>
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>เลขที่</th><th>อาการ</th><th>ความรุนแรง</th><th>สถานะ</th><th className="num">Downtime</th></tr></thead>
              <tbody>{hist.length?hist.map(r=>(
                <tr key={r.no}><td className="cell-code">{r.no}</td><td className="small">{r.problem}</td><td><PriorityTag p={r.priority}/></td><td><JobBadge status={r.status}/></td><td className="num mono small">{r.downtime!=null?r.downtime+" ชม.":"—"}</td></tr>
              )):<tr><td colSpan="5" className="empty">ยังไม่มีประวัติ</td></tr>}</tbody>
            </table></div>
          </div>
          <div className="panel">
            <div className="panel-head"><div className="h-sm">แผน PM ของเครื่องนี้</div></div>
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Checklist</th><th>ความถี่</th><th>ครั้งถัดไป</th><th>สถานะ</th></tr></thead>
              <tbody>{pm.map((p,i)=>(
                <tr key={i} className={p.status==="Overdue"?"row-red":""}><td className="small">{p.checklist}</td><td><span className="chip">{p.freq}</span></td><td className="mono small">{p.next}</td>
                <td><span className={"badge "+(p.status==="Overdue"?"b-red":p.status==="Completed"?"b-green":"b-blue")}><span className="dot"></span>{p.status}</span></td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </div>
        {/* QR side */}
        <div className="panel">
          <div className="panel-head"><div className="h-sm">QR Code</div></div>
          <div className="panel-body col" style={{alignItems:"center",gap:14}}>
            <QRBox size={168} label={m.code}/>
            <div className="small muted" style={{textAlign:"center"}}>ติดที่หน้าเครื่อง · สแกนเพื่อแจ้งซ่อม</div>
            <div className="row gap-sm" style={{width:"100%"}}>
              <button className="btn grow" onClick={()=>nav.toast("ดาวน์โหลด QR (prototype)","check")}><Icon name="download" size={15}/> ดาวน์โหลด</button>
              <button className="btn grow" onClick={()=>nav.toast("สั่งพิมพ์ QR (prototype)","check")}><Icon name="clipboard" size={15}/> พิมพ์</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.CPAGES.qr = window.CPAGES.machines;
