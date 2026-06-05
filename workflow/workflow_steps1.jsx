/* ============================================================
   MT_System — Workflow steps 1–6  → window.WF
   ============================================================ */
window.WF = window.WF || {};
(function(){
const W = window.DATA;
const EX = window.WF_EX;
const { WFNote, WFTrace, WFRO, WFStep, WFScreen } = window;

/* ---------------- 1 · Overview ---------------- */
const FLOW = [
  { ph:"A", icon:"qr",     t:"สแกน QR", s:"Operator" },
  { ph:"A", icon:"wrench", t:"แจ้งซ่อม", s:"Operator" },
  { ph:"A", icon:"mail",   t:"แจ้งเตือน", s:"ระบบ" },
  { ph:"B", icon:"list",   t:"เข้าคิวช่าง", s:"Technician" },
  { ph:"B", icon:"clipboard", t:"รับงาน·ซ่อม", s:"Technician" },
  { ph:"B", icon:"box",    t:"ตัดสต็อก", s:"ระบบ" },
  { ph:"C", icon:"checkCircle", t:"ตรวจรับ", s:"Supervisor" },
  { ph:"C", icon:"chart",  t:"อัปเดต KPI", s:"Manager" },
  { ph:"D", icon:"truck",  t:"คุมสต็อก ROP", s:"Store" },
];
const PHC = { A:"var(--blue)", B:"var(--accent)", C:"var(--green)", D:"var(--amber)" };

window.WF.overview = function Overview(){
  return (
    <>
      <WFNote kind="accent" icon="gauge" title="ระบบนี้ทำอะไร">
        ครอบคลุมตั้งแต่ <b>พนักงานพบเครื่องเสีย</b> จนถึง <b>Dashboard ผู้บริหาร</b> และ <b>การคุมสต็อกอะไหล่</b> —
        ทุกขั้นตอนเชื่อมต่อกันด้วยข้อมูลชุดเดียว เพื่อลด downtime, ติดตามต้นทุน และคุมอะไหล่ด้วยจุดสั่งซื้อ (ROP)
      </WFNote>

      <div className="panel">
        <div className="panel-head"><div className="h-sm">แผนผังกระบวนการหลัก (End-to-End Flow)</div><span className="chip"><Icon name="machine" size={13}/> 9 ขั้นตอนหลัก</span></div>
        <div className="panel-body" style={{ overflowX:"auto" }}>
          <div style={{ display:"flex", alignItems:"stretch", gap:0, minWidth:880 }}>
            {FLOW.map((f,i)=>(
              <React.Fragment key={i}>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ width:52, height:52, borderRadius:14, margin:"0 auto 9px", background:"var(--surface-2)", border:"1.5px solid "+PHC[f.ph], color:PHC[f.ph], display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name={f.icon} size={23}/></div>
                  <div className="small" style={{ fontWeight:700 }}>{f.t}</div>
                  <div className="tiny muted-2" style={{ marginTop:2 }}>{f.s}</div>
                </div>
                {i<FLOW.length-1 && <div style={{ flex:"0 0 22px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-3)", paddingBottom:30 }}><Icon name="chevR" size={16}/></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">ตัวอย่างที่จะใช้เดินเรื่อง</div></div>
          <div className="panel-body stack">
            <div className="row between"><WFRO label="ใบแจ้งซ่อม" value={EX.req.no} mono strong/><JobBadge status={EX.req.status}/></div>
            <div className="divider"></div>
            <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <WFRO label="เครื่องจักร" value={EX.mc.code+" · "+EX.mc.name}/>
              <WFRO label="กลุ่ม / Rank" value={EX.mc.group+" · Rank "+EX.mc.rank}/>
              <WFRO label="อาการ" value={EX.req.problem}/>
              <WFRO label="ความรุนแรง" value={EX.req.priority}/>
            </div>
            <WFNote kind="info" icon="pin" title={null}>เราจะติดตามใบแจ้งนี้ตั้งแต่ต้นจนปิดงาน เพื่อให้เห็นข้อมูลไหลผ่านทุกขั้นตอนจริง</WFNote>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">บทบาทผู้ใช้งาน (Roles)</div></div>
          <div className="panel-body" style={{ display:"grid", gap:10 }}>
            {[["Operator","แจ้งซ่อม ดูสถานะใบที่ตนแจ้ง","var(--blue)"],["Technician","รับงาน ซ่อม บันทึกอะไหล่","var(--accent)"],["Supervisor","ตรวจรับงาน ดูภาพรวม","var(--green)"],["Store Keeper","รับเข้า/เบิกออก คุมสต็อก","var(--amber)"],["Manager","ดู Dashboard KPI","var(--ink)"],["Admin","จัดการ Master Data & ผู้ใช้","var(--ink-2)"]].map(([r,d,c])=>(
              <div key={r} className="row gap-sm" style={{ alignItems:"flex-start" }}>
                <span style={{ width:9,height:9,borderRadius:"50%",background:c,flex:"none",marginTop:6 }}></span>
                <div><span className="small" style={{fontWeight:700}}>{r}</span> <span className="small muted">— {d}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WFNote kind="info" icon="list" title="แหล่งข้อมูลของระบบ">
        Machine Master, ใบแจ้งซ่อม, Repair Action, Spare Part Usage, PM Schedule, KPI และ Spare Part Master Data (Min/Max/Safety/ROP)
        — มาจากไฟล์ออกแบบระบบและไฟล์คุมสต็อกอะไหล่เชิงกลยุทธ์ที่แนบมา
      </WFNote>
    </>
  );
};

/* ---------------- 2 · Scan QR ---------------- */
window.WF.scan = function Scan(){
  const mc = EX.mc;
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns:"300px 1fr", gap:18, alignItems:"start" }}>
        <WFScreen caption="หน้าจอเครื่อง (หลังสแกน)" role="Operator">
          <div className="col" style={{ alignItems:"center", gap:14 }}>
            <QRBox size={150} label={mc.code}/>
            <WFNote kind="good" icon="checkCircle" title={null}>สแกนสำเร็จ — เปิดข้อมูลเครื่องอัตโนมัติ</WFNote>
          </div>
        </WFScreen>

        <div className="stack">
          <div className="panel">
            <div className="panel-head"><div className="h-sm">ข้อมูลที่ดึงจาก Machine Master</div><RankPill rank={mc.rank}/></div>
            <div className="panel-body grid" style={{ gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <WFRO label="รหัสเครื่อง" value={mc.code} mono strong/>
              <WFRO label="ชื่อเครื่อง" value={mc.name}/>
              <WFRO label="สถานะ" value={mc.status}/>
              <WFRO label="กลุ่มเครื่อง" value={mc.group}/>
              <WFRO label="แผนก / ตำแหน่ง" value={mc.dept}/>
              <WFRO label="Criticality" value={mc.crit}/>
              <WFRO label="ผู้ผลิต / รุ่น" value={mc.maker+" · "+mc.model}/>
              <WFRO label="ติดตั้งเมื่อ" value={mc.install} mono/>
              <WFRO label="Machine Rank" value={"Rank "+mc.rank+" (High Impact)"}/>
            </div>
          </div>
          <WFNote kind="accent" icon="qr" title="ทำไมต้องเริ่มที่ QR">
            QR ที่ติดหน้าเครื่องผูกกับ <b>รหัส {mc.code}</b> โดยตรง พนักงานไม่ต้องค้นหา/พิมพ์เอง ลดความผิดพลาดและร่นเวลาแจ้งซ่อม
            ฟิลด์เครื่องจักรในใบแจ้งจะถูก <b>เติมอัตโนมัติ</b>
          </WFNote>
        </div>
      </div>
      <WFTrace title="ข้อมูลที่ระบบเตรียมให้ขั้นถัดไป" items={[
        { k:"เครื่องจักร (auto-fill)", v:mc.code+" · "+mc.name, tone:"add" },
        { k:"Rank / Risk เริ่มต้น", v:"Rank "+mc.rank+" → ใช้กำหนดช่องทางแจ้งเตือน", tone:"info" },
        { k:"แผนก/ผู้รับผิดชอบ", v:mc.dept, tone:"info" },
      ]}/>
    </>
  );
};

/* ---------------- 3 · Report form ---------------- */
window.WF.report = function Report(){
  const r = EX.req, mc = EX.mc;
  const sev = ["Low","Medium","High","Critical"];
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns:"1fr 360px", gap:18, alignItems:"start" }}>
        <WFScreen caption="ฟอร์มแจ้งซ่อม" role="Operator">
          <div className="stack">
            <div className="card card-pad" style={{ background:"var(--surface-2)", padding:14 }}>
              <div className="tiny muted-2">เครื่องจักร (เติมอัตโนมัติจาก QR)</div>
              <div className="row between" style={{marginTop:3}}><span className="mono" style={{fontWeight:700}}>{mc.code}</span><RankPill rank={mc.rank}/></div>
            </div>
            <div><div className="tiny muted-2" style={{marginBottom:6}}>ประเภทงาน</div>
              <div className="seg" style={{gridAutoColumns:"1fr 1fr"}}><div className="seg-opt on-medium">งานซ่อม</div><div className="seg-opt">งานสร้าง</div></div></div>
            <div><div className="tiny muted-2" style={{marginBottom:6}}>อาการเสีย</div>
              <div className="input" style={{ minHeight:64, whiteSpace:"normal", lineHeight:1.5 }}>{r.problem}</div></div>
            <div><div className="tiny muted-2" style={{marginBottom:6}}>ความรุนแรง</div>
              <div className="seg">{sev.map(s=><div key={s} className={"seg-opt"+(s===r.priority?" on-"+s.toLowerCase():"")} style={{fontSize:13}}>{s}</div>)}</div></div>
            <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:11}}>
              <WFRO label="ผู้แจ้ง" value={r.reporter}/><WFRO label="แผนก" value={r.dept}/>
            </div>
          </div>
        </WFScreen>

        <div className="stack">
          <WFNote kind="accent" icon="wrench" title="ระบบออกเลขให้อัตโนมัติ">
            เมื่อกดส่ง ระบบสร้างเลข <b>{r.no}</b> และบันทึก <b>เวลาเริ่มเสีย {r.start}</b> ทันที (ใช้คำนวณ downtime ภายหลัง)
          </WFNote>
          <div className="panel">
            <div className="panel-head" style={{padding:"12px 16px"}}><div className="h-sm">รายละเอียดในฟอร์ม</div></div>
            <div className="panel-body stack" style={{padding:16}}>
              <WFStep n={1} title="แนบรูปถ่ายหน้างาน">ช่วยให้ช่างประเมินอาการได้เร็วก่อนถึงเครื่อง</WFStep>
              <WFStep n={2} title="เลือกความรุนแรง">{r.priority} — ส่งผลต่อลำดับคิวและช่องทางแจ้งเตือน</WFStep>
              <WFStep n={3} title="ผู้แจ้ง & แผนก">ผูกกับใบแจ้งเพื่อติดตามและแจ้งผลกลับ</WFStep>
            </div>
          </div>
        </div>
      </div>
      <WFTrace items={[
        { k:"สร้างใบแจ้งซ่อม", v:r.no+" (สถานะ Waiting)", tone:"add" },
        { k:"เวลาเริ่มเสีย", v:r.start, tone:"add" },
        { k:"ความรุนแรง", v:r.priority, tone:"warn" },
        { k:"ผูกกับเครื่อง", v:mc.code, tone:"info" },
      ]}/>
    </>
  );
};

/* ---------------- 4 · Alert routing ---------------- */
window.WF.alert = function Alert(){
  const mc = EX.mc, r = EX.req;
  const zone = mc.rank==="A" ? "HIGH" : mc.rank==="B" ? "MEDIUM" : "LOW";
  return (
    <>
      <WFNote kind="info" icon="mail" title="ระบบเลือกช่องทางแจ้งเตือนให้อัตโนมัติ">
        ใช้ <b>Risk Matrix</b> — พิจารณาจาก Machine Rank × ความวิกฤตของอะไหล่ → กำหนด Risk Zone และวิธีแจ้ง
      </WFNote>

      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">ตรรกะการตัดสินใจ</div></div>
          <div className="panel-body stack">
            <WFStep n={1} title={"เครื่อง "+mc.code+" = Rank "+mc.rank}>เครื่องสำคัญ (High Impact) ต่อสายการผลิต</WFStep>
            <WFStep n={2} title={"ความรุนแรง = "+r.priority}>ยิ่งสูง ยิ่งเร่งช่องทางด่วน</WFStep>
            <WFStep n={3} title="ได้ผลลัพธ์ Risk Zone"><span className="row gap-sm" style={{margintop:4}}><RiskTag zone={zone}/></span></WFStep>
            <div className="divider"></div>
            <WFNote kind="bad" icon="bell" title="ผลลัพธ์: HIGH RISK">ส่ง <b>LINE Alert ทันที</b> ถึงทีมช่าง + หัวหน้างาน และบันทึก Email log คู่ขนาน</WFNote>
          </div>
        </div>

        <div className="stack">
          <WFScreen caption="ตัวอย่างการแจ้งเตือน" role="ระบบ">
            <div className="card card-pad" style={{ borderLeft:"3px solid var(--red)", padding:14 }}>
              <div className="row gap-sm" style={{ marginBottom:8 }}><span style={{color:"var(--red)"}}><Icon name="bell" size={16}/></span><span className="small" style={{fontWeight:700}}>LINE Alert · งานวิกฤต</span></div>
              <div className="small" style={{ lineHeight:1.55 }}>
                <b>[{r.no}]</b> {mc.code} {mc.name}<br/>
                อาการ: {r.problem}<br/>
                ความรุนแรง: <b>{r.priority}</b> · แจ้งโดย {r.reporter}
              </div>
            </div>
            <div className="card card-pad row gap-sm" style={{ marginTop:10, padding:"11px 14px" }}>
              <span style={{color:"var(--blue)"}}><Icon name="mail" size={16}/></span>
              <span className="small">Email log ถึง หัวหน้างาน MT + ทีมช่าง พร้อมลิงก์ใบแจ้ง</span>
            </div>
          </WFScreen>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><div className="h-sm">Risk Matrix — Machine Rank × Part Criticality</div></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Machine Rank</th><th>ความวิกฤตอะไหล่</th><th>Risk Zone</th><th>วิธีแจ้งเตือน</th></tr></thead>
          <tbody>{W.riskMatrix.map((m,i)=>(
            <tr key={i} style={ i<2?{background:"var(--red-bg)"}:null }>
              <td style={{fontWeight:600}}>{m.rank} <span className="tiny muted-2">{m.sub}</span></td>
              <td className="small">{m.crit}</td>
              <td><RiskTag zone={m.zone}/></td>
              <td className="small muted">{m.proto}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
      <WFTrace items={[
        { k:"Risk Zone", v:zone+" RISK", tone:"warn" },
        { k:"ช่องทางแจ้ง", v:"LINE Alert ทันที + Email log", tone:"add" },
        { k:"ผู้รับแจ้ง", v:"ทีมช่าง + หัวหน้างาน MT", tone:"info" },
      ]}/>
    </>
  );
};

/* ---------------- 5 · Technician queue ---------------- */
const PRI = { Critical:0, High:1, Medium:2, Low:3 };
window.WF.queue = function Queue(){
  const open = W.requests.filter(r=>r.status!=="Completed").sort((a,b)=>PRI[a.priority]-PRI[b.priority]);
  return (
    <>
      <WFNote kind="accent" icon="list" title="งานเรียงตามความสำคัญ ไม่ใช่เวลาที่แจ้ง">
        คิวจัดลำดับด้วย <b>ความรุนแรง + Rank เครื่อง</b> งาน Critical / Rank A จะเด่นด้วยแถบสีแดงด้านบน เพื่อให้ช่างหยิบงานถูกตัว
      </WFNote>
      <WFScreen caption="คิวงานช่าง (เรียงแล้ว)" role="Technician">
        <div style={{ display:"grid", gap:12 }}>
          {open.map(r=>{
            const mc=W.machineByCode(r.mc); const hot=r.priority==="Critical"||(mc&&mc.rank==="A");
            const isEx = r.no===EX.req.no;
            return (
              <div key={r.no} className="card" style={{ overflow:"hidden", borderColor: isEx?"var(--accent)":hot?"var(--red)":"var(--border)", borderWidth: (isEx||hot)?1.5:1 }}>
                {hot && <div style={{ background: isEx?"var(--accent)":"var(--red)", color:"#fff", padding:"4px 14px", fontSize:11, fontWeight:700, letterSpacing:".04em", display:"flex", alignItems:"center", gap:6 }}><Icon name="alert" size={12}/> {isEx?"ใบแจ้งตัวอย่างของเรา · ":""}งานสำคัญ — ดำเนินการก่อน</div>}
                <div className="card-pad" style={{ padding:14 }}>
                  <div className="row between"><span className="mono small" style={{fontWeight:600}}>{r.no}</span><PriorityTag p={r.priority}/></div>
                  <div className="row" style={{ margin:"7px 0", gap:7 }}><span className="mono" style={{fontWeight:600}}>{r.mc}</span><span className="small muted">{r.mcName}</span>{mc&&<RankPill rank={mc.rank}/>}</div>
                  <div className="small" style={{ marginBottom:10 }}>{r.problem}</div>
                  <div className="row between"><span className="tiny muted-2 mono"><Icon name="clock" size={12}/> {r.date}</span><span className="btn btn-sm btn-primary" style={{pointerEvents:"none"}}>กดรับงาน</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </WFScreen>
      <WFTrace title="สถานะคิว ณ ขั้นนี้" items={[
        { k:"งานในคิว (เปิดอยู่)", v:open.length+" รายการ", tone:"info" },
        { k:"ลำดับสูงสุด", v:open[0].no+" · "+open[0].priority, tone:"warn" },
        { k:"ใบแจ้งตัวอย่าง", v:EX.req.no+" รอช่างรับงาน", tone:"info" },
      ]}/>
    </>
  );
};

/* ---------------- 6 · Accept & diagnose ---------------- */
window.WF.accept = function Accept(){
  const r=EX.req, rep=EX.repair, mc=EX.mc;
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start" }}>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">การเปลี่ยนสถานะ</div></div>
          <div className="panel-body">
            <div className="row" style={{ gap:10, alignItems:"center", justifyContent:"center", padding:"6px 0 14px" }}>
              <span className="badge b-gray"><span className="dot"></span>Waiting</span>
              <Icon name="chevR" size={18} style={{color:"var(--ink-3)"}}/>
              <span className="badge b-blue"><span className="dot"></span>In Progress</span>
            </div>
            <WFNote kind="info" icon="clock" title="นาฬิกา downtime เริ่มเดิน">เมื่อช่างกดรับงาน ระบบจับเวลาตั้งแต่ <b>{r.start}</b> เพื่อคำนวณ downtime / MTTR ตอนปิดงาน</WFNote>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="h-sm">วินิจฉัยเบื้องต้น</div><span className="chip">{rep.cat}</span></div>
          <div className="panel-body stack">
            <WFRO label="ช่างผู้รับงาน" value={rep.tech}/>
            <WFRO label="หมวดปัญหา" value={rep.cat+" (ไฟฟ้า)"}/>
            <WFRO label="สาเหตุราก (Root Cause)" value={rep.root}/>
            <WFRO label="ประเภทสาเหตุ" value={rep.causeType}/>
          </div>
        </div>
      </div>
      <WFScreen caption="ไทม์ไลน์ของใบแจ้ง ณ ตอนนี้" role="Technician">
        <Timeline steps={window.buildTimeline({...r, status:"In Progress", finish:""}, {...rep, verify:"Pending"})}/>
      </WFScreen>
      <WFTrace items={[
        { k:"สถานะใบแจ้ง", v:"Waiting → In Progress", tone:"add" },
        { k:"ผู้รับผิดชอบ", v:rep.tech, tone:"info" },
        { k:"นาฬิกา downtime", v:"เริ่มนับจาก "+r.start, tone:"warn" },
      ]}/>
    </>
  );
};

})();
