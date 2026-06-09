/* ============================================================
   MT_System — CMMS pages B: Requests, Work Orders, PM, Inventory
   ============================================================ */
const B = window.DATA;
window.CPAGES = window.CPAGES || {};

function cmTimeline(r, rep){
  const out=[{ title:"แจ้งซ่อม", desc:r.reporter, time:r.date, state:"done" }];
  const accepted=r.status!=="Waiting";
  out.push({ title:"ช่างรับงาน", desc:rep?rep.tech:"—", time:accepted?r.start:"", state:accepted?"done":"" });
  const repairing=r.status==="In Progress", repaired=r.status==="Completed"||r.status==="Resubmitted";
  out.push({ title:"ดำเนินการซ่อม & ปิดงาน", desc:rep?rep.action:"", time:r.finish||"", state:repaired?"done":(repairing?"active":"") });
  return out;
}

/* ---------------- Requests ---------------- */
window.CPAGES.requests = function Requests({ nav }){
  const [q,setQ]=useState("");
  const [st,setSt]=useState("all");
  const [pri,setPri]=useState("all");
  const [sel,setSel]=useState(null);
  const [creating,setCreating]=useState(false);
  const canCreate=["Operator","Maintenance","Admin"].includes(nav.role);

  if(sel) return <RequestDetail no={sel} onBack={()=>setSel(null)} nav={nav}/>;
  if(creating) return <RequestCreate onBack={()=>setCreating(false)} nav={nav}/>;

  const rows=B.requests.filter(r=>
    (st==="all"||r.status===st)&&(pri==="all"||r.priority===pri)&&
    (q===""||(r.no+r.mc+r.problem).toLowerCase().includes(q.toLowerCase())));
  const { sorted, sort, onSort }=useSort(rows,{key:"date",dir:-1});
  const statuses=[["all","ทั้งหมด"],["Waiting","รอ"],["In Progress","กำลังซ่อม"],["Completed","เสร็จ"]];

  return (
    <>
      <div className="grid-auto" style={{marginBottom:18}}>
        <StatCard icon="list" tone="navy" value={B.requests.length} label="ใบแจ้งทั้งหมด"/>
        <StatCard icon="clock" tone="blue" value={B.requests.filter(r=>r.status==="In Progress").length} label="กำลังดำเนินการ"/>
        <StatCard icon="alert" tone="red" value={B.requests.filter(r=>r.priority==="Critical").length} label="วิกฤต (Critical)"/>
        <StatCard icon="checkCircle" tone="green" value={B.requests.filter(r=>r.status==="Completed"||r.status==="Resubmitted").length} label="ปิดงานแล้ว"/>
      </div>

      <div className="panel">
        <div className="panel-head wrap" style={{gap:12}}>
          <div className="row gap-sm wrap">
            <SearchBar value={q} onChange={setQ} placeholder="ค้นหาเลขที่/เครื่อง/อาการ..."/>
            <div className="seg-pill">{statuses.map(([v,l])=><button key={v} className={st===v?"on":""} onClick={()=>setSt(v)}>{l}</button>)}</div>
            <select className="select" style={{width:"auto"}} value={pri} onChange={e=>setPri(e.target.value)}>
              <option value="all">ทุกความรุนแรง</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </div>
          {canCreate && <button className="btn btn-primary" onClick={()=>setCreating(true)}><Icon name="plus" size={16}/> สร้างใบแจ้งซ่อม</button>}
        </div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr>
            <Th k="no" sort={sort} onSort={onSort}>เลขที่</Th>
            <Th k="mc" sort={sort} onSort={onSort}>เครื่อง</Th>
            <th>อาการ</th>
            <Th k="priority" sort={sort} onSort={onSort}>ความรุนแรง</Th>
            <th>สถานะ</th>
            <Th k="date" sort={sort} onSort={onSort}>วันที่แจ้ง</Th>
            <th className="num">Downtime</th><th></th>
          </tr></thead>
          <tbody>{sorted.map(r=>(
            <tr key={r.no} style={{cursor:"pointer"}} onClick={()=>setSel(r.no)}>
              <td className="cell-code">{r.no}</td>
              <td><span className="mono small" style={{fontWeight:600}}>{r.mc}</span></td>
              <td className="small" style={{maxWidth:280}}>{r.problem}</td>
              <td><PriorityTag p={r.priority}/></td>
              <td><JobBadge status={r.status}/></td>
              <td className="mono small muted">{r.date}</td>
              <td className="num mono small">{r.downtime!=null?r.downtime+" ชม.":"—"}</td>
              <td><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
};

function RequestDetail({ no, onBack, nav }){
  const r=B.request?B.request(no):B.requests.find(x=>x.no===no);
  const rep=B.repairs[no]; const use=B.usage[no]||[];
  const total=use.reduce((s,u)=>s+u.unit*u.qty,0);
  const m=B.machineByCode(r.mc);
  return (
    <>
      <button className="btn btn-ghost" style={{marginBottom:14}} onClick={onBack}><Icon name="chevL" size={16}/> กลับไปรายการ</button>
      <div className="grid" style={{gridTemplateColumns:"1fr 340px",gap:18,alignItems:"start"}}>
        <div className="stack" style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="panel">
            <div className="panel-head"><div className="row gap-sm"><span className="mono" style={{fontWeight:700,fontSize:17}}>{r.no}</span><PriorityTag p={r.priority}/></div><JobBadge status={r.status}/></div>
            <div className="panel-body grid" style={{gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
              <div><div className="tiny muted-2">เครื่องจักร</div><div className="small" style={{fontWeight:600}}>{r.mc} · {r.mcName}</div></div>
              <div><div className="tiny muted-2">ประเภทงาน</div><div className="small" style={{fontWeight:600}}>{r.type}</div></div>
              <div><div className="tiny muted-2">แผนก</div><div className="small" style={{fontWeight:600}}>{r.dept}</div></div>
              <div style={{gridColumn:"1 / -1"}}><div className="tiny muted-2">อาการเสีย</div><div className="small" style={{fontWeight:600}}>{r.problem}</div></div>
              <div><div className="tiny muted-2">ผู้แจ้ง</div><div className="small" style={{fontWeight:600}}>{r.reporter}</div></div>
              <div><div className="tiny muted-2">เวลาเริ่ม</div><div className="small mono">{r.start||"—"}</div></div>
              <div><div className="tiny muted-2">Downtime</div><div className="small mono" style={{fontWeight:600}}>{r.downtime!=null?r.downtime+" ชม.":"—"}</div></div>
            </div>
          </div>

          {rep && (
            <div className="panel">
              <div className="panel-head"><div className="h-sm">ผลการซ่อม (Repair Action)</div><span className="chip">{rep.cat}</span></div>
              <div className="panel-body grid" style={{gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div><div className="tiny muted-2">ช่างผู้ซ่อม</div><div className="small" style={{fontWeight:600}}>{rep.tech}</div></div>
                <div><div className="tiny muted-2">ประเภทสาเหตุ</div><div className="small" style={{fontWeight:600}}>{rep.causeType}</div></div>
                <div style={{gridColumn:"1 / -1"}}><div className="tiny muted-2">สาเหตุราก (Root Cause)</div><div className="small" style={{fontWeight:600}}>{rep.root}</div></div>
                <div style={{gridColumn:"1 / -1"}}><div className="tiny muted-2">วิธีแก้ไข</div><div className="small" style={{fontWeight:600}}>{rep.action}</div></div>
                <div><div className="tiny muted-2">เวลาซ่อมรวม</div><div className="small mono" style={{fontWeight:600}}>{rep.hrs} ชม.</div></div>
              </div>
            </div>
          )}

          {use.length>0 && (
            <div className="panel">
              <div className="panel-head"><div className="h-sm">อะไหล่ที่ใช้</div><span className="mono" style={{fontWeight:700}}>{B.fmtMoney(total)}</span></div>
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th>รหัส</th><th>รายการ</th><th className="num">จำนวน</th><th className="num">ราคา/หน่วย</th><th className="num">รวม</th></tr></thead>
                <tbody>{use.map((u,i)=>(
                  <tr key={i}><td className="cell-code">{u.code}</td><td className="small">{u.name}</td><td className="num mono">{u.qty}</td><td className="num mono small">{B.fmtMoney(u.unit)}</td><td className="num mono" style={{fontWeight:600}}>{B.fmtMoney(u.unit*u.qty)}</td></tr>
                ))}</tbody>
              </table></div>
            </div>
          )}
        </div>

        <div className="stack" style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="panel">
            <div className="panel-head"><div className="h-sm">สถานะการดำเนินงาน</div></div>
            <div className="panel-body"><Timeline steps={cmTimeline(r,rep)}/></div>
          </div>
        </div>
      </div>
    </>
  );
}

function RequestCreate({ onBack, nav }){
  const [mc,setMc]=useState("MC-001");
  const [sev,setSev]=useState("High");
  const [desc,setDesc]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const sevs=["Low","Medium","High","Critical"];
  const m=B.machineByCode(mc);

  const submit = async () => {
    if(submitting) return;
    if(!desc.trim()){nav.toast("กรุณากรอกอาการเสีย","error");return;}
    if(typeof window.DATA?.createRequest==="function"){
      setSubmitting(true);
      try{
        const reqNo = await window.DATA.createRequest({machineCode:mc, problem:desc.trim(), priority:sev, reporterName:B.roleUser[nav.role]?.name||null});
        if(typeof B.refresh==="function"){await B.refresh();window.dispatchEvent(new Event("mt-data-refresh"));}
        nav.toast("ส่งใบแจ้งซ่อมแล้ว · "+reqNo+" · Telegram แจ้งทีมช่างแล้ว","mail");
        onBack();
      }catch(err){
        console.error("[RequestCreate] submit error",err);
        nav.toast("ส่งไม่สำเร็จ: "+err.message,"error");
      }finally{setSubmitting(false);}
    } else {
      nav.toast("ส่งใบแจ้งซ่อมแล้ว · ระบบแจ้ง Telegram ทีมช่าง","mail");
      onBack();
    }
  };

  return (
    <>
      <button className="btn btn-ghost" style={{marginBottom:14}} onClick={onBack}><Icon name="chevL" size={16}/> ยกเลิก</button>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px",gap:18,alignItems:"start"}}>
        <div className="panel"><div className="panel-head"><div className="h-sm">สร้างใบแจ้งซ่อม</div></div>
          <div className="panel-body">
            <div className="field"><label>เครื่องจักร <span className="req">*</span></label>
              <select className="select" value={mc} onChange={e=>setMc(e.target.value)}>{B.machines.map(x=><option key={x.code} value={x.code}>{x.code} · {x.name}</option>)}</select></div>
            <div className="field"><label>ประเภทงาน</label>
              <div className="seg" style={{gridTemplateColumns:"1fr 1fr"}}><div className="seg-opt on-medium">งานซ่อม</div><div className="seg-opt">งานสร้าง/ปรับปรุง</div></div></div>
            <div className="field"><label>อาการเสีย <span className="req">*</span></label>
              <textarea className="textarea" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="อธิบายอาการที่พบ..."></textarea></div>
            <div className="field"><label>ความรุนแรง</label>
              <div className="seg">{sevs.map(s=><div key={s} className={"seg-opt"+(sev===s?" on-"+s.toLowerCase():"")} onClick={()=>setSev(s)}>{s}</div>)}</div></div>
            <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="field"><label>ผู้แจ้ง</label><input className="input" defaultValue={B.roleUser[nav.role].name}/></div>
              <div className="field"><label>แผนก</label><input className="input" defaultValue={m.dept}/></div>
            </div>
            <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
              <Icon name="check" size={18}/> {submitting?"กำลังส่ง...":"ส่งใบแจ้งซ่อม"}
            </button>
          </div>
        </div>
        <div className="stack" style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="panel"><div className="panel-head"><div className="h-sm">เครื่องที่เลือก</div><RankPill rank={m.rank}/></div>
            <div className="panel-body grid" style={{gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div><div className="tiny muted-2">รหัส</div><div className="small mono" style={{fontWeight:700}}>{m.code}</div></div>
              <div><div className="tiny muted-2">สถานะ</div><div className="small" style={{fontWeight:600}}>{m.status}</div></div>
              <div><div className="tiny muted-2">กลุ่ม</div><div className="small" style={{fontWeight:600}}>{m.group}</div></div>
              <div><div className="tiny muted-2">Criticality</div><div className="small" style={{fontWeight:600}}>{m.crit}</div></div>
            </div>
          </div>
          <div className="card card-pad" style={{background:"var(--blue-bg)",border:"1px solid var(--border)",display:"flex",gap:11}}>
            <span style={{color:"var(--blue)"}}><Icon name="mail" size={18}/></span>
            <div className="small" style={{color:"var(--blue-ink)"}}>เมื่อส่ง ระบบจะแจ้งทีมช่างและหัวหน้างานผ่าน <b>Telegram</b> ทันที ตามระดับความเสี่ยงของเครื่อง</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Work Orders ---------------- */
const WO_PRI={ Critical:0, High:1, Medium:2, Low:3 };
window.CPAGES.workorders = function WorkOrders({ nav }){
  const [tab,setTab]=useState("queue");
  const open=B.requests.filter(r=>r.status!=="Completed"&&r.status!=="Resubmitted").sort((a,b)=>WO_PRI[a.priority]-WO_PRI[b.priority]);
  const done=B.requests.filter(r=>r.status==="Completed"||r.status==="Resubmitted");
  const [sel,setSel]=useState(null);
  if(sel) return <RequestDetail no={sel} onBack={()=>setSel(null)} nav={nav}/>;
  const list=tab==="queue"?open:done;
  return (
    <>
      <div className="tabbar">
        <button className={"tab"+(tab==="queue"?" on":"")} onClick={()=>setTab("queue")}><Icon name="clipboard" size={16}/> คิวงาน ({open.length})</button>
        <button className={"tab"+(tab==="done"?" on":"")} onClick={()=>setTab("done")}><Icon name="checkCircle" size={16}/> ปิดงานแล้ว ({done.length})</button>
      </div>
      <div className="grid-3">
        {list.map(r=>{ const m=B.machineByCode(r.mc); const hot=r.priority==="Critical"||(m&&m.rank==="A"&&r.status!=="Completed"&&r.status!=="Resubmitted");
          return (
            <div key={r.no} className="card" style={{overflow:"hidden",borderColor:hot?"var(--red)":"var(--border)",borderWidth:hot?1.5:1}}>
              {hot && <div style={{background:"var(--red)",color:"#fff",padding:"5px 14px",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6}}><Icon name="alert" size={12}/> งานสำคัญ — ทำก่อน</div>}
              <div className="card-pad">
                <div className="row between"><span className="mono small" style={{fontWeight:700}}>{r.no}</span><PriorityTag p={r.priority}/></div>
                <div className="row gap-sm" style={{margin:"9px 0"}}><span className="mono" style={{fontWeight:600}}>{r.mc}</span>{m&&<RankPill rank={m.rank}/>}</div>
                <div className="small muted" style={{minHeight:38,marginBottom:11}}>{r.problem}</div>
                <div className="row between">
                  <JobBadge status={r.status}/>
                  <button className="btn btn-sm btn-primary" onClick={()=>setSel(r.no)}>{r.status==="Waiting"?"รับงาน":(r.status==="Completed"||r.status==="Resubmitted")?"ดูงาน":"บันทึกผล"} <Icon name="chevR" size={14}/></button>
                </div>
              </div>
            </div>
          );
        })}
        {!list.length && <div className="empty card" style={{gridColumn:"1 / -1"}}>ไม่มีงานในสถานะนี้</div>}
      </div>
    </>
  );
};

/* ---------------- PM Detail Modal ---------------- */
function PMDetail({ pm, onClose }){
  const m = B.machineByCode(pm.mc);
  const PM_BADGE={ "Completed":"b-green","Overdue":"b-red","Due Later":"b-blue" };
  const statusLabel={ "Completed":"เสร็จตามแผน","Overdue":"เกินกำหนด","Due Later":"ยังไม่ถึงกำหนด" };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--surface)",borderRadius:16,width:"100%",maxWidth:520,boxShadow:"0 8px 40px rgba(0,0,0,.18)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div className="panel-head" style={{padding:"16px 20px"}}>
          <div>
            <div className="h-sm">รายละเอียดแผน PM</div>
            <div className="tiny muted-2" style={{marginTop:3}}>{pm.mc} · {pm.name}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <div style={{padding:"18px 20px",display:"grid",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="panel" style={{margin:0}}>
              <div style={{padding:"12px 14px"}}>
                <div className="tiny muted-2">เครื่องจักร</div>
                <div className="small mono" style={{fontWeight:700,marginTop:3}}>{pm.mc}</div>
                <div className="tiny muted-2" style={{marginTop:2}}>{pm.name}</div>
              </div>
            </div>
            <div className="panel" style={{margin:0}}>
              <div style={{padding:"12px 14px"}}>
                <div className="tiny muted-2">สถานะ</div>
                <div style={{marginTop:5}}><span className={"badge "+PM_BADGE[pm.status]}><span className="dot"></span>{statusLabel[pm.status]||pm.status}</span></div>
              </div>
            </div>
          </div>

          <div className="panel" style={{margin:0}}>
            <div style={{padding:"12px 14px"}}>
              <div className="tiny muted-2" style={{marginBottom:6}}>Checklist / รายการตรวจสอบ</div>
              <div className="small" style={{fontWeight:600,lineHeight:1.6}}>{pm.checklist}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div className="panel" style={{margin:0}}>
              <div style={{padding:"12px 14px"}}>
                <div className="tiny muted-2">ความถี่</div>
                <div style={{marginTop:5}}><span className="chip">{pm.freq}</span></div>
              </div>
            </div>
            <div className="panel" style={{margin:0}}>
              <div style={{padding:"12px 14px"}}>
                <div className="tiny muted-2">PM ล่าสุด</div>
                <div className="small mono" style={{fontWeight:600,marginTop:4}}>{pm.last||"—"}</div>
              </div>
            </div>
            <div className="panel" style={{margin:0,borderColor:pm.status==="Overdue"?"var(--red)":"var(--border)"}}>
              <div style={{padding:"12px 14px"}}>
                <div className="tiny muted-2">ครั้งถัดไป</div>
                <div className="small mono" style={{fontWeight:700,marginTop:4,color:pm.status==="Overdue"?"var(--red-ink)":"inherit"}}>{pm.next||"—"}</div>
              </div>
            </div>
          </div>

          {m && (
            <div className="panel" style={{margin:0}}>
              <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <div><div className="tiny muted-2">กลุ่มเครื่อง</div><div className="small" style={{fontWeight:600,marginTop:3}}>{m.group}</div></div>
                <div><div className="tiny muted-2">Criticality</div><div className="small" style={{fontWeight:600,marginTop:3}}>{m.crit}</div></div>
                <div><div className="tiny muted-2">Rank</div><div style={{marginTop:3}}><RankPill rank={m.rank}/></div></div>
              </div>
            </div>
          )}
        </div>
        <div style={{padding:"12px 20px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end"}}>
          <button className="btn btn-ghost" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PM Schedule ---------------- */
window.CPAGES.pm = function PM({ nav }){
  const [view,setView]=useState("list");
  const [sel,setSel]=useState(null);
  const PM_BADGE={ "Completed":"b-green","Overdue":"b-red","Due Later":"b-blue" };
  const overdue=B.pm.filter(p=>p.status==="Overdue").length;
  return (
    <>
      {sel && <PMDetail pm={sel} onClose={()=>setSel(null)}/>}
      <div className="grid-auto" style={{marginBottom:18}}>
        <StatCard icon="cal" tone="navy" value={B.pm.length} label="แผน PM ทั้งหมด"/>
        <StatCard icon="checkCircle" tone="green" value={B.pm.filter(p=>p.status==="Completed").length} label="เสร็จตามแผน"/>
        <StatCard icon="alert" tone="red" value={overdue} label="เกินกำหนด (Overdue)"/>
        <StatCard icon="gauge" tone="amber" value="80%" label="PM Compliance"/>
      </div>
      <div className="row between wrap" style={{marginBottom:16,gap:12}}>
        <div className="seg-pill">
          <button className={view==="list"?"on":""} onClick={()=>setView("list")}>ตาราง</button>
          <button className={view==="cal"?"on":""} onClick={()=>setView("cal")}>ปฏิทิน</button>
        </div>
        {["Maintenance","Admin"].includes(nav.role) && <button className="btn btn-primary" onClick={()=>nav.toast("เพิ่มแผน PM (prototype)","check")}><Icon name="plus" size={16}/> เพิ่มแผน PM</button>}
      </div>

      {view==="list" ? (
        <div className="panel">
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>เครื่อง</th><th>Checklist</th><th>ความถี่</th><th>PM ล่าสุด</th><th>ครั้งถัดไป</th><th>สถานะ</th><th></th></tr></thead>
            <tbody>{B.pm.map((p,i)=>(
              <tr key={i} className={p.status==="Overdue"?"row-red":""} style={{cursor:"pointer"}} onClick={()=>setSel(p)}>
                <td><span className="mono small" style={{fontWeight:600}}>{p.mc}</span><div className="tiny muted-2">{p.name}</div></td>
                <td className="small">{p.checklist}</td>
                <td><span className="chip">{p.freq}</span></td>
                <td className="mono small muted">{p.last}</td>
                <td className="mono small" style={{fontWeight:600}}>{p.next}</td>
                <td><span className={"badge "+PM_BADGE[p.status]}><span className="dot"></span>{p.status}</span></td>
                <td><Icon name="chevR" size={16} style={{color:"var(--ink-3)"}}/></td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      ) : <PMCalendar onSelect={setSel}/>}
    </>
  );
};

function PMCalendar({ onSelect }){
  // June 2026 — 1 June = Monday(index1). build 5 weeks grid
  const dow=["จ","อ","พ","พฤ","ศ","ส","อา"];
  const evMap={}; B.pm.forEach(p=>{ const d=p.next; if(d&&d.startsWith("2026-06")){ const day=+d.split("-")[2]; (evMap[day]=evMap[day]||[]).push(p); } });
  // also place overdue ones at their next date even if May -> show on day 1 banner
  const firstDow=1; // Monday
  const days=30;
  const cells=[];
  for(let i=0;i<firstDow;i++) cells.push(null);
  for(let d=1;d<=days;d++) cells.push(d);
  while(cells.length%7) cells.push(null);
  const today=5;
  return (
    <div className="panel">
      <div className="panel-head"><div className="h-sm">มิถุนายน 2026</div><div className="row gap-sm"><span className="badge b-green"><span className="dot"></span>ตามแผน</span><span className="badge b-red"><span className="dot"></span>เกินกำหนด</span></div></div>
      <div className="panel-body">
        <div className="cal-grid" style={{marginBottom:7}}>{dow.map(d=><div key={d} className="cal-dow">{d}</div>)}</div>
        <div className="cal-grid">
          {cells.map((d,i)=>(
            <div key={i} className={"cal-cell"+(!d?" dim":"")+(d===today?" today":"")}>
              {d && <><div className="cal-date">{d}</div>
                {(evMap[d]||[]).map((p,j)=>(
                  <div key={j} className="cal-ev" style={{background:p.status==="Overdue"?"var(--red-bg)":"var(--green-bg)",color:p.status==="Overdue"?"var(--red-ink)":"var(--green-ink)",cursor:"pointer"}} title={p.name+" · "+p.checklist} onClick={()=>onSelect&&onSelect(p)}>{p.mc} PM</div>
                ))}</>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Inventory (tabs) ---------------- */
window.CPAGES.inventory = function Inventory({ nav }){
  const [tab,setTab]=useState("master");
  const tabs=[["master","Master Data","box"],["reorder","ต้องสั่งซื้อ","truck"],["in","รับเข้า","download"],["out","เบิกออก","logout"]];
  return (
    <>
      <div className="grid-auto" style={{marginBottom:18}}>
        <StatCard icon="box" tone="navy" value={B.parts.length} label="รายการอะไหล่"/>
        <StatCard icon="truck" tone="amber" value={B.parts.filter(p=>p.cur<=p.rop).length} label="ต่ำกว่า ROP"/>
        <StatCard icon="alert" tone="red" value={B.parts.filter(p=>p.cur<=0).length} label="ของหมด (วิกฤต)"/>
        <StatCard icon="chart" tone="green" value={B.fmtMoney(B.parts.reduce((s,p)=>s+p.value,0))} label="มูลค่าคงคลังรวม"/>
      </div>
      <div className="tabbar">{tabs.map(([v,l,ic])=><button key={v} className={"tab"+(tab===v?" on":"")} onClick={()=>setTab(v)}><Icon name={ic} size={16}/> {l}</button>)}</div>
      {tab==="master" && <InvMaster nav={nav}/>}
      {tab==="reorder" && <InvReorder nav={nav}/>}
      {tab==="in" && <InvLog rows={B.stockIn} type="in" nav={nav}/>}
      {tab==="out" && <InvLog rows={B.stockOut} type="out" nav={nav}/>}
    </>
  );
};

function InvMaster({ nav }){
  const [q,setQ]=useState(""); const [f,setF]=useState("all");
  const rows=B.parts.filter(p=>(f==="all"||p.status===f)&&(q===""||(p.code+p.name).toLowerCase().includes(q.toLowerCase())));
  const { sorted, sort, onSort }=useSort(rows,{key:"code",dir:1});
  return (
    <div className="panel">
      <div className="panel-head wrap" style={{gap:12}}>
        <div className="row gap-sm wrap">
          <SearchBar value={q} onChange={setQ} placeholder="ค้นหารหัส/ชื่ออะไหล่..."/>
          <div className="seg-pill">{[["all","ทั้งหมด"],["normal","ปกติ"],["reorder","ควรสั่ง"],["critical","ของหมด"]].map(([v,l])=><button key={v} className={f===v?"on":""} onClick={()=>setF(v)}>{l}</button>)}</div>
        </div>
        <button className="btn" onClick={()=>nav.toast("ส่งออก Master Data (prototype)","check")}><Icon name="download" size={15}/> ส่งออก</button>
      </div>
      <div className="table-wrap"><table className="tbl">
        <thead><tr>
          <Th k="code" sort={sort} onSort={onSort}>รหัส</Th><Th k="name" sort={sort} onSort={onSort}>ชื่ออะไหล่</Th>
          <Th k="group" sort={sort} onSort={onSort}>กลุ่ม</Th><Th k="partRank" sort={sort} onSort={onSort}>Rank</Th>
          <th className="num">Max</th><th className="num">Min</th><th className="num">Safety</th><th className="num">ROP</th>
          <Th k="cur" sort={sort} onSort={onSort} align="right">คงคลัง</Th><th>สถานะ</th>
          <Th k="value" sort={sort} onSort={onSort} align="right">มูลค่า</Th><th className="num">Lead</th>
        </tr></thead>
        <tbody>{sorted.map(p=>(
          <tr key={p.code} className={p.status==="critical"?"row-red":p.status==="reorder"?"row-amber":""}>
            <td className="cell-code">{p.code}</td>
            <td className="small" style={{maxWidth:230}}>{p.name}</td>
            <td><span className="chip">{p.group}</span></td>
            <td>{p.partRank==="Critical"?<span className="tag tag-critical">Critical</span>:<span className="small muted">{p.partRank}</span>}</td>
            <td className="num mono small">{p.max}</td><td className="num mono small">{p.min}</td><td className="num mono small">{p.safety}</td><td className="num mono small">{p.rop}</td>
            <td className="num mono" style={{fontWeight:700,color:p.status==="critical"?"var(--red-ink)":p.status==="reorder"?"var(--amber-ink)":"var(--ink)"}}>{p.cur}</td>
            <td><StockBadge status={p.status}/></td>
            <td className="num mono small">{p.value?B.fmtMoney(p.value):"—"}</td>
            <td className="num mono tiny muted">{p.leadTime}d</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function InvReorder({ nav }){
  const rows=B.parts.filter(p=>p.cur<=p.rop).map(p=>({...p,suggest:Math.max(p.rop-p.cur,p.min||1)})).sort((a,b)=>b.score-a.score);
  const est=rows.reduce((s,p)=>s+p.price*p.suggest,0);
  return (
    <div className="panel">
      <div className="panel-head"><div className="h-sm">รายการต้องสั่งซื้อ ({rows.length})</div>
        <div className="row gap-sm"><span className="small muted">มูลค่าโดยประมาณ <b className="mono" style={{color:"var(--ink)"}}>{B.fmtMoney(est)}</b></span><button className="btn btn-primary" onClick={()=>nav.toast("สร้างใบสั่งซื้อ (PO) "+rows.length+" รายการ","check")}><Icon name="truck" size={15}/> สร้างใบสั่งซื้อ</button></div>
      </div>
      <div className="table-wrap"><table className="tbl">
        <thead><tr><th>รหัส</th><th>ชื่ออะไหล่</th><th>กลุ่ม</th><th>ยี่ห้อ</th><th className="num">คงคลัง</th><th className="num">ROP</th><th className="num">ควรสั่ง</th><th className="num">ราคา/หน่วย</th><th className="num">Lead</th><th>สถานะ</th></tr></thead>
        <tbody>{rows.map(p=>(
          <tr key={p.code} className={p.status==="critical"?"row-red":"row-amber"}>
            <td className="cell-code">{p.code}</td><td className="small" style={{maxWidth:220}}>{p.name}</td><td><span className="chip">{p.group}</span></td><td className="small muted">{p.brand}</td>
            <td className="num mono" style={{fontWeight:700,color:p.status==="critical"?"var(--red-ink)":"var(--amber-ink)"}}>{p.cur}</td>
            <td className="num mono">{p.rop}</td><td className="num mono" style={{fontWeight:700}}>{p.suggest}</td>
            <td className="num mono small">{p.price?B.fmtMoney(p.price):"—"}</td><td className="num mono tiny muted">{p.leadTime}d</td><td><StockBadge status={p.status}/></td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function InvLog({ rows, type, nav }){
  const [code,setCode]=useState(""); const [qty,setQty]=useState(1);
  return (
    <div className="grid" style={{gridTemplateColumns:"320px 1fr",gap:18,alignItems:"start"}}>
      <div className="panel"><div className="panel-head"><div className="h-sm">{type==="in"?"บันทึกรับเข้า":"บันทึกเบิกออก"}</div></div>
        <div className="panel-body">
          <div className="field"><label>อะไหล่ <span className="req">*</span></label>
            <select className="select" value={code} onChange={e=>setCode(e.target.value)}><option value="">เลือก...</option>{B.parts.map(p=><option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}</select></div>
          <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div className="field"><label>จำนวน</label><input className="input" type="number" min="1" value={qty} onChange={e=>setQty(+e.target.value||1)}/></div>
            <div className="field"><label>วันที่</label><input className="input" type="date" defaultValue="2026-06-05"/></div>
          </div>
          <div className="field"><label>{type==="in"?"ผู้รับเข้า / เลขที่ PO":"ผู้เบิก / เลขที่ใบแจ้ง"}</label><input className="input" placeholder={type==="in"?"PO-2026-0xx":"REQ-2026-0xx"}/></div>
          <div className="field"><label>เหตุผล / หมายเหตุ</label><textarea className="textarea" style={{minHeight:70}}></textarea></div>
          <button className={"btn btn-lg btn-block "+(type==="in"?"btn-success":"btn-primary")} onClick={()=>{ if(!code){nav.toast("กรุณาเลือกอะไหล่","error");return;} nav.toast((type==="in"?"รับเข้า":"เบิกออก")+" "+code+" จำนวน "+qty+" สำเร็จ","check"); }}>
            <Icon name={type==="in"?"download":"logout"} size={17}/> บันทึก{type==="in"?"รับเข้า":"เบิกออก"}
          </button>
        </div>
      </div>
      <div className="panel"><div className="panel-head"><div className="h-sm">ประวัติล่าสุด</div></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>วันที่</th><th>เอกสาร</th><th>รหัส</th><th>รายการ</th><th className="num">จำนวน</th>{type==="out"&&<th>เครื่อง</th>}<th>{type==="in"?"ผู้รับ":"ผู้เบิก"}</th></tr></thead>
          <tbody>{rows.map((l,i)=>(
            <tr key={i}><td className="mono small muted">{l.date}</td><td className="cell-code">{l.doc}</td><td className="cell-code">{l.code}</td><td className="small">{l.name}</td>
              <td className="num mono" style={{fontWeight:700,color:type==="in"?"var(--green-ink)":"var(--red-ink)"}}>{type==="in"?"+":"−"}{l.qty}</td>
              {type==="out"&&<td><span className="mono tiny">{l.mc}</span></td>}<td className="small muted">{l.by}</td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  );
}
