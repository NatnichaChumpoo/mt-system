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
  const [adding, setAdding] = useState(false);
  const [viewingCode, setViewingCode] = useState(null);
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
  const exportXlsx = () => {
    const data = sorted.map(p => ({
      "Part Code": p.code, "ชื่ออะไหล่": p.name, "กลุ่ม": p.group, "Part Rank": p.partRank,
      "Max": p.max, "Min": p.min, "Safety": p.safety, "ROP": p.rop, "คงคลัง": p.cur,
      "สถานะ": (STOCK_BADGE[p.status] || STOCK_BADGE.normal).label, "มูลค่า": p.value, "Lead Time (วัน)": p.leadTime,
    }));
    exportRowsToXlsx(ctx, data, "Master Data", "คลังอะไหล่_" + new Date().toISOString().slice(0,10) + ".xlsx");
  };
  return (
    <div>
      <PageHead title="คลังอะไหล่ — Master Data" sub="Spare Part Master · ควบคุมด้วย Min / Max / Safety Stock / ROP" actions={
        <><button className="btn" onClick={exportXlsx}><Icon name="download" size={15}/> ส่งออก</button><button className="btn btn-primary" onClick={()=>setAdding(true)}><Icon name="plus" size={15}/> เพิ่มอะไหล่</button></>
      } />
      {adding && <AddPartModal ctx={ctx} groups={groups.filter(g=>g!=="all")} onClose={()=>setAdding(false)} />}
      {viewingCode && <PartWorkspaceModal ctx={ctx} code={viewingCode} onClose={()=>setViewingCode(null)} />}
      <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", marginBottom:16}}>
        <MiniStat label="รายการทั้งหมด" value={Ds.parts.length} color="var(--navy)" icon="box"/>
        <MiniStat label="ของหมด" value={counts.critical} color="var(--red)" icon="alert"/>
        <MiniStat label="ควรสั่งซื้อ" value={counts.reorder} color="var(--amber)" icon="truck"/>
        <MiniStat label="มูลค่าคงคลัง" value={Ds.fmtMoney(totalVal)} color="var(--green)" icon="chart"/>
      </div>
      <div className="panel" style={{marginBottom:16}}>
        <div className="panel-head"><div className="h-sm">ตัวชี้วัดคลังอะไหล่</div></div>
        <div className="panel-body grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14}}>
          {(Ds.invKpi||[]).map(k=>{
            const color = k.state==="bad"?"var(--red)":k.state==="warn"?"var(--amber)":"var(--green)";
            const pct = k.money ? Math.min(100, k.value/(k.target*2)*100) : k.unit==="%" ? k.value : Math.min(100,k.value/k.target*100);
            return (
              <div key={k.name} className="card card-pad">
                <div className="small muted" style={{marginBottom:8}}>{k.name}</div>
                <div className="row between" style={{alignItems:"baseline"}}>
                  <span className="mono" style={{fontSize:22, fontWeight:700}}>{k.money?Ds.fmtMoney(k.value):k.value+(k.unit==="%"?"%":"")}</span>
                  <span className="tiny muted-2">เป้า {k.money?Ds.fmtMoney(k.target):k.target+(k.unit==="%"?"%":"")}</span>
                </div>
                <div className="progress" style={{marginTop:9}}><span style={{width:pct+"%", background:color}}></span></div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head wrap" style={{gap:10}}>
          <SearchBar value={q} onChange={setQ} placeholder="ค้นหา Part Code / ชื่อ / แบรนด์"/>
          <div className="row gap-sm wrap grow" style={{justifyContent:"flex-end"}}>
            <select className="select" style={{width:"auto"}} value={grp} onChange={e=>setGrp(e.target.value)}>
              {groups.map(g=><option key={g} value={g}>{g==="all"?"ทุกกลุ่ม":g}</option>)}
            </select>
            <FilterChips value={st} onChange={setSt} opts={[["all","ทั้งหมด"],["critical","ของหมด"],["reorder","ควรสั่ง"],["normal","ปกติ"]]} />
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
                <tr key={p.code} className={p.status==="critical"?"row-red":p.status==="reorder"?"row-amber":""} style={{cursor:"pointer"}} onClick={()=>setViewingCode(p.code)}>
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

function DetailField({ label, value, mono }) {
  return (
    <div className="card card-pad" style={{background:"var(--surface-2)"}}>
      <div className="tiny muted">{label}</div>
      <div className={mono?"mono":""} style={{fontWeight:700, fontSize:16, marginTop:4}}>{value}</div>
    </div>
  );
}

function PartDetailBody({ part, onEdit, onHistory }) {
  return (
    <div className="stack">
      <div className="row between" style={{alignItems:"flex-start"}}>
        <div>
          <div className="h-md">{part.name}</div>
          {part.brand && part.brand!=="—" && <div className="tiny muted-2">{part.brand}</div>}
        </div>
        <div className="row gap-sm">
          <PartRankTag rank={part.partRank}/>
          <StockBadge status={part.status}/>
        </div>
      </div>
      <div className="grid" style={{gridTemplateColumns:"repeat(4,1fr)", gap:14}}>
        <DetailField label="กลุ่มเครื่องจักร" value={part.group}/>
        <DetailField label="คงคลังปัจจุบัน" value={part.cur} mono/>
        <DetailField label="มูลค่าคงคลัง" value={part.value?Ds.fmtMoney(part.value):"—"}/>
        <DetailField label="ราคา/หน่วย" value={part.price?Ds.fmtMoney(part.price):"—"}/>
        <DetailField label="Max" value={part.max} mono/>
        <DetailField label="Min" value={part.min} mono/>
        <DetailField label="Safety Stock" value={part.safety} mono/>
        <DetailField label="ROP" value={part.rop} mono/>
        <DetailField label="Lead Time" value={part.leadTime+" วัน"}/>
        <DetailField label="สถานะ" value={(STOCK_BADGE[part.status]||STOCK_BADGE.normal).label}/>
      </div>
      <div className="row gap-sm" style={{justifyContent:"flex-end", marginTop:4}}>
        <button className="btn" onClick={onHistory}><Icon name="clock" size={15}/> ดูประวัติ</button>
        <button className="btn btn-primary" onClick={onEdit}><Icon name="edit" size={15}/> แก้ไขอะไหล่</button>
      </div>
    </div>
  );
}

function PartHistoryBody({ part }) {
  const ins = (Ds.stockIn||[]).filter(l=>l.code===part.code).map(l=>({...l, type:"IN"}));
  const outs = (Ds.stockOut||[]).filter(l=>l.code===part.code).map(l=>({...l, type:"OUT"}));
  const rows = [...ins, ...outs].sort((a,b)=> new Date(b.date) - new Date(a.date));
  return (
    <div className="stack">
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr 1fr", gap:14}}>
        <div className="card card-pad" style={{background:"var(--surface-2)"}}>
          <div className="tiny muted">คงคลังปัจจุบัน</div>
          <div className="mono" style={{fontWeight:800, fontSize:18}}>{part.cur}</div>
        </div>
        <div className="card card-pad" style={{background:"var(--surface-2)"}}>
          <div className="tiny muted">รับเข้าทั้งหมด</div>
          <div className="mono" style={{fontWeight:800, fontSize:18, color:"var(--green-ink)"}}>+{ins.reduce((s,l)=>s+l.qty,0)}</div>
        </div>
        <div className="card card-pad" style={{background:"var(--surface-2)"}}>
          <div className="tiny muted">เบิกออกทั้งหมด</div>
          <div className="mono" style={{fontWeight:800, fontSize:18, color:"var(--red-ink)"}}>−{outs.reduce((s,l)=>s+l.qty,0)}</div>
        </div>
      </div>
      <div className="table-wrap" style={{maxHeight:360}}>
        <table className="tbl">
          <thead><tr><th>วันที่</th><th>เลขเอกสาร</th><th>ประเภท</th><th className="num">จำนวน</th><th>โดย</th><th>เครื่อง / เหตุผล</th></tr></thead>
          <tbody>{rows.map((l,i)=>(
            <tr key={i}>
              <td className="mono small muted">{l.date}</td>
              <td className="cell-code">{l.doc}</td>
              <td>{l.type==="IN" ? <span className="tag tag-low">รับเข้า</span> : <span className="tag tag-critical">เบิกออก</span>}</td>
              <td className="num mono" style={{fontWeight:700, color:l.type==="IN"?"var(--green-ink)":"var(--red-ink)"}}>{l.type==="IN"?"+":"−"}{l.qty}</td>
              <td className="small muted">{l.by}</td>
              <td className="small muted">{l.type==="OUT" ? [l.mc, l.reason].filter(Boolean).join(" · ") : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
        {rows.length === 0 && <div className="small muted" style={{padding:24, textAlign:"center"}}>ยังไม่มีประวัติการเคลื่อนไหวสำหรับอะไหล่นี้</div>}
      </div>
    </div>
  );
}

function PartWorkspaceModal({ ctx, code, onClose }) {
  const [subView, setSubView] = useState("detail"); // "detail" | "history" | "edit"
  const part = Ds.partByCode(code);
  if (!part) return null;
  const back = () => setSubView("detail");
  const titles = {
    detail: `รายละเอียดอะไหล่ — ${part.code}`,
    history: `ประวัติการเคลื่อนไหว — ${part.code} ${part.name}`,
    edit: `แก้ไขอะไหล่ — ${part.code}`,
  };
  return (
    <Modal title={titles[subView]} onClose={onClose} wide>
      {subView !== "detail" &&
        <button className="btn" style={{marginBottom:14}} onClick={back}>
          <Icon name="chevL" size={14}/> กลับไปหน้ารายละเอียด
        </button>
      }
      {subView === "detail" && <PartDetailBody part={part} onEdit={()=>setSubView("edit")} onHistory={()=>setSubView("history")} />}
      {subView === "history" && <PartHistoryBody part={part} />}
      {subView === "edit" && <EditPartFields ctx={ctx} part={part} onDone={back} onCancel={back} />}
    </Modal>
  );
}

function AddPartModal({ ctx, groups, onClose }) {
  const ranks = ["Critical","Medium","Low"];
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [group, setGroup] = useState(groups[0] || "");
  const [partRank, setPartRank] = useState("Medium");
  const [max, setMax] = useState("");
  const [min, setMin] = useState("");
  const [safety, setSafety] = useState("");
  const [rop, setRop] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    if (!code.trim() || !name.trim() || !group) { ctx.toast("กรุณากรอกรหัส ชื่อ และกลุ่มอะไหล่", "error"); return; }
    if (typeof Ds.createPart !== "function") { ctx.toast("ระบบยังไม่รองรับการบันทึกลง DB", "error"); return; }
    setSubmitting(true);
    try {
      await Ds.createPart({
        code: code.trim(), name: name.trim(), group, partRank,
        max: Number(max) || 0, min: Number(min) || 0, safety: Number(safety) || 0,
        rop: Number(rop) || 0, price: Number(price) || 0,
      });
      if (typeof Ds.refresh === "function") await Ds.refresh();
      window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast("เพิ่มอะไหล่ "+code.trim()+" แล้ว", "check");
      onClose();
    } catch (err) {
      ctx.toast("บันทึกไม่สำเร็จ: "+err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="เพิ่มอะไหล่ใหม่" onClose={onClose} wide>
      <div className="stack">
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
          <div className="field"><label>รหัสอะไหล่ (Code) <span className="req">*</span></label>
            <input className="input" value={code} onChange={e=>setCode(e.target.value)} placeholder="เช่น PT-99"/></div>
          <div className="field"><label>ชื่ออะไหล่ <span className="req">*</span></label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="ชื่ออะไหล่"/></div>
        </div>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
          <div className="field"><label>กลุ่มเครื่องจักร <span className="req">*</span></label>
            <select className="select" value={group} onChange={e=>setGroup(e.target.value)}>
              {groups.map(g=><option key={g} value={g}>{g}</option>)}
            </select></div>
          <div className="field"><label>Part Rank</label>
            <div className="seg">{ranks.map(r=><div key={r} className={"seg-opt"+(partRank===r?" on-"+r.toLowerCase():"")} onClick={()=>setPartRank(r)}>{r}</div>)}</div></div>
        </div>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14}}>
          <div className="field"><label>Min</label><input className="input" type="number" value={min} onChange={e=>setMin(e.target.value)} placeholder="0"/></div>
          <div className="field"><label>Max</label><input className="input" type="number" value={max} onChange={e=>setMax(e.target.value)} placeholder="0"/></div>
          <div className="field"><label>Safety</label><input className="input" type="number" value={safety} onChange={e=>setSafety(e.target.value)} placeholder="0"/></div>
          <div className="field"><label>ROP</label><input className="input" type="number" value={rop} onChange={e=>setRop(e.target.value)} placeholder="0"/></div>
        </div>
        <div className="field"><label>ราคาต่อหน่วย (บาท)</label>
          <input className="input" type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0"/></div>
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
          <Icon name="check" size={18}/> {submitting?"กำลังบันทึก...":"บันทึกอะไหล่"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- 5.10 Reorder list ---------------- */
function CreatePOModal({ ctx, rows, onClose, onDone }) {
  const [supplier, setSupplier] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const total = rows.reduce((s,p)=>s + p.price*p.suggest, 0);

  const submit = async () => {
    if (submitting) return;
    if (!supplier) { ctx.toast("กรุณาเลือกผู้ขาย", "error"); return; }
    if (typeof Ds.createPO !== "function") { ctx.toast("ระบบยังไม่รองรับการบันทึกลง DB", "error"); return; }
    setSubmitting(true);
    try {
      const j = await Ds.createPO({
        supplier, expectedDate: expectedDate || null, note: note.trim() || null,
        items: rows.map(p=>({ code:p.code, qty:p.suggest })),
      });
      if (typeof Ds.refresh === "function") await Ds.refresh();
      window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast(`สร้างใบสั่งซื้อ ${j.po_no} แล้ว · มูลค่า ${Ds.fmtMoney(j.total)}`, "check");
      onDone();
    } catch (err) {
      ctx.toast("สร้าง PO ไม่สำเร็จ: "+err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`สร้างใบสั่งซื้อ (${rows.length} รายการ)`} onClose={onClose} wide>
      <div className="stack">
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
          <div className="field"><label>ผู้ขาย <span className="req">*</span></label>
            <select className="select" value={supplier} onChange={e=>setSupplier(e.target.value)}>
              <option value="">เลือกผู้ขาย...</option>
              {(Ds.suppliers||[]).map(s=><option key={s.name} value={s.name}>{s.name} · lead time {s.leadTime}d</option>)}
            </select></div>
          <div className="field"><label>วันที่คาดว่าจะได้รับ</label>
            <input className="input" type="date" value={expectedDate} onChange={e=>setExpectedDate(e.target.value)}/></div>
        </div>
        <div className="field"><label>หมายเหตุ</label>
          <textarea className="textarea" style={{minHeight:60}} value={note} onChange={e=>setNote(e.target.value)} placeholder="เช่น เร่งด่วน / สำหรับเครื่อง MC-xxx"/></div>
        <div className="panel" style={{margin:0}}>
          <div className="panel-head"><div className="h-sm">รายการที่จะสั่งซื้อ</div><span className="chip">{rows.length} รายการ</span></div>
          <div className="table-wrap" style={{maxHeight:260}}>
            <table className="tbl">
              <thead><tr><th>Part Code</th><th>ชื่ออะไหล่</th><th className="num">ควรสั่ง</th><th className="num">ราคา/หน่วย</th><th className="num">รวม</th></tr></thead>
              <tbody>{rows.map(p=>(
                <tr key={p.code}>
                  <td className="cell-code">{p.code}</td>
                  <td className="small">{p.name}</td>
                  <td className="num mono" style={{fontWeight:700}}>{p.suggest}</td>
                  <td className="num mono small">{Ds.fmtMoney(p.price)}</td>
                  <td className="num mono small" style={{fontWeight:700}}>{Ds.fmtMoney(p.price*p.suggest)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 2px"}}>
          <span className="small muted">มูลค่ารวมโดยประมาณ</span>
          <span className="mono" style={{fontWeight:800, fontSize:18, color:"var(--green-ink)"}}>{Ds.fmtMoney(total)}</span>
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={submitting}>
          <Icon name="check" size={18}/> {submitting?"กำลังบันทึก...":"ยืนยันสร้างใบสั่งซื้อ"}
        </button>
      </div>
    </Modal>
  );
}

function ReorderList({ ctx }) {
  const [sel, setSel] = useState(()=>new Set());
  const [showCreatePO, setShowCreatePO] = useState(false);
  let rows = Ds.parts.filter(p => p.cur <= p.rop).map(p=>({ ...p, suggest: Math.max(p.rop - p.cur, p.min || 1) }));
  const { sorted, sort, onSort } = useSort(rows, { key:"score", dir:-1 });
  const toggle = code => setSel(s=>{ const n=new Set(s); n.has(code)?n.delete(code):n.add(code); return n; });
  const all = sorted.length>0 && sorted.every(p=>sel.has(p.code));
  const toggleAll = ()=> setSel(all? new Set() : new Set(sorted.map(p=>p.code)));
  const selRows = sorted.filter(p=>sel.has(p.code));
  const estCost = selRows.reduce((s,p)=>s + p.price*p.suggest, 0);
  const exportPOExcel = () => {
    const rowsToExport = selRows.length > 0 ? selRows : sorted;
    const data = rowsToExport.map(p => ({
      "Part Code": p.code, "ชื่ออะไหล่": p.name, "กลุ่ม": p.group, "แบรนด์": p.brand,
      "คงคลัง": p.cur, "ROP": p.rop, "ควรสั่ง": p.suggest,
      "ราคา/หน่วย": p.price, "มูลค่ารวม": p.price * p.suggest, "Lead Time (วัน)": p.leadTime,
    }));
    exportRowsToXlsx(ctx, data, "ใบสั่งซื้อ", "ใบสั่งซื้อ_" + new Date().toISOString().slice(0,10) + ".xlsx", {
      emptyMsg: "ไม่มีรายการให้ส่งออก",
      successMsg: "ส่งออกใบสั่งซื้อ " + data.length + " รายการแล้ว",
    });
  };
  const buildPODoc = () => {
    const rowsToExport = selRows.length > 0 ? selRows : sorted;
    if (rowsToExport.length === 0) { ctx.toast("ไม่มีรายการให้ส่งออก", "error"); return null; }
    const total = rowsToExport.reduce((s,p)=>s + p.price*p.suggest, 0);
    return {
      title: "ใบขอสั่งซื้ออะไหล่ (Reorder)",
      meta: [
        { label:"เลขที่", value: "DRAFT" },
        { label:"วันที่ออกเอกสาร", value: new Date().toLocaleDateString("th-TH") },
        { label:"จำนวนรายการ", value: rowsToExport.length + " รายการ" },
      ],
      items: rowsToExport.map(p => ({ code:p.code, name:p.name, qty:p.suggest, unit:Ds.fmtMoney(p.price), sum:Ds.fmtMoney(p.price*p.suggest) })),
      total: Ds.fmtMoney(total),
    };
  };
  const exportPOPdf = () => { const doc = buildPODoc(); if (doc) printPODocument(doc); };
  const exportPOWord = () => { const doc = buildPODoc(); if (doc) downloadPOWordDoc(doc); };
  return (
    <div>
      <PageHead title="รายการต้องสั่งซื้อ (Reorder)" sub={`อะไหล่ที่คงคลัง ≤ ROP · ${rows.length} รายการ`} actions={
        <><ExportMenuButton label="ส่งออกใบสั่งซื้อ" onExcel={exportPOExcel} onPdf={exportPOPdf} onWord={exportPOWord} />
        <button className="btn btn-primary" disabled={sel.size===0} onClick={()=>setShowCreatePO(true)}><Icon name="plus" size={15}/> สร้าง PO ({sel.size})</button></>
      } />
      {showCreatePO && <CreatePOModal ctx={ctx} rows={selRows} onClose={()=>setShowCreatePO(false)}
        onDone={()=>{ setShowCreatePO(false); setSel(new Set()); }} />}
      <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", marginBottom:16}}>
        <MiniStat label="ต้องสั่งซื้อ" value={rows.length} color="var(--amber)" icon="truck"/>
        <MiniStat label="ของหมด" value={rows.filter(p=>p.status==="critical").length} color="var(--red)" icon="alert"/>
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

/* ---------------- 5.10b ประวัติใบสั่งซื้อ ---------------- */
function PODetailModal({ ctx, po, onClose }) {
  const items = (Ds.poItems && Ds.poItems[po.no]) || [];
  const exportExcel = () => {
    const data = items.map(it => ({
      "Part Code": it.code, "ชื่ออะไหล่": it.name, "จำนวน": it.qty,
      "ราคา/หน่วย": it.unit, "มูลค่ารวม": it.unit*it.qty,
    }));
    exportRowsToXlsx(ctx, data, po.no, `ใบสั่งซื้อ_${po.no}.xlsx`, { successMsg: "ส่งออก " + po.no + " แล้ว" });
  };
  const buildPODoc = () => ({
    title: `ใบสั่งซื้อ ${po.no}`,
    supplier: po.supplier,
    meta: [
      { label:"เลขที่", value: po.no },
      { label:"วันที่ออกเอกสาร", value: po.date },
      { label:"กำหนดรับ", value: po.expected || "—" },
    ],
    items: items.map(it => ({ code:it.code, name:it.name, qty:it.qty, unit:Ds.fmtMoney(it.unit), sum:Ds.fmtMoney(it.unit*it.qty) })),
    note: po.note,
    total: Ds.fmtMoney(po.total),
  });
  const exportPdf = () => printPODocument(buildPODoc());
  const exportWord = () => downloadPOWordDoc(buildPODoc());
  return (
    <Modal title={`ใบสั่งซื้อ ${po.no}`} onClose={onClose} wide>
      <div className="stack">
        <div className="row" style={{justifyContent:"flex-end"}}>
          <ExportMenuButton label="ส่งออก" onExcel={exportExcel} onPdf={exportPdf} onWord={exportWord} />
        </div>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:14}}>
          <div className="card card-pad" style={{background:"var(--surface-2)"}}>
            <div className="tiny muted">ผู้ขาย</div>
            <div style={{fontWeight:700}}>{po.supplier}</div>
          </div>
          <div className="card card-pad" style={{background:"var(--surface-2)"}}>
            <div className="tiny muted">มูลค่ารวม</div>
            <div className="mono" style={{fontWeight:800, fontSize:18, color:"var(--green-ink)"}}>{Ds.fmtMoney(po.total)}</div>
          </div>
        </div>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr 1fr", gap:14}}>
          <div className="field"><label>วันที่สร้าง</label><div className="mono small">{po.date}</div></div>
          <div className="field"><label>กำหนดรับ</label><div className="mono small">{po.expected || "—"}</div></div>
          <div className="field"><label>จำนวนรายการ</label><div className="mono small">{po.items} รายการ</div></div>
        </div>
        {po.note && <div className="field"><label>หมายเหตุ</label><div className="small">{po.note}</div></div>}
        <div className="panel" style={{margin:0}}>
          <div className="panel-head"><div className="h-sm">รายการอะไหล่ในใบสั่งซื้อ</div><span className="chip">{items.length} รายการ</span></div>
          <div className="table-wrap" style={{maxHeight:300}}>
            <table className="tbl">
              <thead><tr><th>Part Code</th><th>ชื่ออะไหล่</th><th className="num">จำนวน</th><th className="num">ราคา/หน่วย</th><th className="num">รวม</th></tr></thead>
              <tbody>{items.map((it,i)=>(
                <tr key={i}>
                  <td className="cell-code">{it.code}</td>
                  <td className="small">{it.name}</td>
                  <td className="num mono" style={{fontWeight:700}}>{it.qty}</td>
                  <td className="num mono small">{Ds.fmtMoney(it.unit)}</td>
                  <td className="num mono small" style={{fontWeight:700}}>{Ds.fmtMoney(it.unit*it.qty)}</td>
                </tr>
              ))}</tbody>
            </table>
            {items.length === 0 && <div className="small muted" style={{padding:18, textAlign:"center"}}>ไม่พบรายการอะไหล่</div>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function POHistory({ ctx }) {
  const pos = Ds.purchaseOrders || [];
  const [selPO, setSelPO] = useState(null);
  return (
    <div>
      <PageHead title="ประวัติใบสั่งซื้อ" sub={`รายการ PO ที่สร้างไว้ทั้งหมด · ${pos.length} รายการ · คลิกแถวเพื่อดูรายละเอียด`} />
      <div className="panel">
        <div className="panel-head"><div className="h-sm">ใบสั่งซื้อทั้งหมด</div><span className="chip">{pos.length} รายการ</span></div>
        <div className="table-wrap" style={{maxHeight:"70vh"}}>
          <table className="tbl">
            <thead><tr><th>เลขที่ PO</th><th>วันที่สร้าง</th><th>ผู้ขาย</th><th className="num">จำนวนรายการ</th><th className="num">มูลค่ารวม</th><th>กำหนดรับ</th><th>หมายเหตุ</th></tr></thead>
            <tbody>{pos.map((po,i)=>(
              <tr key={i} style={{cursor:"pointer"}} onClick={()=>setSelPO(po)}>
                <td className="cell-code">{po.no}</td>
                <td className="mono small muted">{po.date}</td>
                <td className="small">{po.supplier}</td>
                <td className="num mono">{po.items}</td>
                <td className="num mono" style={{fontWeight:700}}>{Ds.fmtMoney(po.total)}</td>
                <td className="mono small muted">{po.expected || "—"}</td>
                <td className="small muted" style={{maxWidth:260}}>{po.note}</td>
              </tr>
            ))}</tbody>
          </table>
          {pos.length === 0 && <div className="small muted" style={{padding:24, textAlign:"center"}}>ยังไม่มีใบสั่งซื้อที่สร้างไว้</div>}
        </div>
      </div>
      {selPO && <PODetailModal ctx={ctx} po={selPO} onClose={()=>setSelPO(null)} />}
    </div>
  );
}

/* ---------------- 5.11 Stock In / Out ---------------- */
function StockInOut({ ctx }) {
  const [mode, setMode] = useState("in");
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const currentUser = Ds.roleUser?.[ctx.role]?.name || "";
  const [by, setBy] = useState(currentUser);
  const [mc, setMc] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [submitting, setSubmitting] = useState(false);
  const part = Ds.partByCode(code);
  const log = mode==="in" ? Ds.stockIn : Ds.stockOut;
  const reset = () => { setCode(""); setQty(1); setBy(currentUser); setMc(""); setReason(""); };
  const save = async ()=>{
    if (submitting) return;
    if(!code){ ctx.toast("กรุณาเลือกอะไหล่","error"); return; }
    if (mode==="out" && part && qty > part.cur) { ctx.toast("คงคลังไม่พอสำหรับการเบิก","error"); return; }
    if (typeof Ds.recordStockMove !== "function") { ctx.toast("ระบบยังไม่รองรับการบันทึกลง DB","error"); return; }
    setSubmitting(true);
    try {
      await Ds.recordStockMove({
        code, type: mode==="in" ? "IN" : "OUT", qty,
        by: by.trim() || null, reason: reason.trim() || null, mc: mc.trim() || null, date,
      });
      if (typeof Ds.refresh === "function") await Ds.refresh();
      window.dispatchEvent(new Event("mt-data-refresh"));
      ctx.toast(mode==="in" ? `รับเข้า ${code} จำนวน ${qty} · อัปเดตยอดคลังแล้ว` : `เบิกออก ${code} จำนวน ${qty} · ตัดสต็อกแล้ว`, "check");
      reset();
    } catch (err) {
      ctx.toast("บันทึกไม่สำเร็จ: "+err.message, "error");
    } finally {
      setSubmitting(false);
    }
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
              <div className="field"><label>วันที่</label><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
            </div>
            <div className="field"><label>{mode==="in"?"ผู้รับเข้า":"ผู้เบิก"}</label><input className="input" value={by} onChange={e=>setBy(e.target.value)} placeholder={mode==="in"?"เช่น Store_Admin":"เช่น ช่างสมศักดิ์"}/></div>
            {mode==="out" && <div className="field"><label>เครื่องจักร / ใบแจ้ง</label><input className="input" value={mc} onChange={e=>setMc(e.target.value)} placeholder="เช่น MC-001 / REQ-2026-001"/></div>}
            <div className="field"><label>เหตุผล</label><textarea className="textarea" style={{minHeight:64}} value={reason} onChange={e=>setReason(e.target.value)} placeholder={mode==="in"?"เช่น รับเข้าจากใบสั่งซื้อ PO-2026-014":"เช่น ใช้ในการซ่อม / PM"}/></div>
            <button className={"btn btn-lg btn-block "+(mode==="in"?"btn-primary":"btn-danger")} onClick={save} disabled={submitting}>
              <Icon name={mode==="in"?"download":"truck"} size={17}/> {submitting ? "กำลังบันทึก..." : (mode==="in"?"บันทึกรับเข้า":"บันทึกเบิกออก")}
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

Object.assign(window, { MasterData, ReorderList, StockInOut, POHistory, PartRankTag });
