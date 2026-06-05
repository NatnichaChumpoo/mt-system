/* ============================================================
   MT_System — Workflow steps 7–12  → window.WF
   ============================================================ */
window.WF = window.WF || {};
(function(){
const W = window.DATA;
const EX = window.WF_EX;
const { WFNote, WFTrace, WFRO, WFStep, WFScreen } = window;

/* ---------------- 7 · Repair + parts ---------------- */
window.WF.repair = function Repair(){
  const r=EX.req, rep=EX.repair, use=EX.usage;
  const total = use.reduce((s,u)=>s+u.unit*u.qty,0);
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns:"1fr 380px", gap:18, alignItems:"start" }}>
        <WFScreen caption="ฟอร์มบันทึกการซ่อม" role="Technician">
          <div className="stack">
            <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
              <WFRO label="หมวดปัญหา" value={rep.cat}/>
              <WFRO label="ประเภทสาเหตุ" value={rep.causeType}/>
            </div>
            <div><div className="tiny muted-2" style={{marginBottom:4}}>สาเหตุราก (Root Cause)</div><div className="input" style={{whiteSpace:"normal",lineHeight:1.5,minHeight:0,padding:"9px 12px"}}>{rep.root}</div></div>
            <div><div className="tiny muted-2" style={{marginBottom:4}}>วิธีแก้ไข (Corrective Action)</div><div className="input" style={{whiteSpace:"normal",lineHeight:1.5,minHeight:0,padding:"9px 12px"}}>{rep.action}</div></div>
            <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
              <WFRO label="เวลาเริ่ม" value={rep.start} mono/>
              <WFRO label="เวลาเสร็จ" value={rep.finish} mono/>
            </div>
          </div>
        </WFScreen>

        <div className="stack">
          <div className="panel">
            <div className="panel-head" style={{padding:"12px 16px"}}><div className="h-sm">อะไหล่ที่ใช้</div></div>
            <div style={{ padding:14 }}>
              {use.map((u,i)=>(
                <div key={i} className="row between" style={{ padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <div><div className="small" style={{fontWeight:600}}>{u.name}</div><div className="tiny muted-2 mono">{u.code} · ×{u.qty}</div></div>
                  <span className="mono small" style={{fontWeight:600}}>฿{W.fmtNum(u.unit*u.qty)}</span>
                </div>
              ))}
              <div className="row between" style={{ paddingTop:11 }}>
                <span className="small" style={{fontWeight:700}}>ต้นทุนอะไหล่รวม</span>
                <span className="mono" style={{ fontWeight:700, fontSize:18 }}>฿{W.fmtNum(total)}</span>
              </div>
            </div>
          </div>
          <WFNote kind="warn" icon="alert" title="หมายเหตุสำคัญ">การกดบันทึกจะ <b>ตัดสต็อกอะไหล่อัตโนมัติ</b> และส่งงานให้หัวหน้าตรวจรับ — ดูรายละเอียดขั้นถัดไป</WFNote>
        </div>
      </div>
      <WFTrace items={[
        { k:"บันทึกผลการซ่อม", v:rep.cat+" · "+rep.causeType, tone:"add" },
        { k:"อะไหล่ที่ใช้", v:use.map(u=>u.code+"×"+u.qty).join(", "), tone:"cut" },
        { k:"ต้นทุนอะไหล่รวม", v:"฿"+W.fmtNum(total), tone:"warn" },
        { k:"เวลาซ่อมรวม", v:rep.hrs+" ชม.", tone:"info" },
      ]}/>
    </>
  );
};

/* ---------------- 8 · Auto stock deduction ---------------- */
window.WF.deduct = function Deduct(){
  const use = EX.usage;
  // illustrative before/after for the used part (ties into reorder next)
  const rows = use.map(u=>{ const before=3, after=Math.max(0, before-u.qty), rop=2;
    return { ...u, before, after, rop, hitRop: after<=rop }; });
  return (
    <>
      <WFNote kind="accent" icon="box" title="ระบบหักสต็อกให้ทันที — ไม่ต้องบันทึกซ้ำที่คลัง">
        เมื่อช่างกดบันทึกผลซ่อม ระบบจะ <b>ตัดยอดคงคลัง</b> ตามอะไหล่ที่ใช้ พร้อมสร้าง <b>Stock Out log</b> และ <b>ตรวจ ROP</b> อัตโนมัติ
      </WFNote>

      <div className="panel">
        <div className="panel-head"><div className="h-sm">การตัดสต็อก (ก่อน → หลัง)</div><span className="eyebrow" style={{fontSize:10}}>AUTO DEDUCT</span></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Part Code</th><th>รายการ</th><th className="num">เบิกออก</th><th className="num">คงคลังก่อน</th><th className="num">คงคลังหลัง</th><th className="num">ROP</th><th>สถานะใหม่</th></tr></thead>
          <tbody>{rows.map((u,i)=>(
            <tr key={i} className={u.hitRop?"row-amber":""}>
              <td className="cell-code">{u.code}</td>
              <td className="small">{u.name}</td>
              <td className="num mono" style={{color:"var(--red-ink)",fontWeight:700}}>−{u.qty}</td>
              <td className="num mono">{u.before}</td>
              <td className="num mono" style={{fontWeight:700}}>{u.after}</td>
              <td className="num mono">{u.rop}</td>
              <td>{u.hitRop ? <StockBadge status="reorder"/> : <StockBadge status="normal"/>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start" }}>
        <WFScreen caption="Stock Out log (สร้างอัตโนมัติ)" role="ระบบ">
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>วันที่</th><th>เอกสาร</th><th>Part</th><th className="num">จำนวน</th></tr></thead>
            <tbody>{use.map((u,i)=>(
              <tr key={i}><td className="mono small muted">{EX.req.finish.split(" ")[0]}</td><td className="cell-code">{EX.req.no}</td><td className="cell-code">{u.code}</td><td className="num mono" style={{color:"var(--red-ink)",fontWeight:700}}>−{u.qty}</td></tr>
            ))}</tbody>
          </table></div>
        </WFScreen>
        <div className="stack">
          <WFStep n={1} title="หักยอดคงคลังทันที">ลดจำนวน Current Stock ของอะไหล่ที่ใช้</WFStep>
          <WFStep n={2} title="บันทึก Stock Out log">ผูกกับใบแจ้ง {EX.req.no} และเครื่อง {EX.mc.code} เพื่อสอบย้อนกลับได้</WFStep>
          <WFStep n={3} title="ตรวจ ROP อัตโนมัติ">ถ้าคงคลัง ≤ จุดสั่งซื้อ (ROP) → ตั้งสถานะ “ควรสั่งซื้อ” ส่งต่อให้คลัง</WFStep>
          <WFNote kind="warn" icon="truck" title={null}>อะไหล่ในตัวอย่างแตะ ROP แล้ว → จะไปโผล่ใน “รายการต้องสั่งซื้อ” (ขั้นที่ 11)</WFNote>
        </div>
      </div>
      <WFTrace items={[
        { k:"คงคลังถูกหัก", v:use.map(u=>u.code+" −"+u.qty).join(", "), tone:"cut" },
        { k:"สร้าง Stock Out log", v:"อ้างอิง "+EX.req.no, tone:"add" },
        { k:"ผลการตรวจ ROP", v:"แตะจุดสั่งซื้อ → flag ควรสั่งซื้อ", tone:"warn" },
      ]}/>
    </>
  );
};

/* ---------------- 9 · Supervisor verify ---------------- */
window.WF.verify = function Verify(){
  const r=EX.req, rep=EX.repair, use=EX.usage;
  const total=use.reduce((s,u)=>s+u.unit*u.qty,0);
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns:"1fr 360px", gap:18, alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">สรุปผลการซ่อมให้หัวหน้าตรวจ</div><JobBadge status="Completed"/></div>
          <div className="panel-body grid" style={{ gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <WFRO label="ใบแจ้ง" value={r.no} mono strong/>
            <WFRO label="เครื่องจักร" value={r.mc+" · "+r.mcName}/>
            <WFRO label="ช่างผู้ซ่อม" value={rep.tech}/>
            <WFRO label="เวลาซ่อมรวม" value={rep.hrs+" ชม."}/>
            <WFRO label="สาเหตุราก" value={rep.root}/>
            <WFRO label="วิธีแก้ไข" value={rep.action}/>
            <WFRO label="อะไหล่ที่ใช้" value={use.map(u=>u.code+"×"+u.qty).join(", ")}/>
            <WFRO label="ต้นทุนอะไหล่" value={"฿"+W.fmtNum(total)}/>
          </div>
        </div>
        <WFScreen caption="แผงตรวจรับ (Supervisor)" role="Supervisor">
          <div className="stack">
            <div><div className="tiny muted-2" style={{marginBottom:4}}>เหตุผล / หมายเหตุ</div><div className="input" style={{minHeight:54,padding:"9px 12px",color:"var(--ink-3)"}}>— ไม่มี (อนุมัติ) —</div></div>
            <div className="row gap-sm">
              <span className="btn btn-success grow" style={{pointerEvents:"none"}}><Icon name="check" size={16}/> อนุมัติ</span>
              <span className="btn btn-danger grow" style={{pointerEvents:"none"}}><Icon name="x" size={16}/> ไม่อนุมัติ</span>
            </div>
            <WFNote kind="good" icon="checkCircle" title={null}>อนุมัติโดย <b>{rep.by}</b> → ปิดงานและเก็บเข้าประวัติเครื่อง {r.mc}</WFNote>
          </div>
        </WFScreen>
      </div>
      <WFScreen caption="ไทม์ไลน์เมื่อปิดงานสมบูรณ์">
        <Timeline steps={window.buildTimeline(r, rep)}/>
      </WFScreen>
      <WFTrace items={[
        { k:"สถานะใบแจ้ง", v:"Completed → Approved", tone:"add" },
        { k:"ผู้ตรวจรับ", v:rep.by, tone:"info" },
        { k:"จัดเก็บประวัติ", v:"ผูกกับเครื่อง "+r.mc, tone:"add" },
        { k:"downtime สรุป", v:r.downtime+" ชม.", tone:"warn" },
      ]}/>
    </>
  );
};

/* ---------------- 10 · KPI update ---------------- */
window.WF.kpi = function Kpi(){
  return (
    <>
      <WFNote kind="info" icon="chart" title="ทุกงานที่ปิด ป้อนค่าเข้า KPI โดยอัตโนมัติ">
        ใบแจ้ง {EX.req.no} ใช้เวลาซ่อม <b>{EX.repair.hrs} ชม.</b> และ downtime <b>{EX.req.downtime} ชม.</b> — ค่าเหล่านี้รวมเข้าสูตร MTTR และ Total Downtime
      </WFNote>

      <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(205px,1fr))", gap:14 }}>
        {W.kpi.map(k=><KpiCard key={k.key} k={k}/>)}
      </div>

      <div className="panel">
        <div className="panel-head"><div className="h-sm">สูตรคำนวณ KPI</div></div>
        <div className="panel-body" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[
            ["MTBF","ชั่วโมงเดินเครื่องรวม ÷ จำนวนครั้งที่เสีย","ยิ่งสูงยิ่งดี — เครื่องเสถียร"],
            ["MTTR","ชั่วโมงซ่อมรวม ÷ จำนวนครั้งที่เสีย","ยิ่งต่ำยิ่งดี — ซ่อมเร็ว"],
            ["Total Downtime","ผลรวมเวลาที่เครื่องหยุดทุกใบแจ้ง","ยิ่งต่ำยิ่งดี"],
            ["PM Compliance","PM ที่ทำเสร็จ ÷ PM ตามแผน × 100%","เป้า > 95%"],
          ].map(([n,f,d])=>(
            <div key={n} className="card card-pad" style={{ padding:14 }}>
              <div className="row gap-sm" style={{marginBottom:6}}><span className="mono" style={{fontWeight:700,fontSize:14}}>{n}</span></div>
              <div className="small" style={{fontWeight:600}}>{f}</div>
              <div className="tiny muted-2" style={{marginTop:3}}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">แนวโน้ม Downtime รายเดือน</div><span className="delta delta-up"><Icon name="arrowDown" size={13}/> ลดลงต่อเนื่อง</span></div>
          <div className="panel-body">
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:140 }}>
              {W.downtimeTrend.map((d,i)=>{ const mx=Math.max(...W.downtimeTrend.map(x=>x.v));
                return <div key={i} className="col" style={{flex:1,alignItems:"center",gap:6,justifyContent:"flex-end",height:"100%"}}>
                  <span className="mono tiny" style={{fontWeight:700}}>{d.v}</span>
                  <div style={{ width:"100%",maxWidth:30,height:(d.v/mx*100)+"px",borderRadius:"6px 6px 0 0",background: i===W.downtimeTrend.length-1?"var(--green)":"linear-gradient(180deg,#b89668,#9a7b4f)" }}></div>
                  <span className="tiny muted-2">{d.m}</span>
                </div>; })}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">Pareto — อะไหล่ที่เสียบ่อย</div></div>
          <div className="panel-body" style={{ display:"grid", gap:9 }}>
            {W.pareto.slice(0,6).map((p,i)=>{ const mx=W.pareto[0].count;
              return <div key={p.code} className="row" style={{gap:11}}>
                <span className="small" style={{width:120,flex:"none",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</span>
                <span className="grow"><HBar pct={p.count/mx*100} color={i<3?"var(--red)":"var(--accent)"}/></span>
                <span className="mono small" style={{width:24,textAlign:"right",fontWeight:700}}>{p.count}</span>
              </div>; })}
          </div>
        </div>
      </div>
      <WFTrace title="ผลต่อ Dashboard" items={[
        { k:"MTTR", v:"รวมเวลาซ่อม "+EX.repair.hrs+" ชม. ของใบนี้", tone:"info" },
        { k:"Total Downtime", v:"+"+EX.req.downtime+" ชม.", tone:"warn" },
        { k:"Breakdown count", v:"+1 ครั้ง (เครื่อง "+EX.mc.code+")", tone:"warn" },
      ]}/>
    </>
  );
};

/* ---------------- 11 · Reorder / ROP ---------------- */
window.WF.reorder = function Reorder(){
  const rows = W.parts.filter(p=>p.cur<=p.rop).map(p=>({...p, suggest:Math.max(p.rop-p.cur, p.min||1)})).sort((a,b)=>b.score-a.score).slice(0,8);
  const est = rows.reduce((s,p)=>s+p.price*p.suggest,0);
  return (
    <>
      <WFNote kind="warn" icon="truck" title="คลังเห็นรายการที่ต้องสั่งซื้อแบบเรียลไทม์">
        ระบบกรองอะไหล่ที่ <b>คงคลัง ≤ ROP</b> และคำนวณ <b>จำนวนที่ควรสั่ง (ROP − คงคลัง)</b> ให้ พร้อมออกใบสั่งซื้อ — ปิดช่องว่างก่อนของหมดจริง
      </WFNote>
      <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14 }}>
        {[["ต้องสั่งซื้อ", W.parts.filter(p=>p.cur<=p.rop).length, "var(--amber)","truck"],
          ["ของหมด (วิกฤต)", W.parts.filter(p=>p.status==="critical").length, "var(--red)","alert"],
          ["มูลค่าที่ควรสั่ง (ประมาณ)", W.fmtMoney(est), "var(--green)","chart"]].map(([l,v,c,ic])=>(
          <div key={l} className="card card-pad row" style={{gap:12,padding:16}}>
            <span style={{width:40,height:40,borderRadius:11,background:c,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flex:"none"}}><Icon name={ic} size={19}/></span>
            <div><div className="mono" style={{fontSize:21,fontWeight:700,lineHeight:1}}>{v}</div><div className="tiny muted" style={{marginTop:3}}>{l}</div></div>
          </div>
        ))}
      </div>
      <WFScreen caption="รายการต้องสั่งซื้อ (Reorder List)" role="Store Keeper">
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Part Code</th><th>ชื่ออะไหล่</th><th>กลุ่ม</th><th className="num">คงคลัง</th><th className="num">ROP</th><th className="num">ควรสั่ง</th><th className="num">ราคา/หน่วย</th><th>Lead</th><th>สถานะ</th></tr></thead>
          <tbody>{rows.map(p=>(
            <tr key={p.code} className={p.status==="critical"?"row-red":"row-amber"}>
              <td className="cell-code">{p.code}</td>
              <td className="small" style={{maxWidth:210}}>{p.name}</td>
              <td><span className="chip">{p.group}</span></td>
              <td className="num mono" style={{fontWeight:700,color:p.status==="critical"?"var(--red-ink)":"var(--amber-ink)"}}>{p.cur}</td>
              <td className="num mono">{p.rop}</td>
              <td className="num mono" style={{fontWeight:700}}>{p.suggest}</td>
              <td className="num mono small">{p.price?W.fmtMoney(p.price):"—"}</td>
              <td className="mono tiny muted">{p.leadTime}d</td>
              <td><StockBadge status={p.status}/></td>
            </tr>
          ))}</tbody>
        </table></div>
      </WFScreen>
      <WFTrace title="เมื่อกดสร้างใบสั่งซื้อ (PO)" items={[
        { k:"สร้าง PO", v:rows.length+" รายการ", tone:"add" },
        { k:"มูลค่ารวมโดยประมาณ", v:W.fmtMoney(est), tone:"warn" },
        { k:"เมื่อรับของเข้า", v:"Stock In → คงคลังกลับเหนือ ROP", tone:"info" },
      ]}/>
    </>
  );
};

/* ---------------- 12 · PM & Risk Matrix ---------------- */
window.WF.prevent = function Prevent(){
  const PM_BADGE={ "Completed":"b-green","Overdue":"b-red","Due Later":"b-blue" };
  const PM_TH={ "Completed":"เสร็จตามแผน","Overdue":"เกินกำหนด","Due Later":"ยังไม่ถึงกำหนด" };
  const overdue=W.pm.filter(p=>p.status==="Overdue").length;
  return (
    <>
      <WFNote kind="accent" icon="cal" title="ปิด loop ด้วยการป้องกัน ไม่ใช่แค่ซ่อม">
        นอกจากแก้เมื่อเสีย ระบบยังคุม <b>แผน PM</b> เพื่อลด Breakdown และใช้ <b>Risk Matrix</b> จัดลำดับความเสี่ยงเชิงกลยุทธ์ของเครื่อง × อะไหล่
      </WFNote>

      {overdue>0 && <WFNote kind="bad" icon="alert" title={null}>มี <b>{overdue} เครื่อง</b> เกินกำหนด PM — ต้องดำเนินการ เพื่อกัน Breakdown ซ้ำ</WFNote>}

      <div className="panel">
        <div className="panel-head"><div className="h-sm">แผนบำรุงรักษาเชิงป้องกัน (PM Schedule)</div></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>เครื่อง</th><th>Checklist</th><th>ความถี่</th><th>PM ล่าสุด</th><th>ครั้งถัดไป</th><th>สถานะ</th></tr></thead>
          <tbody>{W.pm.map(p=>(
            <tr key={p.mc+p.checklist} className={p.status==="Overdue"?"row-red":""}>
              <td><span className="mono small" style={{fontWeight:600}}>{p.mc}</span><div className="tiny muted-2">{p.name}</div></td>
              <td className="small">{p.checklist}</td>
              <td><span className="chip">{p.freq}</span></td>
              <td className="mono small muted">{p.last}</td>
              <td className="mono small" style={{fontWeight:600}}>{p.next}</td>
              <td><span className={"badge "+PM_BADGE[p.status]}><span className="dot"></span>{PM_TH[p.status]}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">Risk Matrix</div><div className="tiny muted-2">Rank × Part Criticality</div></div>
          <div className="panel-body">
            <div style={{ display:"grid", gridTemplateColumns:"auto repeat(3,1fr)", gap:6 }}>
              <div></div>
              {W.riskGrid.cols.map(c=><div key={c} className="tiny" style={{textAlign:"center",fontWeight:700,color:"var(--ink-2)",paddingBottom:4}}>{c.replace(" Part","")}</div>)}
              {W.riskGrid.rows.map(row=>(
                <React.Fragment key={row}>
                  <div className="tiny" style={{fontWeight:700,color:"var(--ink-2)",display:"flex",alignItems:"center"}}>{row}</div>
                  {W.riskGrid.zone[row].map((z,i)=>(
                    <div key={i} style={{ borderRadius:9,padding:"15px 6px",textAlign:"center",fontWeight:700,fontSize:11.5,
                      background: z==="HIGH"?"var(--red)":z==="MEDIUM"?"var(--amber)":"var(--green)",color:"#fff" }}>{z}</div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">สรุปคลังแยกตาม MC Group</div></div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Group</th><th className="num">มูลค่า</th><th className="num">ต่ำกว่า ROP</th><th>Risk</th></tr></thead>
            <tbody>{W.mcGroups.map(g=>(
              <tr key={g.group}><td style={{fontWeight:600}}>{g.group}</td><td className="num mono small">{W.fmtMoney(g.value)}</td>
              <td className="num mono" style={{fontWeight:g.reorder>5?700:400,color:g.reorder>5?"var(--amber-ink)":"var(--ink)"}}>{g.reorder}</td>
              <td><RiskTag zone={g.risk}/></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      </div>

      <WFNote kind="good" icon="checkCircle" title="จบ loop — แล้วเริ่มใหม่ได้ทันที">
        ครบวงจร: แจ้งซ่อม → ซ่อม → ตัดสต็อก → ตรวจรับ → KPI → คุมสต็อก/PM ข้อมูลทุกขั้นเชื่อมกัน ทำให้บริหารเครื่องจักรและอะไหล่ได้ด้วยภาพเดียว
      </WFNote>
    </>
  );
};

})();
