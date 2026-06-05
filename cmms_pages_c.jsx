/* ============================================================
   MT_System — CMMS pages C: Reports, Users, Telegram
   ============================================================ */
const G = window.DATA;
window.CPAGES = window.CPAGES || {};

/* cost-per-machine (synth from downtime + parts) */
const COST = [
  { mc:"MC-001", name:"Compression A1", labor:3400, parts:1500, downtime:2.25 },
  { mc:"MC-004", name:"Injection B2",   labor:5200, parts:900,  downtime:4.10 },
  { mc:"C16",    name:"เครื่องอัด 200T", labor:4100, parts:36000, downtime:3.30 },
  { mc:"MC-003", name:"Injection B1",   labor:1800, parts:0,    downtime:1.20 },
  { mc:"MC-002", name:"Compression A2", labor:760,  parts:180,  downtime:0.50 },
];

/* ---------------- Reports ---------------- */
window.CPAGES.reports = function Reports({ nav }){
  const [range,setRange]=useState("6m");
  const costRows=COST.map(c=>({...c,total:c.labor+c.parts})).sort((a,b)=>b.total-a.total);
  const maxCost=Math.max(...costRows.map(c=>c.total));
  return (
    <>
      <div className="row between wrap" style={{marginBottom:18,gap:12}}>
        <div className="seg-pill">{[["1m","1 เดือน"],["3m","3 เดือน"],["6m","6 เดือน"],["1y","1 ปี"]].map(([v,l])=><button key={v} className={range===v?"on":""} onClick={()=>setRange(v)}>{l}</button>)}</div>
        <button className="btn" onClick={()=>nav.toast("ส่งออกรายงาน PDF (prototype)","check")}><Icon name="download" size={15}/> ส่งออกรายงาน</button>
      </div>

      <div className="grid-auto" style={{marginBottom:18}}>{G.kpi.map(k=><KpiCard key={k.key} k={k}/>)}</div>

      <div className="grid-2" style={{marginBottom:18}}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">Downtime Analysis (รายเดือน)</div><span className="delta delta-up"><Icon name="arrowDown" size={13}/> −62% จากต้นช่วง</span></div>
          <div className="panel-body"><AreaChart data={G.downtimeTrend} color="var(--accent)"/></div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">Breakdown Frequency</div></div>
          <div className="panel-body"><BarChart data={[{m:"ม.ค.",v:9},{m:"ก.พ.",v:7},{m:"มี.ค.",v:6},{m:"เม.ย.",v:5},{m:"พ.ค.",v:4}]} color="var(--blue)" highlightLast/></div>
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:18}}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">Top Failure Causes (Pareto)</div></div>
          <div className="panel-body"><ParetoBars rows={G.pareto} color="var(--red)"/></div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">PM Compliance</div></div>
          <div className="panel-body row" style={{gap:22,alignItems:"center"}}>
            <Donut pct={80} color="var(--amber)" label="80%" sub="ทำได้จริง"/>
            <div className="stack" style={{flex:1}}>
              <div><div className="row between"><span className="small">เสร็จตามแผน</span><span className="mono small" style={{fontWeight:700}}>4</span></div><HBar pct={67} color="var(--green)"/></div>
              <div><div className="row between"><span className="small">ยังไม่ถึงกำหนด</span><span className="mono small" style={{fontWeight:700}}>2</span></div><HBar pct={33} color="var(--blue)"/></div>
              <div><div className="row between"><span className="small">เกินกำหนด</span><span className="mono small" style={{fontWeight:700}}>2</span></div><HBar pct={33} color="var(--red)"/></div>
              <div className="tiny muted-2" style={{marginTop:4}}>เป้าหมาย &gt; 95% — ต้องเร่ง PM ที่ค้าง 2 เครื่อง</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{marginBottom:18}}>
        <div className="panel-head"><div className="h-sm">Cost Per Machine (ค่าซ่อม + อะไหล่)</div><span className="small muted">รวม {G.fmtMoney(costRows.reduce((s,c)=>s+c.total,0))}</span></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>เครื่อง</th><th className="num">ค่าแรง</th><th className="num">ค่าอะไหล่</th><th className="num">Downtime</th><th>สัดส่วนต้นทุน</th><th className="num">รวม</th></tr></thead>
          <tbody>{costRows.map(c=>(
            <tr key={c.mc}><td><span className="mono small" style={{fontWeight:600}}>{c.mc}</span><div className="tiny muted-2">{c.name}</div></td>
              <td className="num mono small">{G.fmtMoney(c.labor)}</td><td className="num mono small">{G.fmtMoney(c.parts)}</td>
              <td className="num mono small">{c.downtime} ชม.</td>
              <td style={{minWidth:160}}><HBar pct={c.total/maxCost*100} color="var(--accent)"/></td>
              <td className="num mono" style={{fontWeight:700}}>{G.fmtMoney(c.total)}</td></tr>
          ))}</tbody>
        </table></div>
      </div>

      <div className="panel">
        <div className="panel-head"><div className="h-sm">Spare Part Consumption (พ.ค. 2026)</div></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>รหัส</th><th>รายการ</th><th>เครื่อง</th><th className="num">จำนวนเบิก</th><th>เหตุผล</th></tr></thead>
          <tbody>{G.stockOut.map((l,i)=>(
            <tr key={i}><td className="cell-code">{l.code}</td><td className="small">{l.name}</td><td><span className="mono tiny">{l.mc}</span></td><td className="num mono" style={{fontWeight:700,color:"var(--red-ink)"}}>−{l.qty}</td><td className="small muted">{l.reason}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
};

/* ---------------- Users / RBAC ---------------- */
const ROLE_PERMS = {
  "Operator":    ["แจ้งซ่อม","ดูสถานะใบที่ตนแจ้ง","สแกน QR"],
  "Technician":  ["รับงาน","บันทึกการซ่อม","เบิกอะไหล่","ปิดงาน"],
  "Supervisor":  ["ตรวจรับงาน","จัดการ PM","ดูรายงาน KPI","ตั้งค่าแจ้งเตือน"],
  "Store Keeper":["รับเข้า/เบิกออก","คุม ROP","จัดการ Master Data"],
  "Manager":     ["Dashboard","ดู KPI & ต้นทุน (อ่านอย่างเดียว)"],
  "Admin":       ["จัดการผู้ใช้","กำหนดสิทธิ์","จัดการเครื่อง/QR","ตั้งค่าระบบ"],
};
window.CPAGES.users = function Users({ nav }){
  const [tab,setTab]=useState("users");
  const [q,setQ]=useState("");
  const rows=G.users.filter(u=>q===""||(u.name+u.user+u.role).toLowerCase().includes(q.toLowerCase()));
  const roleColor=r=>({Operator:"b-blue",Technician:"b-blue",Supervisor:"b-green",["Store Keeper"]:"b-amber",Manager:"b-gray",Admin:"b-red"}[r]||"b-gray");
  return (
    <>
      <div className="tabbar">
        <button className={"tab"+(tab==="users"?" on":"")} onClick={()=>setTab("users")}><Icon name="user" size={16}/> ผู้ใช้งาน ({G.users.length})</button>
        <button className={"tab"+(tab==="roles"?" on":"")} onClick={()=>setTab("roles")}><Icon name="cog" size={16}/> บทบาท & สิทธิ์ (RBAC)</button>
      </div>

      {tab==="users" ? (
        <div className="panel">
          <div className="panel-head wrap" style={{gap:12}}>
            <SearchBar value={q} onChange={setQ} placeholder="ค้นหาชื่อ/username/บทบาท..."/>
            <button className="btn btn-primary" onClick={()=>nav.toast("เพิ่มผู้ใช้ใหม่ (prototype)","check")}><Icon name="plus" size={16}/> เพิ่มผู้ใช้</button>
          </div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>ID</th><th>ชื่อ - นามสกุล</th><th>Username</th><th>บทบาท</th><th>แผนก</th><th>สถานะ</th><th></th></tr></thead>
            <tbody>{rows.map(u=>(
              <tr key={u.id}>
                <td className="cell-code">{u.id}</td>
                <td><div className="row gap-sm"><span className="avatar" style={{width:30,height:30,borderRadius:8,fontSize:12}}>{u.name.slice(0,2)}</span><span style={{fontWeight:600}}>{u.name}</span></div></td>
                <td className="mono small muted">@{u.user}</td>
                <td><span className={"badge "+roleColor(u.role)}><span className="dot"></span>{u.role}</span></td>
                <td className="small muted">{u.dept}</td>
                <td><span className="badge b-green"><span className="dot"></span>{u.status}</span></td>
                <td><div className="row gap-sm"><button className="icon-btn" onClick={()=>nav.toast("แก้ไข "+u.name,"check")}><Icon name="edit" size={15}/></button><button className="icon-btn" onClick={()=>nav.toast("ปิดใช้งาน "+u.name,"error")}><Icon name="trash" size={15}/></button></div></td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      ) : (
        <div className="grid-3">
          {Object.keys(ROLE_PERMS).map(r=>(
            <div key={r} className="panel">
              <div className="panel-head"><div className="row gap-sm"><span className="avatar" style={{width:30,height:30,borderRadius:8,fontSize:11}}>{G.roleUser[r].short}</span><div><div className="h-sm">{r}</div><div className="tiny muted-2">{G.roleLabelTH[r]}</div></div></div>
                <span className="chip">{G.users.filter(u=>u.role===r).length} คน</span></div>
              <div className="panel-body" style={{display:"grid",gap:9}}>
                {ROLE_PERMS[r].map((p,i)=>(
                  <div key={i} className="row gap-sm"><span style={{color:"var(--green)",flex:"none"}}><Icon name="check" size={15}/></span><span className="small">{p}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ---------------- Telegram settings ---------------- */
window.CPAGES.telegram = function Telegram({ nav }){
  const [on,setOn]=useState({ critical:true, newReq:true, accepted:true, closed:true, pm:true, lowStock:true, daily:false });
  const toggle=k=>setOn(s=>({...s,[k]:!s[k]}));
  const events=[
    ["critical","งานวิกฤต (Critical / Rank A)","แจ้งทันทีพร้อม mention หัวหน้า","alert","var(--red)"],
    ["newReq","มีใบแจ้งซ่อมใหม่","แจ้งเข้ากลุ่มทีมช่าง","wrench","var(--blue)"],
    ["accepted","ช่างรับงาน","อัปเดตสถานะเข้ากลุ่ม","clipboard","var(--blue)"],
    ["closed","ปิดงาน / ตรวจรับ","สรุปผลซ่อมและต้นทุน","checkCircle","var(--green)"],
    ["pm","เตือนแผน PM ใกล้/เกินกำหนด","แจ้งล่วงหน้า 3 วัน","cal","var(--amber)"],
    ["lowStock","อะไหล่ต่ำกว่า ROP","แจ้งเจ้าหน้าที่คลัง","box","var(--amber)"],
    ["daily","สรุปประจำวัน (08:00)","KPI + งานค้าง ส่งหัวหน้า","chart","var(--gray)"],
  ];
  return (
    <div className="grid" style={{gridTemplateColumns:"1fr 360px",gap:18,alignItems:"start"}}>
      <div className="stack" style={{display:"flex",flexDirection:"column",gap:18}}>
        {/* connection */}
        <div className="panel">
          <div className="panel-head"><div className="h-sm">การเชื่อมต่อ Telegram Bot</div><span className="badge b-green"><span className="dot"></span>เชื่อมต่อแล้ว</span></div>
          <div className="panel-body grid" style={{gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div className="field" style={{marginBottom:0}}><label>Bot Token</label><input className="input mono" type="password" defaultValue="7654321098:AAH..." readOnly/></div>
            <div className="field" style={{marginBottom:0}}><label>Bot Username</label><input className="input mono" defaultValue="@mt_maintenance_bot" readOnly/></div>
            <div className="field" style={{marginBottom:0}}><label>Group Chat ID (ทีมช่าง MT)</label><input className="input mono" defaultValue="-1002345678901"/></div>
            <div className="field" style={{marginBottom:0}}><label>Group Chat ID (คลังอะไหล่)</label><input className="input mono" defaultValue="-1002345111222"/></div>
            <div className="row gap-sm" style={{gridColumn:"1 / -1"}}>
              <button className="btn" onClick={()=>nav.toast("ส่งข้อความทดสอบไปยังกลุ่มแล้ว","mail")}><Icon name="mail" size={15}/> ส่งข้อความทดสอบ</button>
              <button className="btn btn-primary" onClick={()=>nav.toast("บันทึกการตั้งค่า Telegram แล้ว","check")}><Icon name="check" size={15}/> บันทึก</button>
            </div>
          </div>
        </div>

        {/* events */}
        <div className="panel">
          <div className="panel-head"><div className="h-sm">เหตุการณ์ที่จะแจ้งเตือน</div></div>
          <div style={{padding:"6px 0"}}>
            {events.map(([k,t,d,ic,c])=>(
              <div key={k} className="row between" style={{padding:"13px 18px",borderBottom:"1px solid var(--border)"}}>
                <div className="row gap-sm"><span style={{width:36,height:36,borderRadius:9,background:"var(--surface-2)",color:c,display:"flex",alignItems:"center",justifyContent:"center",flex:"none"}}><Icon name={ic} size={18}/></span>
                  <div><div className="small" style={{fontWeight:600}}>{t}</div><div className="tiny muted-2">{d}</div></div></div>
                <Switch on={on[k]} onClick={()=>toggle(k)}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* preview */}
      <div className="stack" style={{display:"flex",flexDirection:"column",gap:18}}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">ตัวอย่างการแจ้งเตือน</div></div>
          <div className="panel-body">
            <div className="tg-wrap">
              <div className="tg-bubble">
                <div className="tg-bot"><Icon name="mail" size={14}/> MT Maintenance Bot</div>
                <div className="small" style={{lineHeight:1.55}}>
                  🔴 <b>งานวิกฤตใหม่</b><br/>
                  <b>REQ-2026-002</b> · MC-004<br/>
                  อาการ: Hydraulic oil leak from main cylinder<br/>
                  ความรุนแรง: <b>Critical</b> · แจ้งโดย Wichai S.<br/>
                  <span className="muted-2 tiny">@somsak @nattawut โปรดรับงาน</span>
                </div>
                <button className="tg-btn" onClick={()=>nav.toast("จำลอง: ช่างกดรับงานจาก Telegram","check")}>✅ กดรับงานนี้</button>
                <button className="tg-btn" onClick={()=>nav.toast("เปิดใบแจ้งใน MT System","mail")}>🔗 เปิดในระบบ</button>
              </div>
            </div>
          </div>
        </div>
        <div className="card card-pad" style={{background:"var(--blue-bg)",border:"1px solid var(--border)",display:"flex",gap:11}}>
          <span style={{color:"var(--blue)",flex:"none"}}><Icon name="bell" size={18}/></span>
          <div className="small" style={{color:"var(--blue-ink)"}}>ช่างสามารถ <b>กดรับงานจาก Telegram ได้โดยตรง</b> สถานะจะ sync กลับเข้าฐานข้อมูลแบบเรียลไทม์ ทันทีที่กดรับ</div>
        </div>
      </div>
    </div>
  );
};
