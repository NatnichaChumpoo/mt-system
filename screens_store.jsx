/* ============================================================
   MT_System — Store screens
   Master Data, Reorder list, Stock In / Out
   ============================================================ */
const Ds = window.DATA;

/* ---------------- 5.9 Spare part master data ---------------- */
function MasterData({ ctx }) {
  const [q, setQ] = useState("");
  const [grp, setGrp] = useState("all");
  const [st, setSt] = useState("all");
  const groups = ["all", ...Array.from(new Set(Ds.parts.map(p=>p.group)))];
  let rows = Ds.parts.filter(p => {
    if (grp!=="all" && p.group!==grp) return false;
    if (st!=="all" && p.status!==st) return false;
    if (q && !(p.code+p.name+p.brand).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const { sorted, sort, onSort } = useSort(rows, { key:"code", dir:1 });
  const totalVal = Ds.parts.reduce((s,p)=>s+p.value,0);
  const counts = {
    critical: Ds.parts.filter(p=>p.status==="critical").length,
    reorder: Ds.parts.filter(p=>p.status==="reorder").length,
    normal: Ds.parts.filter(p=>p.status==="normal").length,
  };
  return (
    <div>
      <PageHead title="คลังอะไหล่ — Master Data" sub="Spare Part Master · ควบคุมด้วย Min / Max / Safety Stock / ROP" actions={
        <><button className="btn"><Icon name="download" size={15}/> ส่งออก</button><button className="btn btn-primary"><Icon name="plus" size={15}/> เพิ่มอะไหล่</button></>
      } />
      <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", marginBottom:16}}>
        <MiniStat label="รายการทั้งหมด" value={Ds.parts.length} color="var(--navy)" icon="box"/>
        <MiniStat label="วิกฤต (ของหมด)" value={counts.critical} color="var(--red)" icon="alert"/>
        <MiniStat label="ควรสั่งซื้อ" value={counts.reorder} color="var(--amber)" icon="truck"/>
        <MiniStat label="มูลค่าคงคลัง" value={Ds.fmtMoney(totalVal)} color="var(--green)" icon="chart"/>
      </div>
      <div className="panel">
        <div className="panel-head wrap" style={{gap:10}}>
          <SearchBar value={q} onChange={setQ} placeholder="ค้นหา Part Code / ชื่อ / แบรนด์"/>
          <div className="row gap-sm wrap grow" style={{justifyContent:"flex-end"}}>
            <select className="select" style={{width:"auto"}} value={grp} onChange={e=>setGrp(e.target.value)}>
              {groups.map(g=><option key={g} value={g}>{g==="all"?"ทุกกลุ่ม":g}</option>)}
            </select>
            <FilterChips value={st} onChange={setSt} opts={[["all","ทั้งหมด"],["critical","วิกฤต"],["reorder","ควรสั่ง"],["normal","ปกติ"]]} />
          </div>
        </div>
        <div className="table-wrap" style={{maxHeight:"60vh"}}>
          <table className="tbl">
            <thead><tr>
              <Th k="code" sort={sort} onSort={onSort}>Part Code</Th>
              <Th k="name" sort={sort} onSort={onSort}>ชื่ออะไหล่</Th>
              <Th k="group" sort={sort} onSort={onSort}>กลุ่ม</Th>
              <Th k="partRank" sort={sort} onSort={onSort}>Part Rank</Th>
              <Th k="max" sort={sort} onSort={onSort} align="right">Max</Th>
              <Th k="min" sort={sort} onSort={onSort} align="right">Min</Th>
              <Th k="safety" sort={sort} onSort={onSort} align="right">Safety</Th>
              <Th k="rop" sort={sort} onSort={onSort} align="right">ROP</Th>
              <Th k="cur" sort={sort} onSort={onSort} align="right">คงคลัง</Th>
              <th>สถานะ</th>
              <Th k="value" sort={sort} onSort={onSort} align="right">มูลค่า</Th>
              <Th k="leadTime" sort={sort} onSort={onSort} align="right">Lead</Th>
            </tr></thead>
            <tbody>
              {sorted.map(p=>(
                <tr key={p.code} className={p.status==="critical"?"row-red":p.status==="reorder"?"row-amber":""}>
                  <td className="cell-code">{p.code}</td>
                  <td className="small" style={{maxWidth:230}}>{p.name}<div className="tiny muted-2">{p.brand}</div></td>
                  <td><span className="chip">{p.group}</span></td>
                  <td><PartRankTag rank={p.partRank}/></td>
                  <td className="num mono">{p.max}</td>
                  <td className="num mono">{p.min}</td>
                  <td className="num mono">{p.safety}</td>
                  <td className="num mono" style={{fontWeight:600}}>{p.rop}</td>
                  <td className="num mono" style={{fontWeight:700, color: p.status==="critical"?"var(--red-ink)":p.status==="reorder"?"var(--amber-ink)":"var(--ink)"}}>{p.cur}</td>
                  <td><StockBadge status={p.status}/></td>
                  <td className="num mono small">{p.value?Ds.fmtMoney(p.value):"—"}</td>
                  <td className="num mono small muted">{p.leadTime}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function PartRankTag({ rank }) {
  const m = { Critical:"tag-critical", Medium:"tag-high", Low:"tag-low" };
  return <span className={"tag "+(m[rank]||"tag-low")}>{rank}</span>;
}

/* ---------------- 5.10 Reorder list ---------------- */
function ReorderList({ ctx }) {
  const [sel, setSel] = useState(()=>new Set());
  let rows = Ds.parts.filter(p => p.cur <= p.rop).map(p=>({ ...p, suggest: Math.max(p.rop - p.cur, p.min || 1) }));
  const { sorted, sort, onSort } = useSort(rows, { key:"score", dir:-1 });
  const toggle = code => setSel(s=>{ const n=new Set(s); n.has(code)?n.delete(code):n.add(code); return n; });
  const all = sorted.length>0 && sorted.every(p=>sel.has(p.code));
  const toggleAll = ()=> setSel(all? new Set() : new Set(sorted.map(p=>p.code)));
  const selRows = sorted.filter(p=>sel.has(p.code));
  const estCost = selRows.reduce((s,p)=>s + p.price*p.suggest, 0);
  return (
    <div>
      <PageHead title="รายการต้องสั่งซื้อ (Reorder)" sub={`อะไหล่ที่คงคลัง ≤ ROP · ${rows.length} รายการ`} actions={
        <><button className="btn"><Icon name="download" size={15}/> ส่งออกใบสั่งซื้อ</button>
        <button className="btn btn-primary" disabled={sel.size===0} onClick={()=>ctx.toast(`สร้างใบสั่งซื้อ ${sel.size} รายการ มูลค่า ${Ds.fmtMoney(estCost)}`,"mail")}><Icon name="plus" size={15}/> สร้าง PO ({sel.size})</button></>
      } />
      <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", marginBottom:16}}>
        <MiniStat label="ต้องสั่งซื้อ" value={rows.length} color="var(--amber)" icon="truck"/>
        <MiniStat label="ของหมด (วิกฤต)" value={rows.filter(p=>p.status==="critical").length} color="var(--red)" icon="alert"/>
        <MiniStat label="เลือกแล้ว" value={sel.size} color="var(--navy)" icon="clipboard"/>
        <MiniStat label="มูลค่าที่เลือก (ประมาณ)" value={Ds.fmtMoney(estCost)} color="var(--green)" icon="chart"/>
      </div>
      <div className="panel">
        <div className="table-wrap" style={{maxHeight:"60vh"}}>
          <table className="tbl">
            <thead><tr>
              <th style={{width:36}}><input type="checkbox" checked={all} onChange={toggleAll}/></th>
              <th>Part Code</th><th>ชื่ออะไหล่</th><th>กลุ่ม</th>
              <Th k="cur" sort={sort} onSort={onSort} align="right">คงคลัง</Th>
              <Th k="rop" sort={sort} onSort={onSort} align="right">ROP</Th>
              <Th k="suggest" sort={sort} onSort={onSort} align="right">ควรสั่ง</Th>
              <th className="num">ราคา/หน่วย</th>
              <th>แบรนด์</th>
              <Th k="leadTime" sort={sort} onSort={onSort} align="right">Lead</Th>
              <th>สถานะ</th>
            </tr></thead>
            <tbody>
              {sorted.map(p=>(
                <tr key={p.code} className={p.status==="critical"?"row-red":"row-amber"} style={{cursor:"pointer"}} onClick={()=>toggle(p.code)}>
                  <td><input type="checkbox" checked={sel.has(p.code)} onChange={()=>toggle(p.code)} onClick={e=>e.stopPropagation()}/></td>
                  <td className="cell-code">{p.code}</td>
                  <td className="small" style={{maxWidth:220}}>{p.name}</td>
                  <td><span className="chip">{p.group}</span></td>
                  <td className="num mono" style={{fontWeight:700, color:p.status==="critical"?"var(--red-ink)":"var(--amber-ink)"}}>{p.cur}</td>
                  <td className="num mono">{p.rop}</td>
                  <td className="num mono" style={{fontWeight:700}}>{p.suggest}</td>
                  <td className="num mono small">{p.price?Ds.fmtMoney(p.price):"—"}</td>
                  <td className="small muted">{p.brand}</td>
                  <td className="num mono small muted">{p.leadTime}d</td>
                  <td><StockBadge status={p.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 5.11 Stock In / Out ---------------- */
function StockInOut({ ctx }) {
  const [mode, setMode] = useState("in");
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const part = Ds.partByCode(code);
  const log = mode==="in" ? Ds.stockIn : Ds.stockOut;
  const save = ()=>{
    if(!code){ ctx.toast("กรุณาเลือกอะไหล่","error"); return; }
    ctx.toast(mode==="in" ? `รับเข้า ${code} จำนวน ${qty} · อัปเดตยอดคลังแล้ว` : `เบิกออก ${code} จำนวน ${qty} · ตัดสต็อกแล้ว`);
    setCode(""); setQty(1);
  };
  return (
    <div>
      <PageHead title="รับเข้า / เบิกออกอะไหล่" sub="Stock In / Out — บันทึกการเคลื่อนไหวคลัง" />
      <div className="grid" style={{ gridTemplateColumns:"380px 1fr", alignItems:"start" }}>
        <div className="panel">
          <div className="seg" style={{ margin:14 }}>
            <div className={"seg-opt"+(mode==="in"?" on-medium":"")} onClick={()=>setMode("in")}>รับเข้า (Stock In)</div>
            <div className={"seg-opt"+(mode==="out"?" on-high":"")} onClick={()=>setMode("out")}>เบิกออก (Stock Out)</div>
          </div>
          <div className="panel-body" style={{paddingTop:0}}>
            <div className="field"><label>อะไหล่ <span className="req">*</span></label>
              <select className="select" value={code} onChange={e=>setCode(e.target.value)}>
                <option value="">เลือกอะไหล่...</option>
                {Ds.parts.map(p=><option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}
              </select>
            </div>
            {part && <div className="card card-pad" style={{background:"var(--surface-2)", marginBottom:15, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span className="small muted">คงคลังปัจจุบัน</span>
              <span className="mono" style={{fontWeight:700, fontSize:18}}>{part.cur} <span className="tiny muted">→ {mode==="in"?part.cur+qty:Math.max(0,part.cur-qty)}</span></span>
            </div>}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:11}}>
              <div className="field"><label>จำนวน</label><input className="input" type="number" min="1" value={qty} onChange={e=>setQty(+e.target.value||1)}/></div>
              <div className="field"><label>วันที่</label><input className="input" type="date" defaultValue="2026-05-30"/></div>
            </div>
            <div className="field"><label>{mode==="in"?"ผู้รับเข้า":"ผู้เบิก"}</label><input className="input" placeholder={mode==="in"?"เช่น Store_Admin":"เช่น ช่างสมศักดิ์"}/></div>
            {mode==="out" && <div className="field"><label>เครื่องจักร / ใบแจ้ง</label><input className="input" placeholder="เช่น MC-001 / REQ-2026-001"/></div>}
            <div className="field"><label>เหตุผล</label><textarea className="textarea" style={{minHeight:64}} placeholder={mode==="in"?"เช่น รับเข้าจากใบสั่งซื้อ PO-2026-014":"เช่น ใช้ในการซ่อม / PM"}/></div>
            <button className={"btn btn-lg btn-block "+(mode==="in"?"btn-primary":"btn-danger")} onClick={save}>
              <Icon name={mode==="in"?"download":"truck"} size={17}/> {mode==="in"?"บันทึกรับเข้า":"บันทึกเบิกออก"}
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div className="h-sm">บันทึกล่าสุด — {mode==="in"?"รับเข้า":"เบิกออก"}</div><span className="chip">{log.length} รายการ</span></div>
          <div className="table-wrap" style={{maxHeight:"58vh"}}>
            <table className="tbl">
              {mode==="in" ? (
                <><thead><tr><th>วันที่</th><th>เลขเอกสาร</th><th>Part Code</th><th>รายการ</th><th className="num">รับเข้า</th><th>ผู้รับ</th></tr></thead>
                <tbody>{Ds.stockIn.map((l,i)=>(<tr key={i}><td className="mono small muted">{l.date}</td><td className="cell-code">{l.doc}</td><td className="cell-code">{l.code}</td><td className="small">{l.name}</td><td className="num mono" style={{color:"var(--green-ink)", fontWeight:700}}>+{l.qty}</td><td className="small muted">{l.by}</td></tr>))}</tbody></>
              ) : (
                <><thead><tr><th>วันที่</th><th>เลขเอกสาร</th><th>Part Code</th><th>รายการ</th><th className="num">เบิกออก</th><th>ผู้เบิก</th><th>เครื่อง</th><th>เหตุผล</th></tr></thead>
                <tbody>{Ds.stockOut.map((l,i)=>(<tr key={i}><td className="mono small muted">{l.date}</td><td className="cell-code">{l.doc}</td><td className="cell-code">{l.code}</td><td className="small">{l.name}</td><td className="num mono" style={{color:"var(--red-ink)", fontWeight:700}}>−{l.qty}</td><td className="small muted">{l.by}</td><td className="mono small">{l.mc}</td><td className="small muted" style={{maxWidth:180}}>{l.reason}</td></tr>))}</tbody></>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MasterData, ReorderList, StockInOut, PartRankTag });
