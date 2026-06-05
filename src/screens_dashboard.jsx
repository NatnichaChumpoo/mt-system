/* ============================================================
   MT_System — Manager Dashboard + Admin
   ============================================================ */
const Dd = window.DATA;

/* ---------------- 5.13 Manager dashboard ---------------- */
function Dashboard({ ctx }) {
  const maxPareto = Dd.pareto[0].count;
  const maxDown = Math.max(...Dd.downtimeTrend.map(d=>d.v));
  const criticalParts = Dd.parts.filter(p=>p.status==="critical");
  const overduePm = Dd.pm.filter(p=>p.status==="Overdue");
  const inProgress = Dd.requests.filter(r=>r.priority==="Critical" && r.status!=="Completed");
  let cum = 0; const total = Dd.pareto.reduce((s,p)=>s+p.count,0);
  return (
    <div>
      <PageHead title="Dashboard ผู้บริหาร" sub="ภาพรวมความน่าเชื่อถือเครื่องจักรและคลังอะไหล่ · ข้อมูลเดือน พ.ค. 2026" actions={
        <><span className="chip"><Icon name="cal" size={13}/> พ.ค. 2026</span><button className="btn"><Icon name="download" size={15}/> Export PDF</button></>
      } />

      {/* KPI row */}
      <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(208px,1fr))", marginBottom:18 }}>
        {Dd.kpi.map(k => <KpiCard key={k.key} k={k} />)}
      </div>

      <div className="grid" style={{ gridTemplateColumns:"1.3fr 1fr", alignItems:"start", marginBottom:18 }}>
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

      {/* Downtime trend + MC group summary */}
      <div className="grid" style={{ gridTemplateColumns:"1fr 1.5fr", alignItems:"start", marginBottom:18 }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">แนวโน้ม Downtime รายเดือน</div><span className="delta delta-up"><Icon name="arrowDown" size={13}/> ลดลงต่อเนื่อง</span></div>
          <div className="panel-body">
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:150, padding:"0 4px" }}>
              {Dd.downtimeTrend.map((d,i)=>(
                <div key={i} className="col" style={{flex:1, alignItems:"center", gap:7, justifyContent:"flex-end", height:"100%"}}>
                  <span className="mono tiny" style={{fontWeight:700, color:"var(--ink-2)"}}>{d.v}</span>
                  <div style={{ width:"100%", maxWidth:34, height:(d.v/maxDown*110)+"px", borderRadius:"6px 6px 0 0",
                    background: i===Dd.downtimeTrend.length-1?"var(--green)":"linear-gradient(180deg,#b89668,#9a7b4f)" }}></div>
                  <span className="tiny muted-2">{d.m}</span>
                </div>
              ))}
            </div>
            <div className="tiny muted-2" style={{marginTop:10, textAlign:"center"}}>หน่วย: ชั่วโมง/เดือน</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div className="h-sm">สรุปคลังแยกตาม MC Group</div><span className="chip"><Icon name="box" size={13}/> รวม {Dd.fmtMoney(Dd.mcGroups.reduce((s,g)=>s+g.value,0))}</span></div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>MC Group</th><th className="num">เครื่อง</th><th className="num">อะไหล่</th><th className="num">มูลค่าคลัง</th><th className="num">Critical</th><th className="num">ต่ำกว่า ROP</th><th>Risk Zone</th></tr></thead>
              <tbody>
                {Dd.mcGroups.map(g=>(
                  <tr key={g.group}>
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
      </div>

      {/* Inventory KPIs + Alerts */}
      <div className="grid" style={{ gridTemplateColumns:"1.4fr 1fr", alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">ตัวชี้วัดคลังอะไหล่</div></div>
          <div className="panel-body grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
            {Dd.invKpi.map(k=>{
              const ok = k.state==="good";
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

        <div className="panel" style={{borderColor:"#f0c4c4"}}>
          <div className="panel-head" style={{background:"var(--red-bg)"}}><div className="h-sm" style={{color:"var(--red-ink)"}}><Icon name="alert" size={15} style={{verticalAlign:"-2px",marginRight:6}}/>รายการวิกฤตที่ต้องดำเนินการ</div></div>
          <div className="panel-body stack">
            <AlertRow icon="wrench" color="var(--red)" title={`เครื่องวิกฤตหยุด — ${inProgress.length} รายการ`} desc={inProgress.map(r=>r.mc).join(", ")||"—"} onClick={()=>ctx.go("d_requests")}/>
            <AlertRow icon="box" color="var(--red)" title={`อะไหล่ของหมด (วิกฤต) — ${criticalParts.length} รายการ`} desc={criticalParts.slice(0,4).map(p=>p.code).join(", ")+"…"} onClick={()=>ctx.go("d_reorder")}/>
            <AlertRow icon="cal" color="var(--amber)" title={`PM เกินกำหนด — ${overduePm.length} เครื่อง`} desc={overduePm.map(p=>p.mc).join(", ")} onClick={()=>ctx.go("d_pm")}/>
            <AlertRow icon="gauge" color="var(--amber)" title="PM Compliance ต่ำกว่าเป้า" desc="80% (เป้า > 95%)" onClick={()=>ctx.go("d_pm")}/>
          </div>
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

/* ---------------- 5.14 Admin ---------------- */
function Admin({ ctx }) {
  const [tab, setTab] = useState("machines");
  const [qr, setQr] = useState(null);
  const tabs = [["machines","เครื่องจักร","machine"],["parts","อะไหล่","box"],["users","ผู้ใช้/สิทธิ์","user"]];
  return (
    <div>
      <PageHead title="ผู้ดูแลระบบ (Admin)" sub="จัดการ Master Data — เครื่องจักร · อะไหล่ · ผู้ใช้งาน" />
      <div className="row gap-sm" style={{marginBottom:16}}>
        {tabs.map(([v,l,ic])=>(
          <button key={v} className={"chip chip-btn"+(tab===v?" on":"")} onClick={()=>setTab(v)} style={{padding:"8px 14px"}}>
            <Icon name={ic} size={14}/> {l}
          </button>
        ))}
      </div>

      {tab==="machines" && (
        <div className="panel">
          <div className="panel-head"><div className="h-sm">เครื่องจักร ({Dd.machines.length})</div><button className="btn btn-sm btn-primary"><Icon name="plus" size={14}/> เพิ่มเครื่อง</button></div>
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
                    <td><div className="row gap-sm"><button className="icon-btn" style={{width:30,height:30}}><Icon name="edit" size={14}/></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="parts" && (
        <div className="panel">
          <div className="panel-head"><div className="h-sm">อะไหล่ ({Dd.parts.length})</div><button className="btn btn-sm btn-primary"><Icon name="plus" size={14}/> เพิ่มอะไหล่</button></div>
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
                    <td><button className="icon-btn" style={{width:30,height:30}}><Icon name="edit" size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="users" && (
        <div className="panel">
          <div className="panel-head"><div className="h-sm">ผู้ใช้งาน ({Dd.users.length})</div><button className="btn btn-sm btn-primary"><Icon name="plus" size={14}/> เพิ่มผู้ใช้</button></div>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>ID</th><th>ชื่อ</th><th>Username</th><th>บทบาท (Role)</th><th>แผนก</th><th>สถานะ</th><th></th></tr></thead>
              <tbody>
                {Dd.users.map(u=>(
                  <tr key={u.id}>
                    <td className="cell-code">{u.id}</td>
                    <td className="small" style={{fontWeight:600}}>{u.name}</td>
                    <td className="mono small muted">{u.user}</td>
                    <td><span className="chip">{u.role}</span> <span className="tiny muted-2">{Dd.roleLabelTH[u.role]}</span></td>
                    <td className="small muted">{u.dept}</td>
                    <td><span className="badge b-green"><span className="dot"></span>{u.status}</span></td>
                    <td><button className="icon-btn" style={{width:30,height:30}}><Icon name="edit" size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {qr && (
        <Modal title={"QR Code — "+qr.code} onClose={()=>setQr(null)}>
          <div className="col" style={{alignItems:"center", gap:16, padding:"8px 0"}}>
            <QRBox size={168} />
            <div style={{textAlign:"center"}}>
              <div className="mono" style={{fontWeight:700, fontSize:18}}>{qr.code}</div>
              <div className="small muted">{qr.name}</div>
            </div>
            <div className="card card-pad small muted" style={{width:"100%", background:"var(--surface-2)"}}>
              ติด QR นี้ที่หน้าเครื่อง — เมื่อสแกนจะเปิดหน้าข้อมูลเครื่องและฟอร์มแจ้งซ่อมทันที
            </div>
            <div className="row gap-sm" style={{width:"100%"}}>
              <button className="btn btn-block" onClick={()=>ctx.toast("ดาวน์โหลด QR (prototype)")}><Icon name="download" size={15}/> ดาวน์โหลด</button>
              <button className="btn btn-primary btn-block" onClick={()=>setQr(null)}>เสร็จสิ้น</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, { Dashboard, Admin, AlertRow });
